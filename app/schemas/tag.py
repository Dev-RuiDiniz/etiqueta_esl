from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

class TagStatus(str):
    ONLINE = "online"
    OFFLINE = "offline"
    SLEEP = "sleep"

class TagBase(BaseModel):
    tag_id: str = Field(..., example="SID-00A-FF12", description="ID único do hardware da etiqueta")
    status: str = Field(default="online", example="online")
    battery_level: int = Field(..., ge=0, le=100, example=95, description="Nível da bateria de 0 a 100")
    last_update: Optional[datetime] = Field(default_factory=datetime.now)
    linked_sku: Optional[str] = Field(None, example="123456", description="SKU do produto atualmente vinculado")

class TagUpdate(BaseModel):
    """Schema para atualizar o status e bateria via Wi-Fi/MQTT"""
    status: Optional[str]
    battery_level: Optional[int]
    
    @validator('battery_level')
    def check_battery_range(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError("Bateria deve estar entre 0 e 100")
        return v

class TagResponse(TagBase):
    """Schema de retorno incluindo alertas de manutenção"""
    low_battery_alert: bool = False

    @validator('low_battery_alert', pre=True, always=True)
    def set_alert(cls, v, values):
        # Alerta ativado se a bateria for menor que 20%
        return values.get('battery_level', 100) < 20