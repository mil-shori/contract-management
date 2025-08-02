# マルチステージビルド用Dockerfile
# Stage 1: Build stage
FROM node:18-alpine AS builder

# 作業ディレクトリ設定
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY functions/package*.json ./functions/

# 依存関係インストール
RUN npm ci --only=production && \
    cd frontend && npm ci && \
    cd ../functions && npm ci

# ソースコードをコピー
COPY . .

# フロントエンドビルド
RUN cd frontend && npm run build

# Functionsビルド
RUN cd functions && npm run build

# Stage 2: Production stage
FROM node:18-alpine AS production

# セキュリティ: 非rootユーザーを作成
RUN addgroup -g 1001 -S nodejs && \
    adduser -S contract-user -u 1001

# 必要なパッケージをインストール
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# 作業ディレクトリ設定
WORKDIR /app

# Firebase CLI をグローバルインストール
RUN npm install -g firebase-tools

# ビルド成果物をコピー
COPY --from=builder --chown=contract-user:nodejs /app/frontend/build ./frontend/build
COPY --from=builder --chown=contract-user:nodejs /app/functions/lib ./functions/lib
COPY --from=builder --chown=contract-user:nodejs /app/functions/package*.json ./functions/
COPY --from=builder --chown=contract-user:nodejs /app/functions-python ./functions-python
COPY --from=builder --chown=contract-user:nodejs /app/functions-ai ./functions-ai

# Firebase設定ファイルをコピー
COPY --chown=contract-user:nodejs firebase.json ./
COPY --chown=contract-user:nodejs firestore.rules ./
COPY --chown=contract-user:nodejs storage.rules ./

# 本番用依存関係のみインストール
RUN cd functions && npm ci --only=production

# ユーザー切り替え
USER contract-user

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# ポート公開
EXPOSE 5000 5001 8080 9099 9199

# エントリーポイント
ENTRYPOINT ["dumb-init", "--"]
CMD ["firebase", "emulators:start", "--only", "hosting,functions,firestore,auth,storage"]