import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// サポート言語の定義
export type SupportedLanguage = 'ja' | 'en';

export interface Language {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'en', name: 'English', nativeName: 'English' }
];

interface I18nContextType {
  currentLanguage: SupportedLanguage;
  languages: Language[];
  changeLanguage: (languageCode: SupportedLanguage) => Promise<void>;
  isChangingLanguage: boolean;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string) => string;
  formatDateTime: (date: Date | string) => string;
  formatNumber: (value: number) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

interface I18nProviderProps {
  children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    (i18n.language as SupportedLanguage) || 'ja'
  );
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  // 言語変更時の処理
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng as SupportedLanguage);
      setIsChangingLanguage(false);
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // 言語切り替え関数
  const changeLanguage = async (languageCode: SupportedLanguage): Promise<void> => {
    if (languageCode === currentLanguage || isChangingLanguage) {
      return;
    }

    try {
      setIsChangingLanguage(true);
      await i18n.changeLanguage(languageCode);
      
      // ブラウザの HTML lang 属性を更新
      document.documentElement.lang = languageCode;
      
      // Material UI の方向性を更新（将来的にRTL言語対応する場合）
      document.dir = languageCode === 'ar' ? 'rtl' : 'ltr';
      
    } catch (error) {
      console.error('Failed to change language:', error);
      setIsChangingLanguage(false);
      throw error;
    }
  };

  // 通貨フォーマット
  const formatCurrency = (amount: number): string => {
    const currency = currentLanguage === 'ja' ? 'JPY' : 'USD';
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount);
  };

  // 日付フォーマット
  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(currentLanguage, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  };

  // 日時フォーマット
  const formatDateTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(currentLanguage, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  };

  // 数値フォーマット
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat(currentLanguage).format(value);
  };

  const value: I18nContextType = {
    currentLanguage,
    languages: SUPPORTED_LANGUAGES,
    changeLanguage,
    isChangingLanguage,
    formatCurrency,
    formatDate,
    formatDateTime,
    formatNumber,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

// 翻訳用のカスタムフック（react-i18nextとの衝突を避けるため別名）
export const useAppTranslation = () => {
  const { t, i18n } = useTranslation();
  const i18nContext = useI18n();
  
  return {
    t,
    i18n,
    ...i18nContext,
  };
};