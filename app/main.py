from fastapi import FastAPI

app = FastAPI(
    title="Sistema de Etiquetas Eletrônicas (ESL) - API",
    description="""
    API REST para gerenciamento e atualização automática de preços em etiquetas E-Paper.
    
    ## Funcionalidades
    * **Produtos**: Atualização de preços e sincronização com ERP.
    * **Etiquetas (ESL)**: Monitoramento de status, bateria e confirmação (ACK).
    * **Logs**: Histórico completo de alterações para auditoria.
    """,
    version="1.0.0",
    contact={
        "name": "Suporte Técnico ESL",
        "url": "http://seu-dominio.com/suporte",
    },
    license_info={
        "name": "Proprietário",
    },
)

# Incluir os routers já criados anteriormente
# app.include_router(products.router, prefix="/api/v1/products", tags=["Produtos"])
# Registro de Handlers Globais
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(SQLAlchemyError, database_exception_handler)

# Inclusão das rotas de produtos
app.include_router(
    products.router, 
    prefix="/api/v1/products", 
    tags=["Produtos"]
)