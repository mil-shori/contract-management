import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Link,
  Alert,
  Stack,
  Card,
  CardContent,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Google as GoogleIcon,
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import LoadingScreen from '../components/LoadingScreen';
import LanguageSwitcher from '../components/LanguageSwitcher';

// バリデーションスキーマ
const loginSchema = yup.object({
  email: yup
    .string()
    .email('有効なメールアドレスを入力してください')
    .required('メールアドレスは必須です'),
  password: yup
    .string()
    .min(6, 'パスワードは6文字以上で入力してください')
    .required('パスワードは必須です'),
});

const signupSchema = yup.object({
  displayName: yup
    .string()
    .required('表示名は必須です')
    .min(2, '表示名は2文字以上で入力してください'),
  email: yup
    .string()
    .email('有効なメールアドレスを入力してください')
    .required('メールアドレスは必須です'),
  password: yup
    .string()
    .min(6, 'パスワードは6文字以上で入力してください')
    .required('パスワードは必須です'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'パスワードが一致しません')
    .required('パスワード確認は必須です'),
});

interface LoginFormData {
  email: string;
  password: string;
}

interface SignupFormData extends LoginFormData {
  displayName: string;
  confirmPassword: string;
}

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const currentSchema = isSignUp ? signupSchema : loginSchema;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<SignupFormData>({
    resolver: yupResolver(currentSchema),
    mode: 'onBlur'
  });

  // Google サインイン
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError(error.message || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  // メールサインイン・サインアップ
  const onSubmit = async (data: SignupFormData) => {
    try {
      setLoading(true);
      setError('');
      
      if (isSignUp) {
        await signUpWithEmail(data.email, data.password, data.displayName);
      } else {
        await signInWithEmail(data.email, data.password);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || (isSignUp ? t('auth.signupError') : t('auth.loginError')));
    } finally {
      setLoading(false);
    }
  };

  // サインアップ・サインインの切り替え
  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    reset();
  };

  if (loading) {
    return <LoadingScreen message={t('auth.pleaseLogin')} />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      {/* 言語切り替えボタン（右上） */}
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <LanguageSwitcher />
      </Box>

      <Container maxWidth="sm">
        <Card
          elevation={8}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* ヘッダー */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <BusinessIcon 
                sx={{ 
                  fontSize: 48, 
                  color: 'primary.main', 
                  mb: 2 
                }} 
              />
              <Typography variant="h4" component="h1" gutterBottom>
                契約管理システム
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {isSignUp ? t('auth.signup') : t('auth.login')}
              </Typography>
            </Box>

            {/* エラーメッセージ */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Google サインイン */}
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignIn}
              disabled={loading}
              sx={{
                mb: 3,
                py: 1.5,
                borderColor: '#4285f4',
                color: '#4285f4',
                '&:hover': {
                  borderColor: '#3367d6',
                  backgroundColor: 'rgba(66, 133, 244, 0.04)',
                },
              }}
            >
              {t('auth.loginWithGoogle')}
            </Button>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                または
              </Typography>
            </Divider>

            {/* メールフォーム */}
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={3}>
                {isSignUp && (
                  <TextField
                    fullWidth
                    label={t('auth.displayName')}
                    {...register('displayName')}
                    error={!!errors.displayName}
                    helperText={errors.displayName?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}

                <TextField
                  fullWidth
                  type="email"
                  label={t('auth.email')}
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  label={t('auth.password')}
                  {...register('password')}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {isSignUp && (
                  <TextField
                    fullWidth
                    type={showConfirmPassword ? 'text' : 'password'}
                    label={t('auth.confirmPassword')}
                    {...register('confirmPassword')}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ py: 1.5, mt: 2 }}
                >
                  {isSignUp ? t('auth.signup') : t('auth.login')}
                </Button>
              </Stack>
            </Box>

            {/* パスワードを忘れた場合のリンク */}
            {!isSignUp && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => {/* パスワードリセット処理 */}}
                >
                  {t('auth.forgotPassword')}
                </Link>
              </Box>
            )}

            {/* サインアップ・サインインの切り替え */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {isSignUp ? 'すでにアカウントをお持ちですか？' : 'アカウントをお持ちでない方は'}
              </Typography>
              <Link
                component="button"
                variant="body2"
                onClick={toggleAuthMode}
                sx={{ fontWeight: 600 }}
              >
                {isSignUp ? t('auth.login') : t('auth.signup')}
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginPage;