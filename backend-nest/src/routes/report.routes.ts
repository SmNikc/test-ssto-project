import { Router } from 'express';
import { ReportController } from '../controllers/reportController';

const router = Router();
const reportController = new ReportController();

router.get('/daily', (req, res) => reportController.getDailyReport(req, res));

export default router;
