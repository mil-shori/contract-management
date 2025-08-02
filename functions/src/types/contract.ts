export interface Contract {
  id?: string;
  title: string;
  description?: string;
  status: ContractStatus;
  userId: string;
  organizationId?: string;
  partnerId?: string;
  partnerName?: string;
  partnerEmail?: string;
  
  // 契約金額・期間
  amount?: number;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
  renewalDate?: Date;
  
  // ファイル関連
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  originalText?: string;
  extractedData?: ContractExtractedData;
  
  // メタデータ
  tags?: string[];
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  confidentialityLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
  
  // 共同作業
  collaborators?: string[];
  assignedTo?: string;
  
  // Google Workspace連携
  googleDriveFileId?: string;
  googleDocsId?: string;
  googleCalendarEventId?: string;
  
  // システムフィールド
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  version: number;
}

export type ContractStatus = 
  | 'draft'        // 下書き
  | 'review'       // レビュー中
  | 'approved'     // 承認済み
  | 'signed'       // 署名済み
  | 'active'       // 有効
  | 'expired'      // 期限切れ
  | 'terminated'   // 終了
  | 'cancelled';   // 取り消し

export interface ContractExtractedData {
  // OCRで抽出された主要項目
  parties?: string[];
  effectiveDate?: Date;
  expirationDate?: Date;
  governingLaw?: string;
  keyTerms?: KeyTerm[];
  clauses?: ContractClause[];
  
  // AI分析結果
  summary?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  keyPoints?: string[];
  recommendations?: string[];
}

export interface KeyTerm {
  type: string;
  value: string;
  confidence?: number;
  location?: {
    page: number;
    position: { x: number; y: number; width: number; height: number; };
  };
}

export interface ContractClause {
  title: string;
  content: string;
  type: 'general' | 'payment' | 'termination' | 'liability' | 'intellectual_property' | 'confidentiality';
  importance?: 'low' | 'medium' | 'high';
}

export interface ContractHistory {
  id?: string;
  contractId: string;
  action: ContractAction;
  userId: string;
  userName?: string;
  timestamp: Date;
  details?: any;
  previousValue?: any;
  newValue?: any;
}

export type ContractAction = 
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'file_uploaded'
  | 'file_deleted'
  | 'collaborator_added'
  | 'collaborator_removed'
  | 'comment_added'
  | 'exported'
  | 'shared';

export interface ContractComment {
  id?: string;
  contractId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  isResolved?: boolean;
  parentCommentId?: string; // リプライの場合
}

export interface ContractSearchQuery {
  query?: string;
  status?: ContractStatus[];
  partnerId?: string;
  organizationId?: string;
  tags?: string[];
  category?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'endDate' | 'amount';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ContractListResponse {
  contracts: Contract[];
  totalCount: number;
  hasMore: boolean;
}

// Firebase Firestoreドキュメント用の変換型
export type ContractFirestore = Omit<Contract, 'createdAt' | 'updatedAt' | 'startDate' | 'endDate' | 'renewalDate' | 'extractedData'> & {
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  startDate?: FirebaseFirestore.Timestamp;
  endDate?: FirebaseFirestore.Timestamp;
  renewalDate?: FirebaseFirestore.Timestamp;
  extractedData?: ContractExtractedDataFirestore;
};

export type ContractExtractedDataFirestore = Omit<ContractExtractedData, 'effectiveDate' | 'expirationDate'> & {
  effectiveDate?: FirebaseFirestore.Timestamp;
  expirationDate?: FirebaseFirestore.Timestamp;
};