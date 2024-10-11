#!/bin/bash

# Activate virtual environment (assuming you're using one)
source myenv/bin/activate

# Install required packages
pip install -r requirements.txt

# Start the FastAPI application
uvicorn fastAPI:app --host 0.0.0.0 --port 5000 --reload
