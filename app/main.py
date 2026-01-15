from fastapi import FastAPI
from app.api.v1.endpoints import products

app = FastAPI(title="Sistema ESL API")

# Inclusão das rotas de produtos
app.include_router(
    products.router, 
    prefix="/api/v1/products", 
    tags=["Produtos"]
)