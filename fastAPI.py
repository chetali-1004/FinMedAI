from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from transformers import Qwen2VLForConditionalGeneration, AutoProcessor
from qwen_vl_utils import process_vision_info
from PIL import Image
import torch
import logging
import io
import uvicorn
from threading import Thread

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Initialize FastAPI app
app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this for production
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Load the model and processor
model = Qwen2VLForConditionalGeneration.from_pretrained(
    "Qwen/Qwen2-VL-7B-Instruct-GPTQ-Int4", torch_dtype="auto", device_map="auto"
)
processor = AutoProcessor.from_pretrained("Qwen/Qwen2-VL-7B-Instruct-GPTQ-Int4")

# Supported image file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp', 'gif', 'tiff'}

# Helper function to check file extension
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Define the inference function
def process_image(image_file):
    try:
        # Load image from the in-memory file-like object
        img = Image.open(image_file)
        width, height = img.size

        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "image": img,
                        "resized_height": height,
                        "resized_width": width,
                    },
                    {"type": "text", "text": "Only give me the 'provisional diagnosis' and nothing else. Write 'empty' if not found."},
                ],
            }
        ]

        # Prepare input for the model
        text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        image_inputs, video_inputs = process_vision_info(messages)
        inputs = processor(text=[text], images=image_inputs, videos=video_inputs, padding=True, return_tensors="pt")

        inputs = inputs.to("cuda")

        # Generate output from the model
        generated_ids = model.generate(**inputs, max_new_tokens=128)
        generated_ids_trimmed = [out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)]
        output_text = processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0]

        # Post-processing of the output
        if " is" in output_text:
            output_text = output_text[output_text.find(" is") + 3:]
        if " was" in output_text:
            output_text = output_text[output_text.find(" was") + 4:]
        output_text = output_text[output_text.find(":") + 1:].strip(''' .'":`\n''').replace('"', "").replace("'", "")

        return output_text
    except Exception as e:
        logging.error(f"Error processing image: {e}")
        return f"Error processing image: {str(e)}"

@app.get("/")
def index():
    return {"message": "Hello, I'm alive!"}

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    return {"filename": file.filename}

@app.post("/process_images/")
async def handle_images(images: list[UploadFile] = File(...)):
    try:
        if not images:
            logging.debug("No files found")
            raise HTTPException(status_code=400, detail="No files found")

        results = []

        for image_file in images:
            if not allowed_file(image_file.filename):
                results.append({"file_name": image_file.filename, "provisional_diagnosis": "Invalid format"})
                continue

            # Process the image with the model
            result = process_image(image_file.file)

            # Append result to the list
            results.append({"file_name": image_file.filename, "provisional_diagnosis": result})

        # Return JSON response
        return JSONResponse(content=results)

    except Exception as e:
        logging.error(f"Error in handle_images: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# To run the FastAPI app, use:
# uvicorn filename:app --reload

if __name__ == "__main__":
    uvicorn.run(app, host='localhost', port=8000)
    
# def run():
#     uvicorn.run(app, host="0.0.0.0", port=5000)

# thread = Thread(target=run)
# thread.start()