from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# URL de conexão vinda das variáveis de ambiente
DATABASE_URL = os.getenv("DATABASE_URL")

# Engine assíncrono para operações de E/S não bloqueantes
engine = create_async_engine(DATABASE_URL, echo=True)

# Fábrica de sessões assíncronas
SessionLocal = sessionmaker(
    bind=engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# Classe base para os modelos SQL
Base = declarative_base()

# Dependência para injetar a sessão nas rotas FastAPI
async def get_db():
    async with SessionLocal() as session:
        yield session