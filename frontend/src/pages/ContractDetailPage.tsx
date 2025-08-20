import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Stack,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

// Mock data
const mockContract = {
  id: '1',
  title: '業務委託契約書 - ABC株式会社',
  description: 'ソフトウェア開発業務に関する業務委託契約',
  partner: 'ABC株式会社',
  partnerEmail: 'contact@abc.co.jp',
  status: 'active',
  amount: 1000000,
  currency: 'JPY',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  createdAt: '2024-01-15',
  updatedAt: '2024-01-15',
  createdBy: '田中太郎',
  category: 'サービス契約',
  priority: 'high',
  confidentiality: 'confidential',
  tags: ['開発', '業務委託', '年間契約'],
  summary: 'ABC株式会社との年間業務委託契約。ソフトウェア開発業務を月額100万円で提供。',
  keyPoints: [
    '月額100万円の固定料金',
    '12ヶ月間の契約期間',
    '3ヶ月前の事前通知で解約可能',
    '成果物の著作権は発注者に帰属',
  ],
};

const ContractDetailPage: React.FC = () => {
  const { t, formatCurrency, formatDate } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      draft: 'default',
      review: 'warning',
      approved: 'info',
      signed: 'success',
      active: 'success',
      expired: 'error',
      terminated: 'error',
      cancelled: 'error',
    };
    return statusColors[status] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const priorityColors: Record<string, 'success' | 'warning' | 'error'> = {
      low: 'success',
      medium: 'warning',
      high: 'error',
    };
    return priorityColors[priority] || 'warning';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/contracts')}
          sx={{ mb: 2 }}
        >
          {t('common.back')}
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {mockContract.title}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip
                label={t(`contractStatus.${mockContract.status}`)}
                color={getStatusColor(mockContract.status)}
              />
              <Chip
                label={t(`priority.${mockContract.priority}`)}
                color={getPriorityColor(mockContract.priority)}
                variant="outlined"
              />
              <Chip
                label={t(`confidentiality.${mockContract.confidentiality}`)}
                variant="outlined"
              />
            </Stack>
          </Box>
          
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/contracts/${id}/edit`)}
            >
              {t('common.edit')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
            >
              {t('common.download')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
            >
              {t('common.share')}
            </Button>
          </Stack>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* 基本情報 */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('contractForm.basicInfo')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('contract.title')}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {mockContract.title}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('contract.category')}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {mockContract.category}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('contract.description')}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {mockContract.description}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('contract.tags')}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  {mockContract.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* 取引先情報 */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('contractForm.partnerInfo')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('contract.partnerName')}
                </Typography>
                <Typography variant="body1">
                  {mockContract.partner}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('contract.partnerEmail')}
                </Typography>
                <Typography variant="body1">
                  {mockContract.partnerEmail}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* AI分析結果 */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              AI分析結果
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('contract.summary')}
              </Typography>
              <Typography variant="body1">
                {mockContract.summary}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('contract.keyPoints')}
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                {mockContract.keyPoints.map((point, index) => (
                  <Typography key={index} component="li" variant="body2" sx={{ mb: 1 }}>
                    {point}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* サイドバー */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('contractForm.contractDetails')}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('contract.amount')}
                </Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(mockContract.amount)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('contract.startDate')}
                </Typography>
                <Typography variant="body1">
                  {formatDate(mockContract.startDate)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('contract.endDate')}
                </Typography>
                <Typography variant="body1">
                  {formatDate(mockContract.endDate)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('contract.createdBy')}
                </Typography>
                <Typography variant="body1">
                  {mockContract.createdBy}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('contract.createdAt')}
                </Typography>
                <Typography variant="body1">
                  {formatDate(mockContract.createdAt)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ContractDetailPage;