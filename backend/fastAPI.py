from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
import io
import base64
import requests
import os
from groq import Groq
import pandas as pd
import json
import uvicorn
from threading import Thread
from dotenv import load_dotenv
from pyngrok import ngrok, conf
import getpass

load_dotenv()

openai_api_key = os.getenv('OPENAI_API_KEY')
api_key_llm = os.getenv('GROQ_API_KEY_LLM')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp', 'gif', 'tiff'}

# Function to check if file is valid
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Function to encode the image
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# def gpt_output(image_path):
#     '''Process the uploaded image file with OpenAI's API to extract text from diagnosis fields.'''
#     try:
#         # Get the base64 string for the image
#         base64_image = encode_image(image_path)

#         # Set up the headers for the API request
#         headers = {
#             "Content-Type": "application/json",
#             "Authorization": f"Bearer {openai_api_key}"
#         }

#         # Prepare the payload for the API request
#         payload = {
#             "model": "chatgpt-4o-latest",  # Specify the appropriate OpenAI model
#             "messages": [
#                 {
#                     "role": "user",
#                     "content": [
#                         {
#                             "type": "text",
#                             "text": '''
#                             Extract the provisional diagnosis from the image provided exactly as it is.
#                             Use your medical knowledge to refine and interpret the diagnosis, ensuring it aligns with standard medical terminology.
#                             When providing the confidence score (between 0 to 1), base it on the following factors:
#                             1. How closely the extracted diagnosis matches standard medical terms (e.g., ICD-10 codes or recognized variations).
#                             2. Whether the terms are commonly used or have clear medical relevance.
#                             Take your time but give correct answer.
#                             Output Format (Adhere strictly):
#                               Provisional Diagnosis: {diagnosis_value}
#                               Confidence Score: {confidence_value}
#                             The first line should contain the Provisional diagnosis, and the confidence score should be on the second line.
#                                 '''
#                         },
#                         {
#                             "type": "image_url",
#                             "image_url": {
#                                 "url": f"data:image/png;base64,{base64_image}"
#                             }
#                         }
#                     ]
#                 }
#             ],
#             "max_tokens": 300
#         }

#         # Make the API call
#         response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)

#         # Check for a successful response
#         if response.status_code == 200:
#             # Extract the content from the response and return it as a string
#             response_json = response.json()
#             result_string = response_json['choices'][0]['message']['content'].strip()  # Return the response content as a string
#             results =  result_string.split('\n')
#             return results
#         else:
#             return f"Error: {response.status_code} - {response.text}"

#     except Exception as e:
#         return f"Error processing image: {str(e)}"

