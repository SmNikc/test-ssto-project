import { Router } from 'express';
import { TestingController } from '../controllers/testingController';

const router = Router();
const testingController = new TestingController();

router.post('/scenarios', (req, res) => testingController.createScenario(req, res));
router.patch('/scenarios/:scenarioId', (req, res) => testingController.updateScenario(req, res));
router.get('/scenarios', (req, res) => testingController.getScenariosByPeriod(req, res));

export default router;
