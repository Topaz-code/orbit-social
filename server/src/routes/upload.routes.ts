import { Router } from 'express';
import { uploadController } from '../controllers/upload.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { handleSingleUpload, handleMultipleUpload } from '../middleware/upload.middleware.js';

const router = Router();

router.post('/', authenticateToken, handleSingleUpload('file'), uploadController.uploadSingle);
router.post('/multiple', authenticateToken, handleMultipleUpload('files', 10), uploadController.uploadMultiple);

export default router;
