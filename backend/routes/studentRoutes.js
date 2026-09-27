import express from 'express';
import {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkCreateStudents,
} from '../controllers/studentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', getStudents);
router.get('/:studentId', getStudent);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createStudent);
router.post('/bulk', authorize('SUPER_ADMIN', 'ADMIN'), bulkCreateStudents);
router.put('/:studentId', authorize('SUPER_ADMIN', 'ADMIN'), updateStudent);
router.delete('/:studentId', authorize('SUPER_ADMIN', 'ADMIN'), deleteStudent);

export default router;
