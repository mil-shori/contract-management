import express from 'express';
import { body, validationResult } from 'express-validator';
import admin from 'firebase-admin';

const router = express.Router();

// カスタムクレーム設定エンドポイント
router.post('/set-custom-claims', [
  body('uid').isString().notEmpty(),
  body('email').isEmail(),
  body('displayName').optional().isString(),
], async (req: express.Request, res: express.Response) => {
  try {
    // バリデーションエラーチェック
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { uid, email, displayName } = req.body;

    // ユーザー認証チェック
    if (!req.user || req.user.uid !== uid) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Can only set claims for authenticated user'
      });
    }

    // 管理者判定（メールドメインベース）
    const emailDomain = email.split('@')[1];
    const isAdmin = await checkAdminDomain(emailDomain);
    
    // 組織ID決定
    const organizationId = await getOrganizationId(emailDomain);
    
    // デフォルト権限設定
    const defaultPermissions = [
      'contracts:read',
      'contracts:create',
      'contracts:update',
      'contracts:delete',
      'files:upload',
      'files:download'
    ];

    // 管理者追加権限
    const adminPermissions = [
      ...defaultPermissions,
      'users:manage',
      'organization:manage',
      'system:configure'
    ];

    // カスタムクレーム設定
    const customClaims = {
      admin: isAdmin,
      organizationId,
      permissions: isAdmin ? adminPermissions : defaultPermissions,
      lastUpdated: Date.now()
    };

    await admin.auth().setCustomUserClaims(uid, customClaims);

    // Firestoreにユーザー情報を保存/更新
    await saveUserProfile(uid, {
      email,
      displayName,
      isAdmin,
      organizationId,
      lastLoginAt: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.Timestamp.now()
    });

    res.json({
      success: true,
      claims: customClaims
    });

  } catch (error) {
    console.error('Error setting custom claims:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to set custom claims'
    });
  }
});

// 管理者ドメインチェック
async function checkAdminDomain(domain: string): Promise<boolean> {
  // 管理者ドメインのリスト（実際の実装では環境変数や設定から取得）
  const adminDomains = process.env.ADMIN_DOMAINS?.split(',') || [];
  return adminDomains.includes(domain);
}

// 組織ID取得
async function getOrganizationId(domain: string): Promise<string> {
  try {
    // Firestoreから組織情報を取得
    const orgSnapshot = await admin.firestore()
      .collection('organizations')
      .where('domain', '==', domain)
      .limit(1)
      .get();

    if (!orgSnapshot.empty) {
      return orgSnapshot.docs[0].id;
    }

    // 組織が存在しない場合は新規作成
    const newOrgRef = await admin.firestore()
      .collection('organizations')
      .add({
        name: domain,
        domain: domain,
        createdAt: admin.firestore.Timestamp.now(),
        isActive: true
      });

    return newOrgRef.id;
  } catch (error) {
    console.error('Error getting organization ID:', error);
    return 'default';
  }
}

// ユーザープロファイル保存
async function saveUserProfile(uid: string, userData: any) {
  try {
    const userRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // 既存ユーザーの場合は更新
      await userRef.update({
        ...userData,
        updatedAt: admin.firestore.Timestamp.now()
      });
    } else {
      // 新規ユーザーの場合は作成
      await userRef.set(userData);
    }
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
}

// Google APIトークンリフレッシュ
router.post('/refresh-google-token', async (req: express.Request, res: express.Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh token is required'
      });
    }

    // Google OAuth2 トークンリフレッシュ
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    res.json({
      access_token: credentials.access_token,
      expires_in: credentials.expiry_date
    });

  } catch (error) {
    console.error('Error refreshing Google token:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to refresh token'
    });
  }
});

// Google Workspace情報取得
router.get('/google-workspace-info', async (req: express.Request, res: express.Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const accessToken = req.headers['x-google-access-token'] as string;
    if (!accessToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Google access token is required'
      });
    }

    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    // ユーザー情報取得
    const people = google.people({ version: 'v1', auth: oauth2Client });
    const profile = await people.people.get({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,organizations,photos'
    });

    // Google Drive 情報取得
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const driveInfo = await drive.about.get({
      fields: 'user,storageQuota'
    });

    res.json({
      profile: profile.data,
      drive: driveInfo.data,
      integration: {
        hasGoogleDrive: true,
        hasGoogleCalendar: true,
        hasGmail: true
      }
    });

  } catch (error) {
    console.error('Error getting Google Workspace info:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get Google Workspace information'
    });
  }
});

// ユーザー権限確認
router.get('/permissions', async (req: express.Request, res: express.Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // 最新のカスタムクレームを取得
    const userRecord = await admin.auth().getUser(req.user.uid);
    const customClaims = userRecord.customClaims || {};

    res.json({
      uid: req.user.uid,
      email: req.user.email,
      admin: customClaims.admin || false,
      organizationId: customClaims.organizationId,
      permissions: customClaims.permissions || [],
      lastUpdated: customClaims.lastUpdated
    });

  } catch (error) {
    console.error('Error getting user permissions:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user permissions'
    });
  }
});

export default router;