def gpt_output(image_file):
    '''Process the uploaded image file with OpenAI's API to extract text from diagnosis fields.'''
    try:
        # Get the base64 string for the image
        base64_image = base64.b64encode(image_file.read()).decode('utf-8')
        image_file.seek(0)  # Reset file pointer for further use if needed

        # Set up the headers for the API request
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {openai_api_key}"
        }

        # Prepare the payload for the API request
        payload = {
            "model": "chatgpt-4o-latest",  # Specify the appropriate OpenAI model
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": '''
                            Extract the provisional diagnosis from the image provided exactly as it is.
                            Use your medical knowledge to refine and interpret the diagnosis, ensuring it aligns with standard medical terminology.
                            When providing the confidence score (between 0 to 1), base it on the following factors:
                            1. How closely the extracted diagnosis matches standard medical terms (e.g., ICD-10 codes or recognized variations).
                            2. Whether the terms are commonly used or have clear medical relevance.
                            Take your time but give correct answer.
                            Output Format (Adhere strictly):
                              Provisional Diagnosis: {diagnosis_value}
                              Confidence Score: {confidence_value}
                            The first line should contain the Provisional diagnosis, and the confidence score should be on the second line.
                                '''
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 300
        }

        # Make the API call
        response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)

        # Check for a successful response
        if response.status_code == 200:
            response_json = response.json()
            result_string = response_json['choices'][0]['message']['content'].strip()
            results =  result_string.split('\n')
            return results
        else:
            return f"Error: {response.status_code} - {response.text}"

    except Exception as e:
        return f"Error processing image: {str(e)}"

def llm_output(diagnosis_value, confidence_value):
    # Fetch the API key from environment variables
    # api_key = os.getenv("GROQ_API_KEY")

    # # Step 1: Process Image with VLM
    # vlm_output = process_image(image_file)
    # # cleaned_vlm_output = clean_vlm_output(vlm_output)

    # print(vlm_output)  # To inspect the extracted diagnosis

    # Step 2: Prepare the prompt for Groq LLM API

    prompt = (
    "Given the input Provisional Diagnosis and Confidence Score from text extraction model, apply medical context to provide the corrected diagnosis. "
    "DO NOT expand or change short forms unless they are incorrect. Maintain them as they are in the output. "
    "If the confidence score is high (>=96%), make minimal changes. If the confidence score is low (<96%), refine the diagnosis carefully. but still keep short forms as they are unless they are clearly wrong."

    "Input Format (For your reference only):"
    f"Provisional Diagnosis: {diagnosis_value} "
    f"Confidence Score: {confidence_value} in percentage "

    "Output should be in the EXACT specified format. Do NOT output anything else. "
    "When providing the confidence score (between 0 to 1), base it on the following factors:"
                                        "1. How closely the extracted diagnosis matches standard medical terms (e.g., ICD-10 codes or recognized variations)."
                                        "2. Whether the terms are commonly used or have clear medical relevance."

        "Output the result as a valid JSON object with the following structure: "
        "{"
        '"Extracted_Diagnosis": "<corrected_diagnosis>", '
        '"Confidence_Score": <your_own_confidence_score>'
        "}. The Confidence Score must be a float between 0 and 1, and all responses must adhere to JSON syntax. "

    )

    # Step 3: Set up the Groq client and call the model
    client = Groq(api_key=api_key_llm)  # Pass API key here

    completion = client.chat.completions.create(
        model="llama-3.1-70b-versatile",  # Specify the Groq model here
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=1,  # Adjust temperature for creativity/variance
        max_tokens=1024,  # Limit the maximum tokens for response
        top_p=1,  # Sampling from top-p values (alternative to top-k)
        stream=True,  # Enable streaming for faster output
        stop=None,  # No stop sequence specified, change if necessary
    )

    corrected_text = ""
    for chunk in completion:
        corrected_text += chunk.choices[0].delta.content or ""

    # Step 5: Validate if the output is valid JSON
    try:
        result_json = json.loads(corrected_text)  # Parse the JSON output from LLM
        # return json.dumps(result_json, indent=4)  # Return the pretty-printed JSON
        return result_json

    except json.JSONDecodeError:
        # Handle the case where the LLM did not return valid JSON
        return f"Error: Invalid JSON output - {corrected_text}"
    
def process_image(image_file):
  gpt_output_list = gpt_output(image_file)

  diagnosis_value = gpt_output_list[0].split(':')[1]
  confidence_value = gpt_output_list[1].split(':')[1]

  final_diagnosis = llm_output(diagnosis_value, confidence_value)

  return final_diagnosis

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

@app.get("/")
def index():
    return {"message": "Hello, I'm alive!"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    return {"filename": file.filename}

@app.post("/process_images")
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
            result_json = process_image(image_file.file)
            # diagnosis_value = result_json[0].split(':')[1]
            # confidence_value = result_json[1].split(':')[1]
            diagnosis_value = result_json['Extracted_Diagnosis']
            confidence_value = result_json['Confidence_Score']
            print(diagnosis_value)
            print(confidence_value)

            # Append result to the list
            results.append({"file_name": image_file.filename, "provisional_diagnosis": diagnosis_value, "Confidence_score": confidence_value})

        # Return JSON response
        return JSONResponse(content=results)

    except Exception as e:
        logging.error(f"Error in handle_images: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
# thread = Thread(target=run)
    # thread.start()

# if __name__ == "__main__":
#     def run():
#         uvicorn.run(app, host="0.0.0.0", port=5000)

#     thread = Thread(target=run)
#     thread.start()
    
#     print("Enter your authtoken, which can be copied from https://dashboard.ngrok.com/get-started/your-authtoken")
#     conf.get_default().auth_token = getpass.getpass()
#     # Start ngrok
#     public_url = ngrok.connect(5000)
#     print("FastAPI is running on:", public_url)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)


