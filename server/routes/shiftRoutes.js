import express from 'express';
import { assignShift, getMyShifts, getTeamShifts, assignWeeklyShifts } from '../controllers/shiftController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('TeamLead', 'Admin', 'SuperAdmin'), assignShift);
router.post('/weekly', protect, authorize('TeamLead', 'Admin', 'SuperAdmin'), assignWeeklyShifts);
router.get('/my', protect, getMyShifts);
router.get('/team', protect, authorize('TeamLead', 'Admin', 'SuperAdmin'), getTeamShifts);

export default router;
