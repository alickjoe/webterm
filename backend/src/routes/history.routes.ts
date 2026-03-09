import { Router } from 'express';
import { getHistory, addCommand, clearHistory } from '../controllers/history.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getHistory);
router.post('/', addCommand);
router.delete('/', clearHistory);

export default router;
