import { useTranslation as useReactI18nextTranslation } from 'react-i18next';
import { useI18n } from '../contexts/I18nContext';

// 翻訳機能とフォーマット機能を統合したカスタムフック
export const useTranslation = () => {
  const { t, i18n } = useReactI18nextTranslation();
  const i18nContext = useI18n();
  
  // 翻訳のショートカット関数
  const translate = (key: string, options?: any) => {
    return t(key, options);
  };

  // 契約ステータスの翻訳
  const translateContractStatus = (status: string) => {
    return t(`contractStatus.${status}`, { defaultValue: status });
  };

  // 優先度の翻訳
  const translatePriority = (priority: string) => {
    return t(`priority.${priority}`, { defaultValue: priority });
  };

  // 機密レベルの翻訳
  const translateConfidentiality = (level: string) => {
    return t(`confidentiality.${level}`, { defaultValue: level });
  };

  // リスクレベルの翻訳
  const translateRiskLevel = (level: string) => {
    return t(`riskLevel.${level}`, { defaultValue: level });
  };

  // エラーメッセージの翻訳
  const translateError = (errorKey: string, fallback?: string) => {
    return t(`errors.${errorKey}`, { defaultValue: fallback || t('errors.unexpectedError') });
  };

  // バリデーションエラーの翻訳
  const translateValidation = (field: string, rule: string, options?: any) => {
    return t(`contractForm.validation.${field}${rule}`, options);
  };

  // 複数形の翻訳（カウントに基づいて）
  const translatePlural = (key: string, count: number, options?: any) => {
    return t(key, { count, ...options });
  };

  // 相対時間の翻訳（例：「2時間前」）
  const translateRelativeTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return t('common.justNow', { defaultValue: 'Just now' });
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return t('common.minutesAgo', { count: minutes, defaultValue: `${minutes} minutes ago` });
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return t('common.hoursAgo', { count: hours, defaultValue: `${hours} hours ago` });
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return t('common.daysAgo', { count: days, defaultValue: `${days} days ago` });
    }
  };

  return {
    // 基本的な翻訳関数
    t: translate,
    i18n,
    
    // 特化した翻訳関数
    translateContractStatus,
    translatePriority,
    translateConfidentiality,
    translateRiskLevel,
    translateError,
    translateValidation,
    translatePlural,
    translateRelativeTime,
    
    // フォーマット関数（I18nContextから）
    currentLanguage: i18nContext.currentLanguage,
    languages: i18nContext.languages,
    changeLanguage: i18nContext.changeLanguage,
    isChangingLanguage: i18nContext.isChangingLanguage,
    formatCurrency: i18nContext.formatCurrency,
    formatDate: i18nContext.formatDate,
    formatDateTime: i18nContext.formatDateTime,
    formatNumber: i18nContext.formatNumber,
  };
};

// 特定のコンポーネント用の翻訳フック
export const useContractTranslation = () => {
  const translation = useTranslation();
  
  return {
    ...translation,
    // 契約関連の便利関数
    getStatusColor: (status: string) => {
      const statusColorMap: Record<string, string> = {
        draft: 'default',
        review: 'warning',
        approved: 'info',
        signed: 'success',
        active: 'success',
        expired: 'error',
        terminated: 'error',
        cancelled: 'error',
      };
      return statusColorMap[status] || 'default';
    },
    
    getPriorityColor: (priority: string) => {
      const priorityColorMap: Record<string, 'success' | 'warning' | 'error'> = {
        low: 'success',
        medium: 'warning',
        high: 'error',
      };
      return priorityColorMap[priority] || 'warning';
    },
    
    getRiskColor: (risk: string) => {
      const riskColorMap: Record<string, 'success' | 'warning' | 'error'> = {
        low: 'success',
        medium: 'warning',
        high: 'error',
      };
      return riskColorMap[risk] || 'warning';
    },
  };
};

export default useTranslation;