import { Router } from 'express';
import { importController } from '../controllers/importController.js';

const router = Router();

router.post('/import', importController);

export default router;
