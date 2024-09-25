# FinMedAI
## Project Description
Our project aims to streamline the extraction of medical diagnoses from handwritten medical forms using a state-of-the-art vision-language model. The solution helps digitize these forms to improve efficiency and accuracy in claims processing.

### View our website: [FinMedAI](https://finmedai.vercel.app/)
*For the website to be fully functional, you need to create your own API endpoint for which the steps are mentioned below*

### Link for frontend repo: [Link](https://github.com/hypervenomjr/Medical-Diagnosis-Extrtaction)

## Usage
### *Note on GPU and NVIDIA Drivers*:
To use the Qwen2-VL-7B-Instruct-GPTQ-Int4 model with Auto-GPTQ, ensure the following GPU requirements are met:

- A *CUDA-enabled NVIDIA GPU* with at least *10-12 GB of VRAM* is required, but *24 GB or more* is recommended for smoother performance.
- *NVIDIA CUDA* drivers should be properly installed and up-to-date to support efficient GPU computation. This is essential for leveraging CUDA’s parallel processing capabilities during model inference.


### If GPU requirements are fulfilled, follow these steps to set up the environment:
1. Ensure Python 3.10 or higher is installed.
2. Create and activate a virtual environment to manage dependencies:
   
   ```
   python -m venv venv
   venv\Scripts\activate
   ```
3. Interpreter: Select the corresponding python interpretor (ctrl+shift+P - to open command palette and select interpretor)
4. Dependencies Installation:
   
   ```
    pip install -r requirements.txt
   ```
5. Run main.py to perform diagnosis extraction
   ```
   python main.py path/to/folder/of/images
   ```

### You can also try our code at Google Colab Notebook : [Click to open](https://colab.research.google.com/drive/18c7BLaMW49aplc3Y8BOYHrxdDC05ByuQ?usp=sharing)

### Create your own API endpoint (for testing purposes):
1. Login/SignUp on [ngrok](https://ngrok.com/)
2. Open the [Google Colab Notebook](https://colab.research.google.com/drive/1CZ8X9y4x7RgQNCah75EZ-8CSlJDUqSFj?usp=sharing)
3. Enter the copied AuthToken from ngrok website in the above notebook
4. Copy the generated endpoint and append /process_images to it to test using postman/bruno.
   



