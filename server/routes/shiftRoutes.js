import express from 'express';
import { assignShift, getMyShifts, getTeamShifts } from '../controllers/shiftController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('TeamLead', 'Admin', 'SuperAdmin'), assignShift);
router.get('/my', protect, getMyShifts);
router.get('/team', protect, authorize('TeamLead', 'Admin', 'SuperAdmin'), getTeamShifts);

export default router;
