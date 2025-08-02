import express from 'express';
import multer from 'multer';
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as crypto from 'crypto';

const router = express.Router();

// Multer設定（メモリストレージ）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB制限
  },
  fileFilter: (req, file, cb) => {
    // 許可されたファイル形式
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('サポートされていないファイル形式です'));
    }
  },
});

const firestore = admin.firestore();
const bucket = admin.storage().bucket();

interface FileMetadata {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  size: number;
  checksum: string;
  uploadedBy: string;
  uploadedAt: admin.firestore.Timestamp;
  contractId?: string;
  version: number;
  tags: string[];
  isPublic: boolean;
  downloadUrl?: string;
}

// ファイルアップロード
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'ファイルが提供されていません'
      });
    }

    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '認証が必要です'
      });
    }

    const { contractId, tags, isPublic } = req.body;

    // ファイル名生成
    const fileId = uuidv4();
    const ext = path.extname(req.file.originalname);
    const fileName = `${fileId}${ext}`;
    const filePath = generateFilePath(userId, fileName);

    // チェックサム計算
    const checksum = crypto.createHash('md5').update(req.file.buffer).digest('hex');

    // Firebase Storageにアップロード
    const file = bucket.file(filePath);
    
    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          uploadedBy: userId,
          originalName: req.file.originalname,
          checksum: checksum,
          contractId: contractId || '',
        },
      },
    });

    // パブリックURLを生成（必要に応じて）
    let downloadUrl: string | undefined = undefined;
    if (isPublic === 'true') {
      await file.makePublic();
      downloadUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    }

    // メタデータをFirestoreに保存
    const metadata: FileMetadata = {
      id: fileId,
      originalName: req.file.originalname,
      fileName,
      filePath,
      mimeType: req.file.mimetype,
      size: req.file.size,
      checksum,
      uploadedBy: userId,
      uploadedAt: admin.firestore.Timestamp.now(),
      contractId: contractId || undefined,
      version: 1,
      tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
      isPublic: isPublic === 'true',
      downloadUrl,
    };

    await firestore.collection('files').doc(fileId).set(metadata);

    res.json({
      success: true,
      file: metadata,
      message: 'ファイルのアップロードが完了しました'
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: 'ファイルのアップロードに失敗しました'
    });
  }
});

// ファイル一覧取得
router.get('/list', async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '認証が必要です'
      });
    }

    const { contractId, limit = 50 } = req.query;

    let query = firestore.collection('files')
      .where('uploadedBy', '==', userId)
      .orderBy('uploadedAt', 'desc')
      .limit(parseInt(limit as string));

    if (contractId) {
      query = query.where('contractId', '==', contractId);
    }

    const snapshot = await query.get();
    const files = snapshot.docs.map(doc => doc.data() as FileMetadata);

    res.json({
      success: true,
      files,
      count: files.length
    });

  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      error: 'List failed',
      message: 'ファイル一覧の取得に失敗しました'
    });
  }
});

// ファイル詳細取得
router.get('/:fileId', async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '認証が必要です'
      });
    }

    const { fileId } = req.params;

    const doc = await firestore.collection('files').doc(fileId).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        error: 'File not found',
        message: 'ファイルが見つかりません'
      });
    }

    const metadata = doc.data() as FileMetadata;

    // アクセス権限チェック
    if (metadata.uploadedBy !== userId && !metadata.isPublic) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'ファイルへのアクセス権限がありません'
      });
    }

    res.json({
      success: true,
      file: metadata
    });

  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      error: 'Get file failed',
      message: 'ファイル詳細の取得に失敗しました'
    });
  }
});

// ファイルダウンロードURL生成
router.get('/:fileId/download', async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '認証が必要です'
      });
    }

    const { fileId } = req.params;
    const { expiresIn = 3600 } = req.query; // デフォルト1時間

    const doc = await firestore.collection('files').doc(fileId).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        error: 'File not found',
        message: 'ファイルが見つかりません'
      });
    }

    const metadata = doc.data() as FileMetadata;

    // アクセス権限チェック
    if (metadata.uploadedBy !== userId && !metadata.isPublic) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'ファイルへのアクセス権限がありません'
      });
    }

    // 署名付きURLを生成
    const file = bucket.file(metadata.filePath);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + parseInt(expiresIn as string) * 1000,
    });

    res.json({
      success: true,
      downloadUrl: url,
      expiresAt: new Date(Date.now() + parseInt(expiresIn as string) * 1000).toISOString()
    });

  } catch (error) {
    console.error('Generate download URL error:', error);
    res.status(500).json({
      error: 'Download URL generation failed',
      message: 'ダウンロードURLの生成に失敗しました'
    });
  }
});

// ファイル削除
router.delete('/:fileId', async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '認証が必要です'
      });
    }

    const { fileId } = req.params;

    const doc = await firestore.collection('files').doc(fileId).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        error: 'File not found',
        message: 'ファイルが見つかりません'
      });
    }

    const metadata = doc.data() as FileMetadata;

    // アクセス権限チェック（所有者のみ削除可能）
    if (metadata.uploadedBy !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'ファイルの削除権限がありません'
      });
    }

    // Storage からファイル削除
    const file = bucket.file(metadata.filePath);
    await file.delete();

    // Firestore からメタデータ削除
    await firestore.collection('files').doc(fileId).delete();

    res.json({
      success: true,
      message: 'ファイルが削除されました'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      error: 'Delete failed',
      message: 'ファイルの削除に失敗しました'
    });
  }
});

// ファイル検索
router.get('/search/:query', async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '認証が必要です'
      });
    }

    const { query } = req.params;
    const { limit = 50 } = req.query;

    // 簡易検索（ファイル名での部分マッチ）
    const snapshot = await firestore.collection('files')
      .where('uploadedBy', '==', userId)
      .orderBy('uploadedAt', 'desc')
      .limit(parseInt(limit as string))
      .get();

    const files = snapshot.docs.map(doc => doc.data() as FileMetadata);
    
    // クライアントサイドフィルタリング（Firestoreの制限のため）
    const filteredFiles = files.filter(file => 
      file.originalName.toLowerCase().includes(query.toLowerCase()) ||
      file.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );

    res.json({
      success: true,
      files: filteredFiles,
      count: filteredFiles.length,
      query
    });

  } catch (error) {
    console.error('Search files error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'ファイル検索に失敗しました'
    });
  }
});

// 使用容量計算
router.get('/usage/storage', async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '認証が必要です'
      });
    }

    const snapshot = await firestore.collection('files')
      .where('uploadedBy', '==', userId)
      .get();

    const files = snapshot.docs.map(doc => doc.data() as FileMetadata);
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const fileCount = files.length;

    res.json({
      success: true,
      usage: {
        totalSize,
        totalSizeFormatted: formatBytes(totalSize),
        fileCount,
        averageSize: fileCount > 0 ? Math.round(totalSize / fileCount) : 0
      }
    });

  } catch (error) {
    console.error('Calculate storage usage error:', error);
    res.status(500).json({
      error: 'Usage calculation failed',
      message: '使用容量の計算に失敗しました'
    });
  }
});

// ヘルパー関数
function generateFilePath(userId: string, fileName: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  return `users/${userId}/${year}/${month}/${fileName}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default router;