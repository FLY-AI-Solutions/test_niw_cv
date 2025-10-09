# server.py
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import asyncio

# import your workflow code here
from your_module import run_workflow, WorkflowInput

app = FastAPI()

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
