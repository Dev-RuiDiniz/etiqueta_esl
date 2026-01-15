import os
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

# Configurações sensíveis (em produção, use o seu .env)
SECRET_KEY = os.getenv("SECRET_KEY", "chave-secreta-para-esl-sistema-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)