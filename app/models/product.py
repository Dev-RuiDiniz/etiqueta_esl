from sqlalchemy import Column, String, Float, Integer, DateTime
from app.db.session import Base
import datetime

class ProductModel(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False) # [cite: 55]
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False) # [cite: 56]
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)