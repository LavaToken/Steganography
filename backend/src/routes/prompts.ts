import { Router } from 'express';
import { getPrompts, deletePrompt } from '../controllers/promptController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getPrompts);
router.delete('/:id', authenticate, deletePrompt);

export default router;
