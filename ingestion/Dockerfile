# Base Image - Estágio Otimizado para Execução
FROM python:3.12-slim

# Evita que o Python grave arquivos .pyc no disco
ENV PYTHONDONTWRITEBYTECODE=1
# Garante que os logs sejam exibidos imediatamente no console
ENV PYTHONUNBUFFERED=1
# Desativa o cache do pip para manter a imagem leve
ENV PIP_NO_CACHE_DIR=1

WORKDIR /app

# Instala dependências de compilação essenciais, wget/procps para o Dev Container e ca-certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    wget \
    ca-certificates \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Cria usuário não-root por segurança
RUN groupadd -r appgroup && useradd -r -g appgroup -m appuser

# Copia e instala as dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Cria pastas para persistência de cache e dados e atribui ao appuser
RUN mkdir -p /app/cache /app/data && chown -R appuser:appgroup /app

# Copia o código-fonte
COPY . /app/ingestion/
RUN chown -R appuser:appgroup /app/ingestion

# Alterna para o usuário não-privilegiado
USER appuser

# Define o caminho de cache do FastF1 através de variável de ambiente
ENV FASTF1_CACHE_DIR=/app/cache

# Comando padrão
CMD ["python", "ingestion/ingestion.py"]
