from flask import Flask, request, jsonify, Response
from flask_ngrok import run_with_ngrok  
from flask_cors import CORS
from transformers import Qwen2VLForConditionalGeneration, AutoTokenizer, AutoProcessor, pipeline, AutoModelForTokenClassification, AutoModelForCausalLM
from qwen_vl_utils import process_vision_info
import torch
import glob
from PIL import Image
from pyngrok import ngrok, conf
import os
import getpass
import threading
import io
import csv
import logging


# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "headers": ["Content-Type", "Authorization"]}})

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

        # No need for file:// references, work directly with the in-memory image
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "image": img,  # Directly use the image object
                        "resized_height": height,
                        "resized_width": width,
                    },
                    {"type": "text", "text": "Only give me the 'provisional diagnosis' and nothing else. Write 'empty' if not found."},
                ],
            }
        ]

        # Prepare input for the model
        text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        image_inputs, video_inputs = process_vision_info(messages)  # Assuming process_vision_info handles images correctly
        inputs = processor(text=[text], images=image_inputs, videos=video_inputs, padding=True, return_tensors="pt")
        # inputs = inputs.to("cuda")

        # Generate output from the model
        generated_ids = model.generate(**inputs, max_new_tokens=128)
        generated_ids_trimmed = [out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)]
        output_text = processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0]

        # Post-processing of the output
        if " is" in output_text:
            output_text = output_text[output_text.find(" is") + 3:]
        if " was" in output_text:
            output_text = output_text[output_text.find(" was") + 4:]
        output_text = output_text[output_text.find(":") + 1:]
        output_text = output_text.strip(''' .'":`\n''').replace('"', "").replace("'", "")

        return output_text
    except Exception as e:
        logging.error(f"Error processing image: {e}")
        return f"Error processing image: {str(e)}"

@app.route("/")
def index():
    return "Hello I'm alive!"

@app.route("/process_images", methods=["POST"])
def handle_images():
    try:
        if "images" not in request.files:
            logging.debug("No images uploaded")
            return jsonify({"error": "No images uploaded"}), 400

        image_files = request.files.getlist("images")

        if not image_files:
            logging.debug("No files found")
            return jsonify({"error": "No files found"}), 400

        results = []

        for image_file in image_files:
            if not allowed_file(image_file.filename):
                results.append({"file_name": image_file.filename, "provisional_diagnosis": "Invalid format"})
                continue

            # Process the image with the model
            result = process_image(image_file)

            # Append result to the list
            results.append({"file_name": image_file.filename, "provisional_diagnosis": result})

        # Return JSON response
        return jsonify(results), 200

    except Exception as e:
        logging.error(f"Error in handle_images: {e}")
        return jsonify({"error": str(e)}), 500

## running the flask app

if __name__ == "__main__":
    app.run(port=5000, debug=True)