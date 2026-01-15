from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean, Float
from app.db.session import Base
import datetime

class TagUpdateLog(Base):
    __tablename__ = "tag_update_logs"

    id = Column(Integer, primary_key=True, index=True)
    tag_id = Column(String, index=True, nullable=False)
    sku = Column(String, nullable=False)
    old_price = Column(Float)
    new_price = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Lógica de ACK
    ack_received = Column(Boolean, default=False) # Confirmação da etiqueta
    ack_timestamp = Column(DateTime, nullable=True)