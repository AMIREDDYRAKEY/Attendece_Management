import express from 'express';
import {
  getNotifications,
  getNotificationStats,
  retryNotification,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.get('/stats', getNotificationStats);
router.post('/:id/retry', authorize('SUPER_ADMIN', 'ADMIN'), retryNotification);

export default router;
