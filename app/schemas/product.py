from pydantic import BaseModel, Field, validator
from typing import Optional

class ProductBase(BaseModel):
    """
    Atributos base compartilhados para criação e leitura.
    """
    sku: str = Field(..., example="123456", description="Código identificador único do produto")
    name: str = Field(..., example="Arroz Integral 1kg", description="Nome exibido na etiqueta")
    price: float = Field(..., gt=0, example=19.90, description="Preço do produto")
    category: Optional[str] = Field(None, example="Mercearia")

class ProductUpdatePrice(BaseModel):
    """
    Schema específico para o endpoint de atualização de preço solicitado no PDF.
    """
    sku: str
    price: float

    @validator('price')
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('O preço deve ser maior que zero')
        return v

class ProductResponse(ProductBase):
    """
    Schema para retorno de dados, podendo incluir IDs do banco de dados.
    """
    id: Optional[str] = None

    class Config:
        orm_mode = True