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
from fuzzywuzzy import process, fuzz


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
                            Do not include any medical test as a diagnosis.
                            When providing the confidence score (between 0 to 1), base it on the following factors:
                            1. How closely the extracted diagnosis matches standard medical terms (e.g., ICD-10 codes or recognized variations).
                            2. Whether the terms are commonly used or have clear medical relevance.
                            Take your time but give correct answer.
                            Output Format (Adhere strictly):
                              Provisional Diagnosis: {diagnosis_value}
                              Confidence Score: {confidence_value}
                            The first line should contain the Provisional diagnosis, and the confidence score should be on the second line.

                            *Even if the diagnosis are written in multiple lines in the image give the output in one line as diagnosis_value.*
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
            "max_tokens": 500
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

    # prompt = (
    # "Given the input Provisional Diagnosis and Confidence Score from text extraction model, apply medical context to provide the corrected diagnosis. "
    # "DO NOT expand or change short forms unless they are incorrect. Maintain them as they are in the output. "
    # "If the confidence score is high (>=96%), make minimal changes. If the confidence score is low (<96%), refine the diagnosis carefully. but still keep short forms as they are unless they are clearly wrong."

    # "Input Format (For your reference only):"
    # f"Provisional Diagnosis: {diagnosis_value} "
    # f"Confidence Score: {confidence_value} in percentage "

    # "Output should be in the EXACT specified format. Do NOT output anything else. "
    # "When providing the confidence score (between 0 to 1), base it on the following factors:"
    #                                     "1. How closely the extracted diagnosis matches standard medical terms (e.g., ICD-10 codes or recognized variations)."
    #                                     "2. Whether the terms are commonly used or have clear medical relevance."

    #     "Output the result as a valid JSON object with the following structure: "
    #     "{"
    #     '"Extracted_Diagnosis": "<corrected_diagnosis>", '
    #     '"Confidence_Score": <your_own_confidence_score>'
    #     "}. The Confidence Score must be a float between 0 and 1, and all responses must adhere to JSON syntax. "

    # )
    prompt = (
    f"""Given the input Provisional Diagnosis and Confidence Score from text extraction model, apply medical context to provide the corrected diagnosis. 
       - If the Confidence Score is high (>=0.95), make very minimal changes. In this case you can return a high confidence.(>0.95)
       - If the Confidence Score is low (<0.95), correct the diagnosis accordingly. Return a low confidence (<0.95) when not sure.
       Expand the commonly used medical abbreviations carefully only when necessary. Don't change any word if its corrected spelled and has medical relevance.
       Don't add any more words than necessary. 

       Different diagnosis should be separated by , compulsorily.

        *Respond only with a JSON object in this format*:

        {{
            "Extracted_Diagnosis": "<corrected_diagnosis>",
            "Confidence_Score": <your_own_confidence_score>
        }}

        Input for your reference:
        Provisional Diagnosis: {diagnosis_value}
        Confidence Score: {confidence_value} (between 0 and 1)

        DO NOT output any additional information or explanation.
""")

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
        max_tokens=512,  # Limit the maximum tokens for response
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


# Define a threshold for the confidence score (e.g., 80 or higher)
confidence_threshold = 80

# Step 1: Load the CSV of ICD-10 codes
icd_data = pd.read_csv("ICD_with_3_and_4.csv")
icd_dict = dict(zip(icd_data['Common_Code'], icd_data['Diagnosis']))

# Get the list of diagnoses for fuzzy matching
icd_descriptions = list(icd_dict.values())
def map_icd10_codes(lst_of_diagnosis):
# Dictionary to store the results
  diagnosis_to_icd = {}

  # Iterate over each diagnosis in the list
  for diagnosis in lst_of_diagnosis:
      # Use fuzzy matching to find all matches
      all_matches = process.extract(diagnosis, icd_descriptions, scorer = fuzz.partial_ratio)
      
      # Filter out matches below the confidence threshold
      filtered_matches = [match for match in all_matches if match[1] >= confidence_threshold]
      match_dict = {diagnosis: filtered_matches}
      print(match_dict)
      # print(int(len(filtered_matches)/2))
      # If there are no matches that meet the threshold, mark it as low confidence
      if not filtered_matches:
          diagnosis_to_icd[diagnosis] = "No matching code found (low confidence)"
      else:
          # If matches meet the threshold, choose the best one (highest score)
          best_match_description, best_score = filtered_matches[0]#int(len(filtered_matches)/2)
          
          
          # Find the corresponding ICD code for the best match
          matching_code = [code for code, diag in icd_dict.items() if diag == best_match_description]
          
          # If a matching code is found, add it to the dictionary
          if matching_code:
              diagnosis_to_icd[diagnosis] = matching_code[0]
          else:
              diagnosis_to_icd[diagnosis] = "No matching code found"

  # Print the resulting dictionary
  # print(diagnosis_to_icd)
  return diagnosis_to_icd
    
def process_image(image_file):
    try:
        # Attempt to process the image
        extracted_output_list = gpt_output(image_file)
        
        # Extract diagnosis and confidence values safely
        if len(extracted_output_list) == 2 and ':' in extracted_output_list[0] and ':' in extracted_output_list[1]:
            diagnosis_value = extracted_output_list[0].split(':')[1].strip()
            confidence_value = extracted_output_list[1].split(':')[1].strip()
        else:
            raise ValueError("Invalid Output Format")  # Trigger error handling for invalid format

        # Attempt to correct the output using the LLM
        llm_result = llm_output(diagnosis_value, confidence_value)

        # Check if the LLM output is in the expected format

        if isinstance(llm_result, dict) and 'Extracted_Diagnosis' in llm_result and 'Confidence_Score' in llm_result:
            final_diagnosis = llm_result['Extracted_Diagnosis']
            llm_confidence = llm_result['Confidence_Score']
        print(final_diagnosis)

        # else:
        #     raise ValueError("Invalid LLM output format")  # Trigger error handling for invalid format

        lst_of_diagnosis = final_diagnosis.split(',')

        diagnosis_to_icd10_mapping = map_icd10_codes(lst_of_diagnosis)

        # Prepare lists for diagnosis values and corresponding ICD-10 codes
        diagnosis_list = list(diagnosis_to_icd10_mapping.keys())
        icd10_list = list(diagnosis_to_icd10_mapping.values())
        
        # Return the results as a JSON object
        return {
            "diagnosis_values": diagnosis_list,
            "icd10_codes": icd10_list,
            "confidence": llm_confidence
        }
    
    except Exception as e:
        print(f"Error processing file {image_file}: {str(e)}")
        return {
            "diagnosis_values": "Please Try Again",
            "icd10_codes": "Please Try Again",
            "confidence": "Please Try Again"
        }

#   diagnosis_value = gpt_output_list[0].split(':')[1]
#   confidence_value = gpt_output_list[1].split(':')[1]

#   final_diagnosis = llm_output(diagnosis_value, confidence_value)

#   return final_diagnosis

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
            diagnosis_value = result_json['diagnosis_values']
            icd10_value = result_json['icd10_codes']
            confidence_value = result_json['confidence']
            print(diagnosis_value)
            print(icd10_value)
            print(confidence_value)

            # Append result to the list
            results.append({"file_name": image_file.filename, "provisional_diagnosis": diagnosis_value, "icd10_code": icd10_value, "Confidence_score": confidence_value})

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


