import { Router } from 'express';
import { createRequest } from '../controllers/requestController';

const router = Router();

router.post('/requests', createRequest);

export default router;
