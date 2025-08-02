import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

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

interface FilePreviewProps {
  file: FileMetadata | null;
  open: boolean;
  onClose: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, open, onClose }) => {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!file) return null;

  // ファイルサイズのフォーマット
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // ズーム操作
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
  const handleZoomReset = () => setZoom(1);

  // ダウンロード
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.downloadUrl;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 印刷
  const handlePrint = () => {
    if (file.mimeType === 'application/pdf') {
      const printWindow = window.open(file.downloadUrl, '_blank');
      printWindow?.focus();
      printWindow?.print();
    } else {
      window.print();
    }
  };

  // ファイルコンテンツのレンダリング
  const renderFileContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2 }}>
            {t('files.loading', '読み込み中...')}
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      );
    }

    // PDFファイルの場合
    if (file.mimeType === 'application/pdf') {
      return (
        <Box sx={{ height: 600, overflow: 'auto' }}>
          <iframe
            src={`${file.downloadUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            width="100%"
            height="100%"
            style={{
              border: 'none',
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
            onLoad={() => setLoading(false)}
            onError={() => {
              setError(t('files.previewError', 'プレビューの読み込みに失敗しました'));
              setLoading(false);
            }}
            title={file.originalName}
          />
        </Box>
      );
    }

    // 画像ファイルの場合
    if (file.mimeType.startsWith('image/')) {
      return (
        <Box sx={{ textAlign: 'center', overflow: 'auto', maxHeight: 600 }}>
          <img
            src={file.downloadUrl}
            alt={file.originalName}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              transform: `scale(${zoom})`,
              transformOrigin: 'center',
              cursor: zoom > 1 ? 'grab' : 'default',
            }}
            onLoad={() => setLoading(false)}
            onError={() => {
              setError(t('files.previewError', 'プレビューの読み込みに失敗しました'));
              setLoading(false);
            }}
          />
        </Box>
      );
    }

    // テキストファイルの場合
    if (file.mimeType.startsWith('text/')) {
      const [textContent, setTextContent] = useState<string>('');

      React.useEffect(() => {
        fetch(file.downloadUrl)
          .then(response => response.text())
          .then(text => {
            setTextContent(text);
            setLoading(false);
          })
          .catch(() => {
            setError(t('files.previewError', 'プレビューの読み込みに失敗しました'));
            setLoading(false);
          });
      }, [file.downloadUrl]);

      return (
        <Box sx={{ height: 600, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
          <pre
            style={{
              fontFamily: 'monospace',
              fontSize: `${14 * zoom}px`,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {textContent}
          </pre>
        </Box>
      );
    }

    // サポートされていないファイル形式
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h6" gutterBottom>
          {t('files.previewNotSupported', 'このファイル形式のプレビューはサポートされていません')}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('files.downloadToView', 'ファイルをダウンロードして表示してください')}
        </Typography>
        <Button variant="contained" onClick={handleDownload} startIcon={<DownloadIcon />}>
          {t('files.download', 'ダウンロード')}
        </Button>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" component="div" noWrap>
              {file.originalName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatFileSize(file.size)} • {file.uploadedAt.toLocaleDateString()} • {file.mimeType}
            </Typography>
          </Box>
          <IconButton edge="end" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* タグ表示 */}
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

        {/* ツールバー */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          {/* ズーム操作（画像・PDFの場合） */}
          {(file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf') && (
            <>
              <IconButton size="small" onClick={handleZoomOut} disabled={zoom <= 0.25}>
                <ZoomOutIcon />
              </IconButton>
              <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'center' }}>
                {Math.round(zoom * 100)}%
              </Typography>
              <IconButton size="small" onClick={handleZoomIn} disabled={zoom >= 3}>
                <ZoomInIcon />
              </IconButton>
              <Button size="small" onClick={handleZoomReset}>
                {t('files.resetZoom', '等倍')}
              </Button>
            </>
          )}

          <Box sx={{ flex: 1 }} />

          {/* アクション */}
          <IconButton size="small" onClick={handlePrint} title={t('files.print', '印刷')}>
            <PrintIcon />
          </IconButton>
          <IconButton size="small" onClick={handleDownload} title={t('files.download', 'ダウンロード')}>
            <DownloadIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        {renderFileContent()}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {t('common.close', '閉じる')}
        </Button>
        <Button onClick={handleDownload} variant="contained" startIcon={<DownloadIcon />}>
          {t('files.download', 'ダウンロード')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilePreview;