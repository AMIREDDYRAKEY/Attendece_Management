import express from 'express';
import multer from 'multer';
import {
  markAttendance,
  uploadAttendance,
  getAttendance,
  getAttendanceSummary,
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Configure multer — store file in memory (buffer) for direct XLSX parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx and .xls files are allowed'), false);
    }
  },
});

// All routes require authentication
router.use(protect);

// Get attendance records & summary
router.get('/', getAttendance);
router.get('/summary', getAttendanceSummary);

// Mark single student attendance (Teacher/Admin) — auto triggers WhatsApp
router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'),
  markAttendance
);

// Upload Excel attendance sheet — auto triggers WhatsApp for all absent students
router.post(
  '/upload',
  authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'),
  upload.single('file'),
  uploadAttendance
);

export default router;
