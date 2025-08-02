import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ContractService } from '../services/contractService';
import { Contract, ContractSearchQuery } from '../types/contract';

const router = express.Router();
const contractService = ContractService.getInstance();

// バリデーションエラーハンドラ
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }
  next();
};

// 契約一覧取得
router.get('/', [
  query('status').optional().isArray(),
  query('partnerId').optional().isString(),
  query('organizationId').optional().isString(),
  query('tags').optional().isArray(),
  query('category').optional().isString(),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'title', 'endDate', 'amount']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user!.uid;
    const searchQuery: ContractSearchQuery = {
      status: req.query.status as string[],
      partnerId: req.query.partnerId as string,
      organizationId: req.query.organizationId as string,
      tags: req.query.tags as string[],
      category: req.query.category as string,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const result = await contractService.getContracts(userId, searchQuery);
    res.json(result);
  } catch (error) {
    console.error('Error getting contracts:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get contracts'
    });
  }
});

// 契約詳細取得
router.get('/:contractId', [
  param('contractId').isString().notEmpty(),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { contractId } = req.params;
    const contract = await contractService.getContractById(contractId);
    
    if (!contract) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Contract not found'
      });
    }

    // アクセス権限チェック
    if (contract.userId !== req.user!.uid && !req.user!.admin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    res.json(contract);
  } catch (error) {
    console.error('Error getting contract:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get contract'
    });
  }
});

// 契約作成
router.post('/', [
  body('title').isString().isLength({ min: 1, max: 200 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('status').isIn(['draft', 'review', 'approved', 'signed', 'active', 'expired', 'terminated', 'cancelled']),
  body('partnerId').optional().isString(),
  body('partnerName').optional().isString(),
  body('partnerEmail').optional().isEmail(),
  body('amount').optional().isNumeric(),
  body('currency').optional().isString(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('tags').optional().isArray(),
  body('category').optional().isString(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('confidentialityLevel').optional().isIn(['public', 'internal', 'confidential', 'restricted']),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user!.uid;
    const contractData = {
      ...req.body,
      userId,
      createdBy: userId,
      updatedBy: userId,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      renewalDate: req.body.renewalDate ? new Date(req.body.renewalDate) : undefined,
    };

    const contract = await contractService.createContract(contractData);
    res.status(201).json(contract);
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create contract'
    });
  }
});

// 契約更新
router.put('/:contractId', [
  param('contractId').isString().notEmpty(),
  body('title').optional().isString().isLength({ min: 1, max: 200 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('status').optional().isIn(['draft', 'review', 'approved', 'signed', 'active', 'expired', 'terminated', 'cancelled']),
  body('partnerId').optional().isString(),
  body('partnerName').optional().isString(),
  body('partnerEmail').optional().isEmail(),
  body('amount').optional().isNumeric(),
  body('currency').optional().isString(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('tags').optional().isArray(),
  body('category').optional().isString(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('confidentialityLevel').optional().isIn(['public', 'internal', 'confidential', 'restricted']),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { contractId } = req.params;
    const userId = req.user!.uid;

    // 既存契約の確認とアクセス権限チェック
    const existingContract = await contractService.getContractById(contractId);
    if (!existingContract) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Contract not found'
      });
    }

    if (existingContract.userId !== userId && !req.user!.admin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    const updates = {
      ...req.body,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      renewalDate: req.body.renewalDate ? new Date(req.body.renewalDate) : undefined,
    };

    // undefinedの値を除去
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof typeof updates] === undefined) {
        delete updates[key as keyof typeof updates];
      }
    });

    const contract = await contractService.updateContract(contractId, updates, userId);
    res.json(contract);
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update contract'
    });
  }
});

// 契約削除
router.delete('/:contractId', [
  param('contractId').isString().notEmpty(),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { contractId } = req.params;
    const userId = req.user!.uid;

    // 既存契約の確認とアクセス権限チェック
    const existingContract = await contractService.getContractById(contractId);
    if (!existingContract) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Contract not found'
      });
    }

    if (existingContract.userId !== userId && !req.user!.admin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    await contractService.deleteContract(contractId, userId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting contract:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete contract'
    });
  }
});

// 契約検索
router.get('/search', [
  query('q').isString().notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user!.uid;
    const searchQuery = req.query.q as string;
    const options: ContractSearchQuery = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const result = await contractService.searchContracts(userId, searchQuery, options);
    res.json(result);
  } catch (error) {
    console.error('Error searching contracts:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to search contracts'
    });
  }
});

// 契約コメント追加
router.post('/:contractId/comments', [
  param('contractId').isString().notEmpty(),
  body('content').isString().isLength({ min: 1, max: 1000 }),
  body('parentCommentId').optional().isString(),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { contractId } = req.params;
    const userId = req.user!.uid;

    // 契約の存在確認とアクセス権限チェック
    const contract = await contractService.getContractById(contractId);
    if (!contract) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Contract not found'
      });
    }

    if (contract.userId !== userId && !req.user!.admin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    const commentData = {
      contractId,
      userId,
      userName: req.user!.name || req.user!.email,
      userEmail: req.user!.email,
      content: req.body.content,
      parentCommentId: req.body.parentCommentId,
    };

    const comment = await contractService.addComment(contractId, commentData);
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to add comment'
    });
  }
});

export default router;