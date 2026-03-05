import { Router } from 'express';
import {
  listConnections,
  getConnection,
  createConnection,
  updateConnection,
  deleteConnection,
  testConnection,
} from '../controllers/connections.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', listConnections);
router.get('/:id', getConnection);
router.post('/', createConnection);
router.put('/:id', updateConnection);
router.delete('/:id', deleteConnection);
router.post('/:id/test', testConnection);

export default router;
