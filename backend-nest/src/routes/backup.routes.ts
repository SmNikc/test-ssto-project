import { Router } from 'express';
import { BackupController } from '../controllers/backupController';

const router = Router();
const backupController = new BackupController();

router.post('/', (req, res) => backupController.createBackup(req, res));
router.post('/restore', (req, res) => backupController.restoreBackup(req, res));
router.get('/list', (req, res) => backupController.listBackups(req, res));

export default router;
