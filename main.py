import os
import sys
import torch
import pandas as pd
from PIL import Image
from transformers import Qwen2VLForConditionalGeneration, AutoProcessor
from qwen_vl_utils import process_vision_info

# Load the model and processor
model = Qwen2VLForConditionalGeneration.from_pretrained(
    "Qwen/Qwen2-VL-7B-Instruct-GPTQ-Int4", torch_dtype="auto", device_map="auto"
)
processor = AutoProcessor.from_pretrained("Qwen/Qwen2-VL-7B-Instruct-GPTQ-Int4")

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp', 'gif', 'tiff'}

def allowed_file(filename):
    '''
    Check if the uploaded file has a valid image extension.
    '''
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_image(image_file):
    '''
    Process the uploaded image file with the model and return the generated output.
    '''
    try:
        # Load image from the in-memory file-like object
        img = Image.open(image_file)
        width, height = img.size

        # Create messages for model input
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
        
        #move inputs to GPU
        inputs=inputs.to('cuda')

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
        return f"Error processing image: {str(e)}"

def process_folder(folder_path):
    '''
    Process all valid image files in the specified folder.
    '''
    try:
        # Get all image files from the folder
        image_files = [f for f in os.listdir(folder_path) if allowed_file(f)]
        results = []

        # Process each image
        for image_file in image_files:
            image_path = os.path.join(folder_path, image_file)
            print(f"Processing file: {image_file}")  # Print the file being processed

            with open(image_path, 'rb') as img_file:
                result = process_image(img_file)
                results.append({"file_name": image_file, "provisional_diagnosis": result})

            print(f"Finished processing file: {image_file}")  # Print a message when done

        # Create a DataFrame from the results
        df = pd.DataFrame(results)

        # Save the DataFrame to a CSV file
        output_path = os.path.abspath(os.path.join(folder_path, '..', 'diagnosis_results.csv'))
        df.to_csv(output_path, index=False)
        print(f"Results saved to {output_path}")

    except Exception as e:
        print(f"Error processing folder: {str(e)}")


def main():
    '''
    Entry point of the script.
    '''
    if len(sys.argv) != 2:
        print("Usage: python main.py <folder_path>")
        sys.exit(1)

    folder_path = sys.argv[1]
    process_folder(folder_path)


if __name__ =="__main__":
    main()