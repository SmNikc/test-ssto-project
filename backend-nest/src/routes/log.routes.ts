import { Router } from 'express';
import { LogController } from '../controllers/logController';

const router = Router();
const logController = new LogController();

router.post('/', (req, res) => logController.createLog(req, res));
router.get('/', (req, res) => logController.getLogsByPeriod(req, res));
router.delete('/old', (req, res) => logController.deleteOldLogs(req, res));

export default router;
