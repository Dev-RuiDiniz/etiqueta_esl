from fastapi import Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
import logging

# Configuração básica de log para registro de erros internos [cite: 75]
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def global_exception_handler(request: Request, exc: Exception):
    """
    Captura qualquer erro não tratado e retorna uma resposta JSON amigável.
    """
    logger.error(f"Erro inesperado: {exc} - Rota: {request.url.path}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "message": "Ocorreu um erro interno no servidor de etiquetas.",
            "type": "InternalServerError"
        }
    )

async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    """
    Captura erros específicos de banco de dados (ex: falha de conexão).
    """
    logger.critical(f"Erro de Banco de Dados: {exc}")
    
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "status": "error",
            "message": "Serviço de banco de dados indisponível no momento.",
            "type": "DatabaseError"
        }
    )