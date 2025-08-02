import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 環境変数の読み込み
dotenv.config();

// ESモジュールで__dirnameを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Expressアプリケーション初期化
const app = express();
const PORT = process.env.PORT || 3000;

// レート制限設定
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100リクエスト
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ミドルウェア設定
app.use(helmet()); // セキュリティヘッダー
app.use(compression()); // レスポンス圧縮
app.use(morgan('combined')); // ログ出力
app.use(limiter); // レート制限
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB接続
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/contract_management');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// ルート設定
app.get('/', (req, res) => {
  res.json({
    message: 'Contract Management API',
    version: '1.0.0',
    status: 'running'
  });
});

// API健康チェック
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// APIルート（後で追加）
// app.use('/api/contracts', contractRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/search', searchRoutes);

// 404エラーハンドリング
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// グローバルエラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  res.status(status).json({
    error: 'Server Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// サーバー起動
const startServer = async () => {
  try {
    // データベース接続
    await connectDB();
    
    // サーバー起動
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// プロセス終了時の処理
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// サーバー起動
startServer();

export default app;