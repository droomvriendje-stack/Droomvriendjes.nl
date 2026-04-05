FROM python:3.9

RUN apt-get update && apt-get install -y \
    libffi-dev \
    libssl-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY . ./

CMD ["uvicorn", "server:app"]