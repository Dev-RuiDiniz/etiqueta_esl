from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional

class ProductBase(BaseModel):
    sku: str = Field(..., description="Código identificador único do produto", json_schema_extra={"example": "123456"})
    name: str = Field(..., description="Nome exibido na etiqueta", json_schema_extra={"example": "Arroz Integral 1kg"})
    price: float = Field(..., gt=0, description="Preço do produto", json_schema_extra={"example": 19.90})
    category: Optional[str] = Field(None, json_schema_extra={"example": "Mercearia"})

class ProductUpdatePrice(BaseModel):
    sku: str
    price: float

    @field_validator('price')
    @classmethod
    def price_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError('O preço deve ser maior que zero')
        return v

class ProductResponse(ProductBase):
    id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True) # Substitui orm_mode e resolve o aviso de classe Config