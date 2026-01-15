import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_update_product_price_success():
    """
    Testa se a atualização de preço retorna sucesso com dados válidos.
    """
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Payload baseado no exemplo do documento técnico [cite: 54, 55, 56]
        payload = {
            "sku": "123456",
            "price": 25.50
        }
        response = await ac.post("/api/v1/products/update-price", json=payload)
    
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert response.json()["new_price"] == 25.50

@pytest.mark.asyncio
async def test_update_product_price_invalid_data():
    """
    Testa se a validação do Pydantic bloqueia preços negativos.
    """
    async with AsyncClient(app=app, base_url="http://test") as ac:
        payload = {
            "sku": "123456",
            "price": -10.0  # Preço inválido
        }
        response = await ac.post("/api/v1/products/update-price", json=payload)
    
    # Deve retornar 422 devido à validação que implementamos no Schema
    assert response.status_code == 422