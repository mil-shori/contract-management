import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Alert,
  Stack,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Info as InfoIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from '../components/LanguageSwitcher';

const SettingsPage: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      contractExpiry: true,
      statusUpdates: true,
      weeklyReport: false,
    },
    security: {
      twoFactor: false,
      sessionTimeout: true,
      loginAlerts: true,
    },
  });

  const handleNotificationChange = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: event.target.checked,
      },
    }));
  };

  const handleSecurityChange = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: event.target.checked,
      },
    }));
  };

  const handleSaveSettings = () => {
    // Save settings logic here
    console.log('Settings saved:', settings);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('settings.title')}
      </Typography>

      <Grid container spacing={3}>
        {/* Language Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LanguageIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  {t('settings.language')}
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                アプリケーションの表示言語を変更できます
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  現在の言語: {currentLanguage === 'ja' ? '日本語' : 'English'}
                </Typography>
                <LanguageSwitcher variant="menu" showLabel />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  {t('settings.notifications')}
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                通知の受信方法を設定できます
              </Typography>

              <Stack spacing={2} sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.email}
                      onChange={handleNotificationChange('email')}
                    />
                  }
                  label="メール通知"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.push}
                      onChange={handleNotificationChange('push')}
                    />
                  }
                  label="プッシュ通知"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.contractExpiry}
                      onChange={handleNotificationChange('contractExpiry')}
                    />
                  }
                  label="契約期限の通知"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.statusUpdates}
                      onChange={handleNotificationChange('statusUpdates')}
                    />
                  }
                  label="ステータス更新の通知"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.weeklyReport}
                      onChange={handleNotificationChange('weeklyReport')}
                    />
                  }
                  label="週次レポート"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  {t('settings.security')}
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                アカウントのセキュリティ設定を管理できます
              </Typography>

              <Stack spacing={2} sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.security.twoFactor}
                      onChange={handleSecurityChange('twoFactor')}
                    />
                  }
                  label="二段階認証"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.security.sessionTimeout}
                      onChange={handleSecurityChange('sessionTimeout')}
                    />
                  }
                  label="自動ログアウト"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.security.loginAlerts}
                      onChange={handleSecurityChange('loginAlerts')}
                    />
                  }
                  label="ログイン通知"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* App Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  {t('settings.about')}
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                アプリケーションの情報
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">
                  {t('settings.version')}: 1.0.0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  契約管理システム
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Firebase + React + TypeScript
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
        >
          設定を保存
        </Button>
      </Box>

      {/* Information Alert */}
      <Alert severity="info" sx={{ mt: 3 }}>
        設定の変更はリアルタイムで反映されます。一部の設定はページをリロードした後に有効になります。
      </Alert>
    </Box>
  );
};

export default SettingsPage;