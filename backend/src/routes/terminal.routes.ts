import { Router } from 'express';
import {
  createSession,
  streamOutput,
  sendInput,
  resizeTerminal,
  closeSession,
  listSessions,
} from '../controllers/terminal.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/sessions', listSessions);
router.post('/sessions', createSession);
router.get('/sessions/:sessionId/stream', streamOutput);
router.post('/sessions/:sessionId/input', sendInput);
router.post('/sessions/:sessionId/resize', resizeTerminal);
router.delete('/sessions/:sessionId', closeSession);

export default router;
