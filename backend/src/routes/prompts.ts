import { Router } from 'express';
import { getPrompts, deletePrompt, getPromptImage } from '../controllers/promptController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getPrompts);
router.delete('/:id', authenticate, deletePrompt);
router.get('/:id/image', authenticate, getPromptImage);

export default router;
