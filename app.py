from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Item(BaseModel):
    id: int
    name: str
    price: float


# In-memory "database"
items = {}


@app.get("/items/{item_id}", response_model=Item)
async def read_item(item_id: int):
    if item_id in items:
        return items[item_id]
    return {"id": item_id, "name": "unknown", "price": 0.0}


@app.post("/items/", response_model=Item)
async def create_item(item: Item):
    items[item.id] = item
    return item


@app.put("/items/{item_id}", response_model=Item)
async def update_item(item_id: int, item: Item):
    items[item_id] = item
    return item


@app.delete("/items/{item_id}")
async def delete_item(item_id: int):
    if item_id in items:
        del items[item_id]
        return {"detail": "deleted"}
    return {"detail": "not found"}
