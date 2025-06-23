import os
import json
import pika
import time

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "user")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "password")


def process_order(ch, method, properties, body):
    event = json.loads(body)
    data = event.get("data", {})
    order_id = data.get("order_id")
    amount = data.get("amount")
    print(
        f"[Inventory Service] Reserving stock for order {order_id}, amount {amount}")
    # Simulate processing time
    time.sleep(1)
    # Acknowledge
    ch.basic_ack(delivery_tag=method.delivery_tag)


def main():
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
    parameters = pika.ConnectionParameters(
        host=RABBITMQ_HOST, credentials=credentials)
    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()
    queue_name = "order_created"
    channel.queue_declare(queue=queue_name, durable=True)
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=queue_name, on_message_callback=process_order)
    print("Inventory Service waiting for order.created events...")
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        channel.stop_consuming()
    connection.close()


if __name__ == "__main__":
    main()
