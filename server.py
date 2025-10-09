# server.py
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import asyncio

load_dotenv()

# import your workflow code here
from run_workflow import run_workflow, WorkflowInput

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WorkflowRequest(BaseModel):
    input_as_text: str

@app.post("/run-agent")
async def run_agent(request: WorkflowRequest):
    result = await run_workflow(request)
    return {
        "status": "success",
        "data": result
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
