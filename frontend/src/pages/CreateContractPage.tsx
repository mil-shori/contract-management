import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Stack,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  Autocomplete,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from '../hooks/useTranslation';
import FileUpload from '../components/FileUpload';

// Validation schema
const contractSchema = yup.object({
  title: yup
    .string()
    .required('Contract title is required')
    .max(200, 'Title must be 200 characters or less'),
  description: yup
    .string()
    .max(1000, 'Description must be 1000 characters or less'),
  partnerName: yup
    .string()
    .required('Partner name is required'),
  partnerEmail: yup
    .string()
    .email('Please enter a valid email address'),
  amount: yup
    .number()
    .min(0, 'Amount must be 0 or greater')
    .required('Amount is required'),
  currency: yup
    .string()
    .required('Currency is required'),
  startDate: yup
    .date()
    .required('Start date is required'),
  endDate: yup
    .date()
    .min(yup.ref('startDate'), 'End date must be after start date'),
  category: yup
    .string()
    .required('Category is required'),
  priority: yup
    .string()
    .required('Priority is required'),
  confidentiality: yup
    .string()
    .required('Confidentiality level is required'),
});

interface ContractFormData {
  title: string;
  description: string;
  partnerName: string;
  partnerEmail: string;
  amount: number;
  currency: string;
  startDate: string;
  endDate: string;
  category: string;
  priority: string;
  confidentiality: string;
  tags: string[];
}

const categories = [
  'サービス契約',
  '販売契約',
  '購入契約',
  'ライセンス契約',
  '業務委託契約',
  '雇用契約',
  '賃貸借契約',
  'その他',
];

const availableTags = [
  '開発', '保守', '年間契約', '月額', '一時契約', 'SaaS', 'ライセンス',
  '機密', '重要', '定期更新', '自動更新', '解約可能',
];

const CreateContractPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [saving, setSaving] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ContractFormData>({
    resolver: yupResolver(contractSchema),
    defaultValues: {
      title: '',
      description: '',
      partnerName: '',
      partnerEmail: '',
      amount: 0,
      currency: 'JPY',
      startDate: '',
      endDate: '',
      category: '',
      priority: 'medium',
      confidentiality: 'internal',
      tags: [],
    },
  });

  const onSubmit = async (data: ContractFormData) => {
    try {
      setSaving(true);
      
      // API call simulation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Saving contract:', data);
      console.log('Uploaded files:', uploadedFiles);
      
      navigate('/contracts');
    } catch (error) {
      console.error('Error saving contract:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(isEdit ? `/contracts/${id}` : '/contracts');
  };

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(files);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {isEdit ? t('contractForm.editContract') : t('contractForm.newContract')}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Main Form */}
          <Grid item xs={12} lg={8}>
            {/* Basic Information */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('contractForm.basicInfo')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="title"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label={t('contract.title')}
                          error={!!errors.title}
                          helperText={errors.title?.message}
                          required
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label={t('contract.description')}
                          multiline
                          rows={3}
                          error={!!errors.description}
                          helperText={errors.description?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.category}>
                          <InputLabel>{t('contract.category')}</InputLabel>
                          <Select {...field} label={t('contract.category')} required>
                            {categories.map((category) => (
                              <MenuItem key={category} value={category}>
                                {category}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.category && (
                            <FormHelperText>{errors.category.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>{t('contract.priority')}</InputLabel>
                          <Select {...field} label={t('contract.priority')}>
                            <MenuItem value="low">{t('priority.low')}</MenuItem>
                            <MenuItem value="medium">{t('priority.medium')}</MenuItem>
                            <MenuItem value="high">{t('priority.high')}</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="tags"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          {...field}
                          multiple
                          options={availableTags}
                          freeSolo
                          value={field.value || []}
                          onChange={(_, newValue) => field.onChange(newValue)}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip
                                variant="outlined"
                                label={option}
                                {...getTagProps({ index })}
                                key={index}
                              />
                            ))
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label={t('contract.tags')}
                              placeholder="タグを追加..."
                            />
                          )}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Partner Information */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('contractForm.partnerInfo')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="partnerName"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label={t('contract.partnerName')}
                          error={!!errors.partnerName}
                          helperText={errors.partnerName?.message}
                          required
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="partnerEmail"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="email"
                          label={t('contract.partnerEmail')}
                          error={!!errors.partnerEmail}
                          helperText={errors.partnerEmail?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Contract Details */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('contractForm.contractDetails')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="amount"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="number"
                          label={t('contract.amount')}
                          error={!!errors.amount}
                          helperText={errors.amount?.message}
                          required
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="currency"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>{t('contract.currency')}</InputLabel>
                          <Select {...field} label={t('contract.currency')}>
                            <MenuItem value="JPY">日本円 (JPY)</MenuItem>
                            <MenuItem value="USD">米ドル (USD)</MenuItem>
                            <MenuItem value="EUR">ユーロ (EUR)</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="startDate"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="date"
                          label={t('contract.startDate')}
                          InputLabelProps={{ shrink: true }}
                          error={!!errors.startDate}
                          helperText={errors.startDate?.message}
                          required
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="endDate"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="date"
                          label={t('contract.endDate')}
                          InputLabelProps={{ shrink: true }}
                          error={!!errors.endDate}
                          helperText={errors.endDate?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="confidentiality"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>{t('contract.confidentiality')}</InputLabel>
                          <Select {...field} label={t('contract.confidentiality')}>
                            <MenuItem value="public">{t('confidentiality.public')}</MenuItem>
                            <MenuItem value="internal">{t('confidentiality.internal')}</MenuItem>
                            <MenuItem value="confidential">{t('confidentiality.confidential')}</MenuItem>
                            <MenuItem value="restricted">{t('confidentiality.restricted')}</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('contractForm.fileUpload')}
                </Typography>
                <FileUpload onFileUpload={handleFileUpload} />
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3, position: 'sticky', top: 24 }}>
              <Typography variant="h6" gutterBottom>
                保存オプション
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                契約を保存すると、AI分析が自動的に実行されます。
              </Alert>

              <Stack spacing={2}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<SaveIcon />}
                  disabled={saving}
                >
                  {saving ? '保存中...' : (isEdit ? t('common.save') : t('common.create'))}
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={saving}
                >
                  {t('common.cancel')}
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default CreateContractPage;