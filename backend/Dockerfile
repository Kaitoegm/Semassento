FROM python:3.12-slim

WORKDIR /app

# Instalar dependências do sistema para pandas/scipy/psycopg2
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# No modo desenvolvimento, o código será montado via volume
# Mas copiamos aqui para garantir que o contêiner tenha o básico
COPY . .

EXPOSE 8000

# Rodar com reload para desenvolvimento
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
