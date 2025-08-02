import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Container,
  Paper,
  Stack
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  BugReport as BugReportIcon,
  Home as HomeIcon
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // エラー報告サービスに送信（例：Sentry）
    // この部分は実際のエラー報告サービスに合わせて実装
    if (process.env.NODE_ENV === 'production') {
      // reportError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックUIがある場合
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // デフォルトのエラーUI
      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              border: '1px solid',
              borderColor: 'error.light'
            }}
          >
            <BugReportIcon 
              sx={{ 
                fontSize: 64, 
                color: 'error.main', 
                mb: 2 
              }} 
            />
            
            <Typography variant="h4" gutterBottom color="error">
              予期しないエラーが発生しました
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              申し訳ございませんが、アプリケーションでエラーが発生しました。
              ページを再読み込みするか、ホームページに戻ってお試しください。
            </Typography>

            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <AlertTitle>エラー詳細</AlertTitle>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                {this.state.error?.message}
              </Typography>
            </Alert>

            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              justifyContent="center"
            >
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
                color="primary"
              >
                再試行
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={this.handleGoHome}
                color="primary"
              >
                ホームに戻る
              </Button>
            </Stack>

            {/* 開発環境でのみエラー詳細を表示 */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <Box sx={{ mt: 4, textAlign: 'left' }}>
                <Typography variant="h6" gutterBottom>
                  開発者向け情報:
                </Typography>
                <Paper 
                  sx={{ 
                    p: 2, 
                    backgroundColor: 'grey.100',
                    overflow: 'auto',
                    maxHeight: 300
                  }}
                >
                  <Typography 
                    variant="body2" 
                    component="pre" 
                    sx={{ 
                      fontFamily: 'monospace', 
                      fontSize: '0.8rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {this.state.error?.stack}
                    {'\n\nComponent Stack:'}
                    {this.state.errorInfo.componentStack}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

// 関数コンポーネント版のエラーUI（React Error Boundary Hook用）
export const ErrorFallback: React.FC<{
  error: Error;
  resetError: () => void;
}> = ({ error, resetError }) => {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Alert severity="error" sx={{ mb: 2 }}>
        <AlertTitle>エラーが発生しました</AlertTitle>
        {error.message}
      </Alert>
      
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button 
          variant="contained" 
          onClick={resetError}
          startIcon={<RefreshIcon />}
        >
          再試行
        </Button>
      </Stack>
    </Container>
  );
};

// 軽量なエラー表示コンポーネント
export const SimpleErrorDisplay: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => {
  return (
    <Alert 
      severity="error" 
      action={
        onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            再試行
          </Button>
        )
      }
    >
      {message}
    </Alert>
  );
};

export default ErrorBoundary;