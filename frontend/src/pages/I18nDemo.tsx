import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  Alert,
} from '@mui/material';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from '../components/LanguageSwitcher';

const I18nDemo: React.FC = () => {
  const { t, currentLanguage, formatCurrency, formatDate, formatNumber } = useTranslation();

  const sampleData = {
    contract: {
      title: '業務委託契約書 - ABC株式会社',
      partner: 'ABC株式会社',
      status: 'active',
      amount: 1000000,
      startDate: new Date('2024-01-01'),
      priority: 'high',
      confidentiality: 'confidential',
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>
          🌐 {t('settings.language')}
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          国際化 (i18n) デモンストレーション
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          現在の言語: <strong>{currentLanguage === 'ja' ? '日本語' : 'English'}</strong>
        </Typography>
        
        <LanguageSwitcher />
      </Box>

      <Alert severity="success" sx={{ mb: 4 }}>
        <Typography variant="body1">
          ✅ {t('settings.languageChanged')} - 言語切り替えが正常に動作しています
        </Typography>
      </Alert>

      <Stack spacing={3}>
        {/* Common Translations */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('common.loading')} / {t('common.save')} / {t('common.delete')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Common UI translations
            </Typography>
          </CardContent>
        </Card>

        {/* Navigation Translations */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🧭 Navigation
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={t('navigation.dashboard')} />
              <Chip label={t('navigation.contracts')} />
              <Chip label={t('navigation.newContract')} />
              <Chip label={t('navigation.settings')} />
            </Stack>
          </CardContent>
        </Card>

        {/* Contract Translations */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📄 {t('contractList.title')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>{t('contract.title')}:</strong> {sampleData.contract.title}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>{t('contract.partner')}:</strong> {sampleData.contract.partner}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>{t('contract.status')}:</strong> 
              <Chip 
                label={t(`contractStatus.${sampleData.contract.status}`)} 
                color="success" 
                size="small" 
                sx={{ ml: 1 }} 
              />
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>{t('contract.priority')}:</strong> 
              <Chip 
                label={t(`priority.${sampleData.contract.priority}`)} 
                color="error" 
                size="small" 
                sx={{ ml: 1 }} 
              />
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>{t('contract.confidentiality')}:</strong> 
              <Chip 
                label={t(`confidentiality.${sampleData.contract.confidentiality}`)} 
                variant="outlined" 
                size="small" 
                sx={{ ml: 1 }} 
              />
            </Typography>
          </CardContent>
        </Card>

        {/* Formatting Demonstrations */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              💰 {t('contract.amount')} & Formatting
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Currency:</strong> {formatCurrency(sampleData.contract.amount)}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Date:</strong> {formatDate(sampleData.contract.startDate)}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Number:</strong> {formatNumber(1234567.89)}
            </Typography>
          </CardContent>
        </Card>

        {/* Error Messages */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ⚠️ {t('errors.networkError')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('errors.tryAgain')}
            </Typography>
          </CardContent>
        </Card>

        {/* Dashboard Welcome */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🏠 {t('dashboard.title')}
            </Typography>
            <Typography variant="body1">
              {t('dashboard.welcome', { name: 'デモユーザー' })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('dashboard.totalContracts')}: 124 / {t('dashboard.activeContracts')}: 87
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="primary" gutterBottom>
          🎉 i18n Implementation Complete!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          254 translation keys implemented for Japanese and English
        </Typography>
      </Box>
    </Container>
  );
};

export default I18nDemo;