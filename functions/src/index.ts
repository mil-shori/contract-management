import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import admin from 'firebase-admin';

// Firebase Admin SDK初期化
admin.initializeApp();

// グローバル設定
setGlobalOptions({
  region: 'asia-northeast1', // 東京リージョン
  maxInstances: 10,
});

// Express アプリケーション作成
const app = express();

// レート制限設定
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // IP毎に最大100リクエスト
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ミドルウェア設定
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.web.app', 'https://your-domain.firebaseapp.com']
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 認証ミドルウェア
const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
};

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Contract Management API',
    version: '1.0.0'
  });
});

// API ルート設定
app.get('/api/test', authenticateUser, (req, res) => {
  res.json({
    message: 'Authenticated successfully',
    user: {
      uid: req.user?.uid,
      email: req.user?.email
    }
  });
});

// 認証関連のAPIルート
import authRoutes from './routes/auth';
app.use('/api/auth', authRoutes);

// 契約関連のAPIルート
import contractRoutes from './routes/contracts';
app.use('/api/contracts', authenticateUser, contractRoutes);

// Google Workspace連携APIルート（後で実装）
// import googleRoutes from './routes/google';
// app.use('/api/google', authenticateUser, googleRoutes);

// ファイル処理APIルート
import fileRoutes from './routes/files';
app.use('/api/files', authenticateUser, fileRoutes);

// 404エラーハンドリング
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// グローバルエラーハンドリング
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
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

// Firebase Function として export
export const api = onRequest({
  region: 'asia-northeast1',
  maxInstances: 10,
  memory: '512MiB',
  timeoutSeconds: 60,
}, app);

// 型定義拡張
declare global {
  namespace Express {
    interface Request {
      user?: admin.auth.DecodedIdToken;
    }
  }
}