import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Description as ContractIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation, useContractTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';

// モックデータ（実際の実装では API から取得）
const mockStats = {
  totalContracts: 124,
  activeContracts: 87,
  expiringSoon: 5,
  pendingReview: 12
};

const mockRecentActivity = [
  {
    id: '1',
    type: 'created',
    title: '業務委託契約書 - ABC株式会社',
    timestamp: new Date('2024-01-15T10:30:00'),
    status: 'draft'
  },
  {
    id: '2',
    type: 'signed',
    title: 'システム開発契約 - XYZ Corporation',
    timestamp: new Date('2024-01-14T15:45:00'),
    status: 'signed'
  },
  {
    id: '3',
    type: 'expired',
    title: '保守契約 - 123システムズ',
    timestamp: new Date('2024-01-13T09:15:00'),
    status: 'expired'
  }
];

const mockUpcomingDeadlines = [
  {
    id: '1',
    title: 'ライセンス契約 - ソフトウェア会社A',
    endDate: new Date('2024-02-15'),
    daysLeft: 15,
    status: 'active'
  },
  {
    id: '2',
    title: '賃貸借契約 - オフィスビルB',
    endDate: new Date('2024-03-01'),
    daysLeft: 30,
    status: 'active'
  }
];

const DashboardPage: React.FC = () => {
  const { t, formatDate } = useTranslation();
  const { getStatusColor } = useContractTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // データ読み込みのシミュレーション
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    loading?: boolean;
  }> = ({ title, value, icon, color, loading = false }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="h6">
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={80} height={40} />
            ) : (
              <Typography variant="h4" component="div">
                {value.toLocaleString()}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* ウェルカムメッセージ */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('dashboard.welcome', { name: user?.displayName || 'ユーザー' })}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          今日も契約管理を効率的に進めましょう
        </Typography>
      </Box>

      {/* 統計カード */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('dashboard.totalContracts')}
            value={mockStats.totalContracts}
            icon={<ContractIcon />}
            color="primary.main"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('dashboard.activeContracts')}
            value={mockStats.activeContracts}
            icon={<CheckCircleIcon />}
            color="success.main"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('dashboard.expiringSoon')}
            value={mockStats.expiringSoon}
            icon={<WarningIcon />}
            color="warning.main"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="レビュー待ち"
            value={mockStats.pendingReview}
            icon={<TrendingUpIcon />}
            color="info.main"
            loading={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* 最近の活動 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('dashboard.recentActivity')}
            </Typography>
            {loading ? (
              <Box>
                {[1, 2, 3].map((item) => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <List>
                {mockRecentActivity.map((activity) => (
                  <ListItem key={activity.id} divider>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `${getStatusColor(activity.status)}.main` }}>
                        <ContractIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.title}
                      secondary={`${formatDate(activity.timestamp)} • ${t(`contractStatus.${activity.status}`)}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/contracts')}
              >
                すべての契約を見る
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* 期限が近い契約 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('dashboard.upcomingDeadlines')}
            </Typography>
            {loading ? (
              <Box>
                {[1, 2].map((item) => (
                  <Box key={item} sx={{ mb: 2 }}>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="60%" />
                  </Box>
                ))}
              </Box>
            ) : mockUpcomingDeadlines.length > 0 ? (
              <List>
                {mockUpcomingDeadlines.map((contract) => (
                  <ListItem key={contract.id} divider>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <ScheduleIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={contract.title}
                      secondary={`期限: ${formatDate(contract.endDate)}`}
                    />
                    <Chip
                      label={`${contract.daysLeft}日後`}
                      color={contract.daysLeft <= 30 ? 'error' : 'warning'}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                期限が近い契約はありません
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* クイックアクション */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => navigate('/contracts/new')}
          sx={{ minWidth: 200 }}
        >
          {t('navigation.newContract')}
        </Button>
      </Box>
    </Box>
  );
};

export default DashboardPage;