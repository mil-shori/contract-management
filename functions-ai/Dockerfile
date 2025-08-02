# Python AI Service用Dockerfile
FROM python:3.11-slim

# 作業ディレクトリ設定
WORKDIR /app

# システム依存関係のインストール
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    libffi-dev \
    libssl-dev \
    libxml2-dev \
    libxslt1-dev \
    zlib1g-dev \
    libjpeg-dev \
    libpng-dev \
    libfreetype6-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python依存関係のインストール
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# spaCyモデルのダウンロード
RUN python -m spacy download en_core_web_sm
RUN python -m spacy download ja_core_news_sm

# アプリケーションコードをコピー
COPY . .

# 環境変数設定
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# ポート設定
EXPOSE 8081

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8081/health || exit 1

# エントリーポイント
CMD ["python", "main.py"]