from fastapi import FastAPI
from app.api.v1.endpoints import products
from app.core.errors import global_exception_handler, database_exception_handler
from sqlalchemy.exc import SQLAlchemyError

app = FastAPI(title="Sistema ESL API")

# Registro de Handlers Globais
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(SQLAlchemyError, database_exception_handler)

# Inclusão das rotas de produtos
app.include_router(
    products.router, 
    prefix="/api/v1/products", 
    tags=["Produtos"]
)