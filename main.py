from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Etiqueta ESL API")

class Item(BaseModel):
    nome: str
    preco: float

@app.get("/")
def read_root():
    return {"status": "Online", "projeto": "Etiqueta ESL"}

@app.post("/items/")
def create_item(item: Item):
    return {"message": "Item criado com sucesso", "item": item}