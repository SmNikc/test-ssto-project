import { Router } from 'express';
import { SignalController } from '../controllers/signalController';

const router = Router();
const signalController = new SignalController();

router.post('/', (req, res) => signalController.createSignal(req, res));
router.get('/mmsi/:mmsi', (req, res) => signalController.getSignalByMMSI(req, res));
router.patch('/:signalId/status', (req, res) => signalController.updateSignalStatus(req, res));
router.get('/type/:signalType', (req, res) => signalController.getSignalsByType(req, res));

export default router;
