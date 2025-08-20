import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

// Mock data
const mockContracts = [
  {
    id: '1',
    title: '業務委託契約書 - ABC株式会社',
    partner: 'ABC株式会社',
    status: 'active',
    amount: 1000000,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    title: 'システム開発契約 - XYZ Corporation',
    partner: 'XYZ Corporation',
    status: 'signed',
    amount: 5000000,
    startDate: '2024-02-01',
    endDate: '2024-08-31',
    createdAt: '2024-01-20',
  },
  {
    id: '3',
    title: '保守契約 - 123システムズ',
    partner: '123システムズ',
    status: 'expired',
    amount: 300000,
    startDate: '2023-06-01',
    endDate: '2024-05-31',
    createdAt: '2023-05-15',
  },
];

const ContractsPage: React.FC = () => {
  const { t, formatCurrency, formatDate } = useTranslation();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  const filteredContracts = mockContracts.filter(contract =>
    contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.partner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedContracts = filteredContracts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {t('contractList.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/contracts/new')}
        >
          {t('navigation.newContract')}
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              fullWidth
              placeholder={t('contractList.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: { sm: 400 } }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('contract.title')}</TableCell>
                <TableCell>{t('contract.partner')}</TableCell>
                <TableCell>{t('contract.status')}</TableCell>
                <TableCell>{t('contract.amount')}</TableCell>
                <TableCell>{t('contract.endDate')}</TableCell>
                <TableCell align="center">{t('common.edit')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {t('contractList.noContracts')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedContracts.map((contract) => (
                  <TableRow key={contract.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {contract.title}
                      </Typography>
                    </TableCell>
                    <TableCell>{contract.partner}</TableCell>
                    <TableCell>
                      <Chip
                        label={t(`contractStatus.${contract.status}`)}
                        color={getStatusColor(contract.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(contract.amount)}</TableCell>
                    <TableCell>{formatDate(contract.endDate)}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/contracts/${contract.id}`)}
                          title={t('contractList.viewDetails')}
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/contracts/${contract.id}/edit`)}
                          title={t('contractList.editContract')}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          title={t('contractList.deleteContract')}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredContracts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={t('contractList.itemsPerPage')}
        />
      </Paper>
    </Box>
  );
};

export default ContractsPage;