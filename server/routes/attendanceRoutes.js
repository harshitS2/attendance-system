import express from 'express';
import { checkIn, checkOut, getStatus, getHistory, getHistoryRange, getLiveStatus, getAttendanceByUserId, approveSession } from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.post('/approve-session', protect, authorize('Admin', 'SuperAdmin', 'TeamLead'), approveSession);
router.get('/status', protect, getStatus);
router.get('/history', protect, getHistory);
router.get('/history-range', protect, getHistoryRange);
router.get('/history/:userId', protect, authorize('Admin', 'SuperAdmin', 'TeamLead'), getAttendanceByUserId);
router.get('/live-status', protect, getLiveStatus);

export default router;
