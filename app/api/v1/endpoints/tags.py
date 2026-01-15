from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from datetime import datetime

router = APIRouter()

@router.post("/ack/{tag_id}")
async def receive_tag_ack(tag_id: str, db: AsyncSession = Depends(get_db)):
    """
    Recebe a confirmação de recebimento (ACK) da etiqueta física via Wi-Fi.
    """
    # 1. Localiza o log mais recente desta etiqueta que ainda não foi confirmado
    # No futuro: query = select(TagUpdateLog).where(tag_id=tag_id, ack_received=False)
    
    print(f"ACK recebido da etiqueta: {tag_id}")
    
    return {
        "status": "confirmed",
        "tag_id": tag_id,
        "received_at": datetime.now()
    }