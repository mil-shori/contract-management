import admin from 'firebase-admin';
import { Contract, ContractFirestore, ContractSearchQuery, ContractListResponse, ContractHistory, ContractComment } from '../types/contract';

const db = admin.firestore();

export class ContractService {
  private static instance: ContractService;
  private contractsCollection = db.collection('contracts');
  
  public static getInstance(): ContractService {
    if (!ContractService.instance) {
      ContractService.instance = new ContractService();
    }
    return ContractService.instance;
  }

  // 契約作成
  async createContract(contractData: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Contract> {
    try {
      const now = admin.firestore.Timestamp.now();
      const newContract: ContractFirestore = {
        ...contractData,
        createdAt: now,
        updatedAt: now,
        version: 1,
        // Date型をTimestamp型に変換
        startDate: contractData.startDate ? admin.firestore.Timestamp.fromDate(contractData.startDate) : undefined,
        endDate: contractData.endDate ? admin.firestore.Timestamp.fromDate(contractData.endDate) : undefined,
        renewalDate: contractData.renewalDate ? admin.firestore.Timestamp.fromDate(contractData.renewalDate) : undefined,
      };

      const docRef = await this.contractsCollection.add(newContract);
      
      // 履歴記録
      await this.addHistory(docRef.id, {
        contractId: docRef.id,
        action: 'created',
        userId: contractData.userId,
        timestamp: now.toDate(),
        details: { title: contractData.title }
      });

      const createdContract = await this.getContractById(docRef.id);
      if (!createdContract) {
        throw new Error('Failed to retrieve created contract');
      }

      return createdContract;
    } catch (error) {
      console.error('Error creating contract:', error);
      throw new Error('Failed to create contract');
    }
  }

  // 契約取得（ID指定）
  async getContractById(contractId: string): Promise<Contract | null> {
    try {
      const doc = await this.contractsCollection.doc(contractId).get();
      if (!doc.exists) {
        return null;
      }

      const data = doc.data() as ContractFirestore;
      return this.convertFirestoreToContract(doc.id, data);
    } catch (error) {
      console.error('Error getting contract:', error);
      throw new Error('Failed to get contract');
    }
  }

  // 契約一覧取得
  async getContracts(userId: string, query: ContractSearchQuery = {}): Promise<ContractListResponse> {
    try {
      let firestoreQuery = this.contractsCollection
        .where('userId', '==', userId) as admin.firestore.Query;

      // フィルタリング
      if (query.status && query.status.length > 0) {
        firestoreQuery = firestoreQuery.where('status', 'in', query.status);
      }

      if (query.partnerId) {
        firestoreQuery = firestoreQuery.where('partnerId', '==', query.partnerId);
      }

      if (query.organizationId) {
        firestoreQuery = firestoreQuery.where('organizationId', '==', query.organizationId);
      }

      if (query.tags && query.tags.length > 0) {
        firestoreQuery = firestoreQuery.where('tags', 'array-contains-any', query.tags);
      }

      if (query.category) {
        firestoreQuery = firestoreQuery.where('category', '==', query.category);
      }

      // ソート
      const sortBy = query.sortBy || 'updatedAt';
      const sortOrder = query.sortOrder || 'desc';
      firestoreQuery = firestoreQuery.orderBy(sortBy, sortOrder);

      // ページネーション
      const limit = query.limit || 20;
      firestoreQuery = firestoreQuery.limit(limit + 1); // +1で次ページの有無を確認

      if (query.offset) {
        firestoreQuery = firestoreQuery.offset(query.offset);
      }

      const snapshot = await firestoreQuery.get();
      const hasMore = snapshot.docs.length > limit;
      const contracts = snapshot.docs
        .slice(0, limit)
        .map(doc => this.convertFirestoreToContract(doc.id, doc.data() as ContractFirestore));

      // 総件数取得（簡易版）
      const totalSnapshot = await this.contractsCollection
        .where('userId', '==', userId)
        .get();

      return {
        contracts,
        totalCount: totalSnapshot.size,
        hasMore
      };
    } catch (error) {
      console.error('Error getting contracts:', error);
      throw new Error('Failed to get contracts');
    }
  }

  // 契約更新
  async updateContract(contractId: string, updates: Partial<Contract>, userId: string): Promise<Contract> {
    try {
      const now = admin.firestore.Timestamp.now();
      
      // 現在の契約データを取得
      const currentContract = await this.getContractById(contractId);
      if (!currentContract) {
        throw new Error('Contract not found');
      }

      // 更新データの準備
      const updateData: Partial<ContractFirestore> = {
        ...updates,
        updatedAt: now,
        updatedBy: userId,
        version: currentContract.version + 1,
        // Date型をTimestamp型に変換
        startDate: updates.startDate ? admin.firestore.Timestamp.fromDate(updates.startDate) : undefined,
        endDate: updates.endDate ? admin.firestore.Timestamp.fromDate(updates.endDate) : undefined,
        renewalDate: updates.renewalDate ? admin.firestore.Timestamp.fromDate(updates.renewalDate) : undefined,
      };

      // undefined値を除去
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof ContractFirestore] === undefined) {
          delete updateData[key as keyof ContractFirestore];
        }
      });

      await this.contractsCollection.doc(contractId).update(updateData);

      // 履歴記録
      await this.addHistory(contractId, {
        contractId,
        action: 'updated',
        userId,
        timestamp: now.toDate(),
        details: { updatedFields: Object.keys(updates) },
        previousValue: currentContract,
        newValue: updates
      });

      const updatedContract = await this.getContractById(contractId);
      if (!updatedContract) {
        throw new Error('Failed to retrieve updated contract');
      }

      return updatedContract;
    } catch (error) {
      console.error('Error updating contract:', error);
      throw new Error('Failed to update contract');
    }
  }

  // 契約削除
  async deleteContract(contractId: string, userId: string): Promise<void> {
    try {
      const contract = await this.getContractById(contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      // 履歴記録
      await this.addHistory(contractId, {
        contractId,
        action: 'deleted',
        userId,
        timestamp: new Date(),
        details: { title: contract.title }
      });

      // 関連データも削除
      await this.deleteContractSubcollections(contractId);
      await this.contractsCollection.doc(contractId).delete();
    } catch (error) {
      console.error('Error deleting contract:', error);
      throw new Error('Failed to delete contract');
    }
  }

  // 契約履歴追加
  async addHistory(contractId: string, historyData: Omit<ContractHistory, 'id'>): Promise<void> {
    try {
      await this.contractsCollection
        .doc(contractId)
        .collection('history')
        .add({
          ...historyData,
          timestamp: admin.firestore.Timestamp.fromDate(historyData.timestamp)
        });
    } catch (error) {
      console.error('Error adding history:', error);
    }
  }

  // 契約コメント追加
  async addComment(contractId: string, commentData: Omit<ContractComment, 'id' | 'createdAt'>): Promise<ContractComment> {
    try {
      const now = admin.firestore.Timestamp.now();
      const newComment = {
        ...commentData,
        createdAt: now
      };

      const docRef = await this.contractsCollection
        .doc(contractId)
        .collection('comments')
        .add(newComment);

      return {
        id: docRef.id,
        ...commentData,
        createdAt: now.toDate()
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  }

  // 契約検索（全文検索）
  async searchContracts(userId: string, searchQuery: string, options: ContractSearchQuery = {}): Promise<ContractListResponse> {
    try {
      // 基本的なフィルタリングクエリ
      let query = this.contractsCollection
        .where('userId', '==', userId) as admin.firestore.Query;

      // タイトルでの部分一致検索（簡易版）
      if (searchQuery) {
        const searchTerms = searchQuery.toLowerCase().split(' ');
        // Firestoreの制限により、完全な全文検索はElasticsearchやAlgoliaを使用することを推奨
        // ここでは簡易的にタイトルの開始文字での検索を実装
        query = query
          .where('title', '>=', searchQuery)
          .where('title', '<=', searchQuery + '\uf8ff');
      }

      const snapshot = await query
        .orderBy('updatedAt', 'desc')
        .limit(options.limit || 20)
        .get();

      const contracts = snapshot.docs.map(doc => 
        this.convertFirestoreToContract(doc.id, doc.data() as ContractFirestore)
      );

      return {
        contracts,
        totalCount: contracts.length,
        hasMore: contracts.length === (options.limit || 20)
      };
    } catch (error) {
      console.error('Error searching contracts:', error);
      throw new Error('Failed to search contracts');
    }
  }

  // Firestore形式からContract形式に変換
  private convertFirestoreToContract(id: string, data: ContractFirestore): Contract {
    return {
      ...data,
      id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate(),
      renewalDate: data.renewalDate?.toDate(),
      extractedData: data.extractedData ? {
        ...data.extractedData,
        effectiveDate: data.extractedData.effectiveDate?.toDate(),
        expirationDate: data.extractedData.expirationDate?.toDate(),
      } : undefined
    };
  }

  // 契約のサブコレクション削除
  private async deleteContractSubcollections(contractId: string): Promise<void> {
    const batch = db.batch();
    
    // 履歴削除
    const historySnapshot = await this.contractsCollection
      .doc(contractId)
      .collection('history')
      .get();
    
    historySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // コメント削除
    const commentsSnapshot = await this.contractsCollection
      .doc(contractId)
      .collection('comments')
      .get();
    
    commentsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }
}