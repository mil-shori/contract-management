import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

interface FileMetadata {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  contractId?: string;
  tags: string[];
  isPublic: boolean;
  downloadUrl: string;
}

interface FileUploadProps {
  contractId?: string;
  onFileUploaded?: (file: FileMetadata) => void;
  onFileUpload?: (files: File[]) => void;
  maxFiles?: number;
  allowedTypes?: string[];
}

const FileUpload: React.FC<FileUploadProps> = ({
  contractId,
  onFileUploaded,
  onFileUpload,
  maxFiles = 10,
  allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'text/plain'],
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // アップロード設定ダイアログ
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadTags, setUploadTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // ファイル一覧の読み込み
  const loadFiles = useCallback(async () => {
    if (!user) return;

    try {
      let q = query(
        collection(db, 'files'),
        where('uploadedBy', '==', user.uid),
        orderBy('uploadedAt', 'desc')
      );

      if (contractId) {
        q = query(q, where('contractId', '==', contractId));
      }

      const snapshot = await getDocs(q);
      const fileList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate(),
      })) as FileMetadata[];

      setFiles(fileList);
    } catch (err) {
      console.error('Failed to load files:', err);
      setError(t('files.loadError', 'ファイルの読み込みに失敗しました'));
    }
  }, [user, contractId, t]);

  // 初期読み込み
  React.useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // ドラッグ&ドロップ設定
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      // ファイルサイズチェック (10MB制限)
      if (file.size > 10 * 1024 * 1024) {
        setError(t('files.fileTooLarge', `${file.name} はファイルサイズが大きすぎます (最大10MB)`));
        return false;
      }

      // ファイル形式チェック
      if (!allowedTypes.includes(file.type)) {
        setError(t('files.fileTypeNotAllowed', `${file.name} はサポートされていないファイル形式です`));
        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      setUploadDialog(true);
      setError(null);
      
      // If onFileUpload callback is provided (for simple file handling)
      if (onFileUpload) {
        onFileUpload(validFiles);
      }
    }
  }, [allowedTypes, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    accept: allowedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
  });

  // ファイルアップロード実行
  const handleUpload = async () => {
    if (!user || selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const uploadPromises = selectedFiles.map(async (file, index) => {
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = contractId 
          ? `contracts/${contractId}/${fileName}`
          : `users/${user.uid}/${fileName}`;

        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise<FileMetadata>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(prev => Math.max(prev, progress / selectedFiles.length * (index + 1)));
            },
            (error) => {
              console.error('Upload error:', error);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                
                const fileMetadata: Omit<FileMetadata, 'id'> = {
                  originalName: file.name,
                  fileName,
                  mimeType: file.type,
                  size: file.size,
                  uploadedBy: user.uid,
                  uploadedAt: new Date(),
                  contractId,
                  tags: uploadTags.split(',').map(tag => tag.trim()).filter(Boolean),
                  isPublic,
                  downloadUrl: downloadURL,
                };

                const docRef = await addDoc(collection(db, 'files'), fileMetadata);
                const newFile = { id: docRef.id, ...fileMetadata };
                
                resolve(newFile);
              } catch (err) {
                reject(err);
              }
            }
          );
        });
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      
      setFiles(prev => [...uploadedFiles, ...prev]);
      setSuccess(t('files.uploadSuccess', `${uploadedFiles.length}個のファイルをアップロードしました`));
      
      uploadedFiles.forEach(file => {
        onFileUploaded?.(file);
      });

      // ダイアログを閉じる
      setUploadDialog(false);
      setSelectedFiles([]);
      setUploadTags('');
      setIsPublic(false);
      
    } catch (err) {
      console.error('Upload failed:', err);
      setError(t('files.uploadError', 'ファイルのアップロードに失敗しました'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ファイル削除
  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteDoc(doc(db, 'files', fileId));
      setFiles(prev => prev.filter(f => f.id !== fileId));
      setSuccess(t('files.deleteSuccess', 'ファイルを削除しました'));
    } catch (err) {
      console.error('Delete failed:', err);
      setError(t('files.deleteError', 'ファイルの削除に失敗しました'));
    }
  };

  // ファイルサイズのフォーマット
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // ファイルタイプアイコン
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return '🖼️';
    } else if (mimeType === 'application/pdf') {
      return '📄';
    } else if (mimeType.startsWith('text/')) {
      return '📝';
    } else {
      return '📄';
    }
  };

  return (
    <Box>
      {/* アップロード領域 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: isDragActive ? 'action.hover' : 'transparent',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'action.hover',
                borderColor: 'primary.main',
              },
            }}
          >
            <input {...getInputProps()} />
            <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive
                ? t('files.dropFiles', 'ファイルをここにドロップしてください')
                : t('files.dragFiles', 'ファイルをドラッグ&ドロップまたはクリックして選択')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('files.supportedFormats', 'サポート形式: PDF, JPEG, PNG, GIF, TXT')} (最大10MB)
            </Typography>
          </Box>

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                {t('files.uploading', 'アップロード中...')} {Math.round(uploadProgress)}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* エラー・成功メッセージ */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* ファイル一覧 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('files.fileList', 'ファイル一覧')} ({files.length})
          </Typography>

          {files.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              {t('files.noFiles', 'アップロードされたファイルはありません')}
            </Typography>
          ) : (
            <List>
              {files.map((file) => (
                <ListItem key={file.id} divider>
                  <Box sx={{ mr: 2, fontSize: '1.5rem' }}>
                    {getFileIcon(file.mimeType)}
                  </Box>
                  <ListItemText
                    primary={file.originalName}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {formatFileSize(file.size)} • {file.uploadedAt?.toLocaleDateString()}
                        </Typography>
                        {file.tags.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            {file.tags.map((tag, index) => (
                              <Chip
                                key={index}
                                label={tag}
                                size="small"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => window.open(file.downloadUrl, '_blank')}
                      title={t('files.download', 'ダウンロード')}
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteFile(file.id)}
                      title={t('files.delete', '削除')}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* アップロード設定ダイアログ */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('files.uploadSettings', 'アップロード設定')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            {t('files.selectedFiles', '選択されたファイル')}:
          </Typography>
          <List dense>
            {selectedFiles.map((file, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={file.name}
                  secondary={`${formatFileSize(file.size)} • ${file.type}`}
                />
              </ListItem>
            ))}
          </List>

          <TextField
            fullWidth
            label={t('files.tags', 'タグ (カンマ区切り)')}
            value={uploadTags}
            onChange={(e) => setUploadTags(e.target.value)}
            placeholder="契約書, 重要, レビュー済み"
            sx={{ mt: 2, mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
            }
            label={t('files.makePublic', '公開設定')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>
            {t('common.cancel', 'キャンセル')}
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploading}
            startIcon={<UploadIcon />}
          >
            {uploading ? t('files.uploading', 'アップロード中...') : t('files.upload', 'アップロード')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileUpload;