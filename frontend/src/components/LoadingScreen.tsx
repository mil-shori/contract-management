import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Backdrop,
  LinearProgress
} from '@mui/material';
import { useTranslation } from '../hooks/useTranslation';

interface LoadingScreenProps {
  message?: string;
  variant?: 'fullscreen' | 'inline' | 'linear';
  size?: 'small' | 'medium' | 'large';
  open?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message,
  variant = 'fullscreen',
  size = 'medium',
  open = true
}) => {
  const { t } = useTranslation();

  const getSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'medium':
        return 40;
      case 'large':
        return 60;
      default:
        return 40;
    }
  };

  const loadingMessage = message || t('common.loading');

  // Linear progress variant
  if (variant === 'linear') {
    return (
      <Box sx={{ width: '100%', mb: 2 }}>
        <LinearProgress color="primary" />
        {loadingMessage && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ mt: 1, textAlign: 'center' }}
          >
            {loadingMessage}
          </Typography>
        )}
      </Box>
    );
  }

  // Inline variant
  if (variant === 'inline') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          px: 2,
        }}
      >
        <CircularProgress 
          size={getSize()} 
          color="primary"
          sx={{ mb: 2 }}
        />
        {loadingMessage && (
          <Typography 
            variant="body1" 
            color="text.secondary"
            textAlign="center"
          >
            {loadingMessage}
          </Typography>
        )}
      </Box>
    );
  }

  // Fullscreen variant (default)
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        flexDirection: 'column',
      }}
      open={open}
    >
      <CircularProgress 
        size={getSize()} 
        color="inherit"
        sx={{ mb: 2 }}
      />
      {loadingMessage && (
        <Typography 
          variant="h6" 
          color="inherit"
          textAlign="center"
          sx={{ fontWeight: 400 }}
        >
          {loadingMessage}
        </Typography>
      )}
    </Backdrop>
  );
};

// 特定の用途向けのプリセット
export const PageLoadingScreen: React.FC<{ message?: string }> = ({ message }) => (
  <LoadingScreen 
    variant="inline" 
    size="large" 
    message={message}
  />
);

export const ButtonLoadingScreen: React.FC<{ message?: string }> = ({ message }) => (
  <LoadingScreen 
    variant="inline" 
    size="small" 
    message={message}
  />
);

export const FormLoadingScreen: React.FC<{ message?: string }> = ({ message }) => (
  <LoadingScreen 
    variant="linear" 
    message={message}
  />
);

export default LoadingScreen;