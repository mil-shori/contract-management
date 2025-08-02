import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  customClaims: any;
  isAdmin: boolean;
  organizationId: string | null;
  signInWithGoogle: (domainRestriction?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  refreshCustomClaims: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [customClaims, setCustomClaims] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // カスタムクレームを取得
        await refreshCustomClaims();
      } else {
        setCustomClaims(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // カスタムクレームの更新
  const refreshCustomClaims = async () => {
    if (auth.currentUser) {
      try {
        const idTokenResult = await auth.currentUser.getIdTokenResult(true);
        setCustomClaims(idTokenResult.claims);
      } catch (error) {
        console.error('Failed to refresh custom claims:', error);
      }
    }
  };

  const signInWithGoogle = async (domainRestriction?: string) => {
    const provider = new GoogleAuthProvider();
    
    // Google Workspace ドメイン制限
    if (domainRestriction) {
      provider.setCustomParameters({
        hd: domainRestriction // 特定ドメインのみ許可
      });
    }
    
    // 必要なスコープを追加
    provider.addScope('https://www.googleapis.com/auth/userinfo.email');
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    provider.addScope('https://www.googleapis.com/auth/drive.readonly');
    provider.addScope('https://www.googleapis.com/auth/calendar');
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    provider.addScope('https://www.googleapis.com/auth/spreadsheets');
    
    // プロンプト設定
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      // ドメイン制限チェック
      if (domainRestriction && result.user.email) {
        const emailDomain = result.user.email.split('@')[1];
        if (emailDomain !== domainRestriction) {
          await signOut(auth);
          throw new Error(`このアプリは ${domainRestriction} ドメインのユーザーのみ利用できます`);
        }
      }
      
      // Google アクセストークンとリフレッシュトークンを保存
      if (credential?.accessToken) {
        localStorage.setItem('google_access_token', credential.accessToken);
        
        // リフレッシュトークン（OAuth 2.0）
        const refreshToken = credential.refreshToken;
        if (refreshToken) {
          localStorage.setItem('google_refresh_token', refreshToken);
        }
      }
      
      // カスタムクレームを設定するためのCloud Function呼び出し
      if (result.user) {
        await setUserCustomClaims(result.user);
      }
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Email sign-in error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // プロファイル更新
      await updateProfile(result.user, {
        displayName: displayName,
      });
      
      // 状態を更新
      setUser({
        ...result.user,
        displayName: displayName,
      } as User);
    } catch (error) {
      console.error('Email sign-up error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Google アクセストークンを削除
      localStorage.removeItem('google_access_token');
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (displayName: string, photoURL?: string) => {
    if (!user) throw new Error('No user signed in');
    
    try {
      await updateProfile(user, {
        displayName,
        photoURL,
      });
      
      // 状態を更新
      setUser({
        ...user,
        displayName,
        photoURL: photoURL || user.photoURL,
      } as User);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  // カスタムクレーム設定のためのCloud Function呼び出し
  const setUserCustomClaims = async (user: User) => {
    try {
      const idToken = await user.getIdToken();
      
      // Cloud Functionを呼び出してカスタムクレームを設定
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/set-custom-claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        })
      });
      
      if (!response.ok) {
        console.warn('Failed to set custom claims:', response.statusText);
      }
    } catch (error) {
      console.error('Error setting custom claims:', error);
    }
  };

  // 権限チェック
  const hasPermission = (permission: string): boolean => {
    if (!customClaims) return false;
    
    // 管理者は全権限
    if (customClaims.admin) return true;
    
    // 特定権限チェック
    return customClaims.permissions?.includes(permission) || false;
  };

  // 派生プロパティ
  const isAdmin = customClaims?.admin || false;
  const organizationId = customClaims?.organizationId || null;

  const value: AuthContextType = {
    user,
    loading,
    customClaims,
    isAdmin,
    organizationId,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    updateUserProfile,
    refreshCustomClaims,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};