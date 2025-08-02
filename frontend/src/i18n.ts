import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 翻訳リソース
import jaTranslations from './locales/ja.json';
import enTranslations from './locales/en.json';

const resources = {
  ja: {
    translation: jaTranslations
  },
  en: {
    translation: enTranslations
  }
};

i18n
  // ブラウザ言語の検出
  .use(LanguageDetector)
  // React I18next plugin
  .use(initReactI18next)
  // 初期化
  .init({
    resources,
    
    // フォールバック言語
    fallbackLng: 'ja',
    
    // デバッグモード（開発時のみ）
    debug: import.meta.env.DEV,
    
    // 言語検出オプション
    detection: {
      // 検出順序: localStorage -> navigator -> htmlTag
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // キャッシュ設定
      caches: ['localStorage'],
      
      // LocalStorageのキー
      lookupLocalStorage: 'i18nextLng',
      
      // 候補言語のチェック
      checkWhitelist: true,
    },
    
    // サポート言語のホワイトリスト
    supportedLngs: ['ja', 'en'],
    
    // 言語コードの正規化（ja-JP -> ja）
    nonExplicitSupportedLngs: true,
    
    // 補間設定
    interpolation: {
      // React では XSS 対策済みなので無効化
      escapeValue: false,
      
      // フォーマット関数
      format: (value, format, lng) => {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (format === 'currency') {
          return new Intl.NumberFormat(lng, {
            style: 'currency',
            currency: lng === 'ja' ? 'JPY' : 'USD'
          }).format(value);
        }
        if (format === 'date') {
          return new Intl.DateTimeFormat(lng).format(new Date(value));
        }
        if (format === 'datetime') {
          return new Intl.DateTimeFormat(lng, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).format(new Date(value));
        }
        return value;
      }
    },
    
    // 名前空間設定
    defaultNS: 'translation',
    ns: 'translation',
    
    // キーが見つからない場合の処理
    returnKeyIfMissingInterpolation: true,
    returnEmptyString: false,
    
    // 言語変更時の処理
    react: {
      // Suspense を使用しない
      useSuspense: false,
      
      // bindI18n イベント
      bindI18n: 'languageChanged',
      
      // bindI18nStore イベント
      bindI18nStore: false,
      
      // トランザクション中の翻訳更新を無効化
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
    }
  });

export default i18n;