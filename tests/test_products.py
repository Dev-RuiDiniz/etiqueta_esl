import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_update_product_price_success():
    """
    Testa se a atualização de preço retorna sucesso com dados válidos.
    """
    # Na versão nova do HTTPX, passamos o app através do ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "sku": "123456",
            "price": 25.50
        }
        response = await ac.post("/api/v1/products/update-price", json=payload)
    
    assert response.status_code == 200
    assert response.json()["status"] == "success"

@pytest.mark.asyncio
async def test_update_product_price_invalid_data():
    """
    Testa se a validação do Pydantic bloqueia preços negativos.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "sku": "123456",
            "price": -10.0
        }
        response = await ac.post("/api/v1/products/update-price", json=payload)
    
    assert response.status_code == 422