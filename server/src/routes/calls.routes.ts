import { Router } from 'express';
import { callsController } from '../controllers/calls.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { initiateCallSchema, updateCallSchema } from '../validators/calls.validator.js';

const router = Router();

router.get('/history', authenticateToken, callsController.getCallHistory);
router.delete('/history/clear', authenticateToken, callsController.clearCallHistory);
router.post('/', authenticateToken, validateBody(initiateCallSchema), callsController.initiateCall);
router.put('/:id', authenticateToken, validateBody(updateCallSchema), callsController.updateCall);
router.delete('/:id', authenticateToken, callsController.deleteCall);

export default router;

