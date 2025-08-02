import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase設定（本番環境では環境変数から取得）
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};

// Firebaseアプリ初期化
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'asia-northeast1'); // 東京リージョン

// 開発環境でのエミュレーター接続
if (import.meta.env.DEV) {
  const EMULATOR_HOST = 'localhost';
  
  // Firebase Auth Emulator
  if (!auth.app.options.apiKey?.includes('demo-')) {
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, {
      disableWarnings: true
    });
  }
  
  // Firestore Emulator
  if (!db.app.options.projectId?.includes('demo-')) {
    connectFirestoreEmulator(db, EMULATOR_HOST, 8080);
  }
  
  // Storage Emulator
  if (!storage.app.options.projectId?.includes('demo-')) {
    connectStorageEmulator(storage, EMULATOR_HOST, 9199);
  }
  
  // Functions Emulator
  if (!functions.app.options.projectId?.includes('demo-')) {
    connectFunctionsEmulator(functions, EMULATOR_HOST, 5001);
  }
}

export default app;