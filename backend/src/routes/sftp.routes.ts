import { Router } from 'express';
import multer from 'multer';
import {
  createSession,
  listDirectory,
  downloadFile,
  uploadFile,
  deleteFile,
  makeDirectory,
  renameFile,
  statFile,
  readFileContent,
  writeFileContent,
  closeSession,
} from '../controllers/sftp.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB limit

router.use(authMiddleware);

router.post('/sessions', createSession);
router.get('/sessions/:sessionId/list', listDirectory);
router.get('/sessions/:sessionId/download', downloadFile);
router.post('/sessions/:sessionId/upload', upload.single('file'), uploadFile);
router.delete('/sessions/:sessionId/file', deleteFile);
router.post('/sessions/:sessionId/mkdir', makeDirectory);
router.post('/sessions/:sessionId/rename', renameFile);
router.get('/sessions/:sessionId/stat', statFile);
router.get('/sessions/:sessionId/file/content', readFileContent);
router.put('/sessions/:sessionId/file/content', writeFileContent);
router.delete('/sessions/:sessionId', closeSession);

export default router;
