import { Storage } from '@google-cloud/storage';
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as crypto from 'crypto';

const storage = new Storage();
const firestore = admin.firestore();

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

interface UploadOptions {
  userId: string;
  contractId?: string;
  tags?: string[];
  isPublic?: boolean;
}

export class StorageService {
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'default-bucket';
  }

  /**
   * ファイルアップロード
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    options: UploadOptions
  ): Promise<FileMetadata> {
    try {
      // ファイル検証
      this.validateFile(buffer, originalName, mimeType);

      // ファイル名生成
      const fileId = uuidv4();
      const ext = path.extname(originalName);
      const fileName = `${fileId}${ext}`;
      const filePath = this.generateFilePath(options.userId, fileName);

      // チェックサム計算
      const checksum = crypto.createHash('md5').update(buffer).digest('hex');

      // Firebase Storageにアップロード
      const bucket = storage.bucket(this.bucketName);
      const file = bucket.file(filePath);

      const stream = file.createWriteStream({
        metadata: {
          contentType: mimeType,
          metadata: {
            uploadedBy: options.userId,
            originalName: originalName,
            checksum: checksum,
            contractId: options.contractId || '',
          },
        },
      });

      return new Promise((resolve, reject) => {
        stream.on('error', (error: Error) => {
          console.error('Upload error:', error);
          reject(new Error('ファイルのアップロードに失敗しました'));
        });

        stream.on('finish', async () => {
          try {
            // パブリックURLを生成（必要に応じて）
            let downloadUrl: string | undefined = undefined;
            if (options.isPublic) {
              await file.makePublic();
              downloadUrl = `https://storage.googleapis.com/${this.bucketName}/${filePath}`;
            }

            // メタデータをFirestoreに保存
            const metadata: FileMetadata = {
              id: fileId,
              originalName,
              fileName,
              filePath,
              mimeType,
              size: buffer.length,
              checksum,
              uploadedBy: options.userId,
              uploadedAt: admin.firestore.Timestamp.now(),
              contractId: options.contractId,
              version: 1,
              tags: options.tags || [],
              isPublic: options.isPublic || false,
              downloadUrl,
            };

            await firestore.collection('files').doc(fileId).set(metadata);

            resolve(metadata);
          } catch (error) {
            console.error('Metadata save error:', error);
            reject(new Error('ファイルメタデータの保存に失敗しました'));
          }
        });

        stream.end(buffer);
      });
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  }

  /**
   * ファイル取得
   */
  async getFile(fileId: string, userId: string): Promise<FileMetadata | null> {
    try {
      const doc = await firestore.collection('files').doc(fileId).get();
      
      if (!doc.exists) {
        return null;
      }

      const metadata = doc.data() as FileMetadata;

      // アクセス権限チェック
      if (!this.hasFileAccess(metadata, userId)) {
        throw new Error('ファイルへのアクセス権限がありません');
      }

      return metadata;
    } catch (error) {
      console.error('Get file error:', error);
      throw error;
    }
  }

  /**
   * ファイル一覧取得
   */
  async listFiles(userId: string, contractId?: string): Promise<FileMetadata[]> {
    try {
      let query = firestore.collection('files')
        .where('uploadedBy', '==', userId)
        .orderBy('uploadedAt', 'desc');

      if (contractId) {
        query = query.where('contractId', '==', contractId);
      }

      const snapshot = await query.get();
      
      return snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => doc.data() as FileMetadata);
    } catch (error) {
      console.error('List files error:', error);
      throw error;
    }
  }

  /**
   * ファイル削除
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    try {
      // メタデータ取得
      const metadata = await this.getFile(fileId, userId);
      if (!metadata) {
        throw new Error('ファイルが見つかりません');
      }

      // Storage からファイル削除
      const bucket = storage.bucket(this.bucketName);
      const file = bucket.file(metadata.filePath);
      await file.delete();

      // Firestore からメタデータ削除
      await firestore.collection('files').doc(fileId).delete();

    } catch (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  }

  /**
   * ファイルダウンロードURL生成
   */
  async generateDownloadUrl(fileId: string, userId: string, expiresIn: number = 3600): Promise<string> {
    try {
      const metadata = await this.getFile(fileId, userId);
      if (!metadata) {
        throw new Error('ファイルが見つかりません');
      }

      const bucket = storage.bucket(this.bucketName);
      const file = bucket.file(metadata.filePath);

      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresIn * 1000, // 1時間
      });

      return url;
    } catch (error) {
      console.error('Generate download URL error:', error);
      throw error;
    }
  }

  /**
   * ファイル検索
   */
  async searchFiles(userId: string, query: string): Promise<FileMetadata[]> {
    try {
      // 簡易検索（ファイル名での部分マッチ）
      const snapshot = await firestore.collection('files')
        .where('uploadedBy', '==', userId)
        .orderBy('uploadedAt', 'desc')
        .get();

      const files = snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => doc.data() as FileMetadata);
      
      // クライアントサイドフィルタリング（Firestoreの制限のため）
      return files.filter((file: FileMetadata) =>
        file.originalName.toLowerCase().includes(query.toLowerCase()) ||
        file.tags.some((tag: string) => tag.toLowerCase().includes(query.toLowerCase()))
      );
    } catch (error) {
      console.error('Search files error:', error);
      throw error;
    }
  }

  /**
   * ファイルバージョン管理
   */
  async uploadNewVersion(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    fileId: string,
    userId: string
  ): Promise<FileMetadata> {
    try {
      // 既存ファイル取得
      const existingFile = await this.getFile(fileId, userId);
      if (!existingFile) {
        throw new Error('元ファイルが見つかりません');
      }

      // 新バージョンとしてアップロード
      const newVersion = existingFile.version + 1;
      const newFileId = uuidv4();
      const ext = path.extname(originalName);
      const fileName = `${newFileId}${ext}`;
      const filePath = this.generateFilePath(userId, fileName);

      // チェックサム計算
      const checksum = crypto.createHash('md5').update(buffer).digest('hex');

      // Firebase Storageにアップロード
      const bucket = storage.bucket(this.bucketName);
      const file = bucket.file(filePath);

      const stream = file.createWriteStream({
        metadata: {
          contentType: mimeType,
          metadata: {
            uploadedBy: userId,
            originalName: originalName,
            checksum: checksum,
            contractId: existingFile.contractId || '',
            previousVersion: fileId,
          },
        },
      });

      return new Promise((resolve, reject) => {
        stream.on('error', (error: Error) => {
          console.error('Version upload error:', error);
          reject(new Error('新バージョンのアップロードに失敗しました'));
        });

        stream.on('finish', async () => {
          try {
            // 新バージョンのメタデータを保存
            const newMetadata: FileMetadata = {
              ...existingFile,
              id: newFileId,
              fileName,
              filePath,
              mimeType,
              size: buffer.length,
              checksum,
              uploadedAt: admin.firestore.Timestamp.now(),
              version: newVersion,
            };

            await firestore.collection('files').doc(newFileId).set(newMetadata);

            // 既存ファイルを古いバージョンとしてマーク
            await firestore.collection('files').doc(fileId).update({
              isLatestVersion: false,
              newerVersion: newFileId,
            });

            resolve(newMetadata);
          } catch (error) {
            console.error('Version metadata save error:', error);
            reject(new Error('バージョンメタデータの保存に失敗しました'));
          }
        });

        stream.end(buffer);
      });
    } catch (error) {
      console.error('Upload new version error:', error);
      throw error;
    }
  }

  /**
   * Google Driveからインポート
   */
  async importFromDrive(driveFileId: string, userId: string): Promise<FileMetadata> {
    // Google Drive API実装は省略（実際の実装では google-auth-library と googleapis を使用）
    throw new Error('Google Drive連携は未実装です');
  }

  /**
   * ファイル検証
   */
  private validateFile(buffer: Buffer, originalName: string, mimeType: string): void {
    // ファイルサイズ制限（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (buffer.length > maxSize) {
      throw new Error('ファイルサイズが10MBを超えています');
    }

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

    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error('サポートされていないファイル形式です');
    }

    // ファイル名検証
    const dangerousChars = /[<>:"/\\|?*]/;
    if (dangerousChars.test(originalName)) {
      throw new Error('ファイル名に使用できない文字が含まれています');
    }

    // ファイル拡張子検証
    const ext = path.extname(originalName).toLowerCase();
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.txt', '.doc', '.docx'];
    if (!allowedExtensions.includes(ext)) {
      throw new Error('サポートされていないファイル拡張子です');
    }
  }

  /**
   * ファイルパス生成
   */
  private generateFilePath(userId: string, fileName: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    return `users/${userId}/${year}/${month}/${fileName}`;
  }

  /**
   * ファイルアクセス権限チェック
   */
  private hasFileAccess(metadata: FileMetadata, userId: string): boolean {
    // ファイルの所有者またはパブリックファイルの場合はアクセス許可
    return metadata.uploadedBy === userId || metadata.isPublic;
  }

  /**
   * ファイルの整合性チェック
   */
  async verifyFileIntegrity(fileId: string, userId: string): Promise<boolean> {
    try {
      const metadata = await this.getFile(fileId, userId);
      if (!metadata) {
        return false;
      }

      const bucket = storage.bucket(this.bucketName);
      const file = bucket.file(metadata.filePath);

      // ファイルの存在確認
      const [exists] = await file.exists();
      if (!exists) {
        return false;
      }

      // チェックサム検証
      const [buffer] = await file.download();
      const actualChecksum = crypto.createHash('md5').update(buffer).digest('hex');
      
      return actualChecksum === metadata.checksum;
    } catch (error) {
      console.error('File integrity verification error:', error);
      return false;
    }
  }

  /**
   * 使用容量計算
   */
  async calculateStorageUsage(userId: string): Promise<number> {
    try {
      const files = await this.listFiles(userId);
      return files.reduce((total, file) => total + file.size, 0);
    } catch (error) {
      console.error('Calculate storage usage error:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();