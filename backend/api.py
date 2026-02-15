"""Simple FastAPI backend exposing compare endpoint for rent_vs_buy.

This is a minimal API to wire the model into a JSON endpoint for the SPA.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from .model import compare_buy_vs_rent_with_investment

app = FastAPI(title="rent_vs_buy API")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AssumptionsRequest(BaseModel):
    benchmark_return: Optional[float] = 0.055

class CompareRequest(BaseModel):
    inputs: dict
    assumptions: Optional[AssumptionsRequest] = None


@app.post("/compare")
def compare(req: CompareRequest):
    inputs = req.inputs
    assumptions_data = req.assumptions.dict() if req.assumptions else {"benchmark_return": 0.055}
    result = compare_buy_vs_rent_with_investment(inputs, assumptions_data)
    return result
