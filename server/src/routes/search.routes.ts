import { Router } from 'express';
import { searchController } from '../controllers/search.controller.js';
import { optionalAuthenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', optionalAuthenticate, searchController.search);
router.get('/trending', searchController.getTrending);

export default router;
