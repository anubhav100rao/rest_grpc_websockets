import os
import json
import requests
import pika
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

# Read environment variables
PAYMENT_SERVICE_URL = os.getenv(
    "PAYMENT_SERVICE_URL", "http://payment-service:8000")
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "user")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "password")


class OrderRequest(BaseModel):
    order_id: str
    amount: float


class OrderResponse(BaseModel):
    status: str
    order_id: str | None = None
    message: str | None = None


def charge_payment(order_id: str, amount: float) -> bool:
    url = PAYMENT_SERVICE_URL.rstrip("/") + "/charge"
    payload = {"order_id": order_id, "amount": amount}
    try:
        resp = requests.post(url, json=payload, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        return data.get("status") == "success"
    except Exception as e:
        app.logger = getattr(app, "logger", None)
        if app.logger:
            app.logger.error(f"Payment request failed: {e}")
        return False


def publish_order_event(order_id: str, amount: float):
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
    parameters = pika.ConnectionParameters(
        host=RABBITMQ_HOST, credentials=credentials)
    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()
    queue_name = "order_created"
    channel.queue_declare(queue=queue_name, durable=True)
    event = {
        "event": "order.created",
        "data": {"order_id": order_id, "amount": amount}
    }
    channel.basic_publish(
        exchange="",
        routing_key=queue_name,
        body=json.dumps(event),
        properties=pika.BasicProperties(delivery_mode=2)
    )
    connection.close()


@app.post("/orders", response_model=OrderResponse)
async def create_order(req: OrderRequest):
    # 1. Synchronous payment
    ok = charge_payment(req.order_id, req.amount)
    if not ok:
        raise HTTPException(status_code=400, detail="Payment failed")
    # 2. Publish async event
    try:
        publish_order_event(req.order_id, req.amount)
    except Exception as e:
        # Log but still return success, or choose to fail?
        # For demo: return error if publish fails
        raise HTTPException(
            status_code=500, detail=f"Failed to publish event: {e}")
    return {"status": "ok", "order_id": req.order_id}

# For health check


@app.get("/health")
async def health():
    return {"status": "up"}
