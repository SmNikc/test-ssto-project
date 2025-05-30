import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();
const userController = new UserController();

router.post('/', (req, res) => userController.createUser(req, res));
router.get('/email/:email', (req, res) => userController.getUserByEmail(req, res));
router.patch('/:userId/role', (req, res) => userController.updateUserRole(req, res));
router.delete('/:userId', (req, res) => userController.deleteUser(req, res));

export default router;
