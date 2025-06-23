from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import random

app = FastAPI()


class ChargeRequest(BaseModel):
    order_id: str
    amount: float


class ChargeResponse(BaseModel):
    status: str  # "success" or "failure"


@app.post("/charge", response_model=ChargeResponse)
async def charge(req: ChargeRequest):
    # Simulate success/failure randomly or based on amount
    # For demo: succeed if amount < 100, else fail 50% of time
    if req.amount < 100:
        return {"status": "success"}
    else:
        # simulate random failure
        if random.random() < 0.5:
            return {"status": "success"}
        else:
            return {"status": "failure"}


@app.get("/healt")
async def health_check():
    return {"status": "ok"}
