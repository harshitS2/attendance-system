import express from 'express';
import { getUsers, updateUserRole, updateUserDetails, deleteUser, resetPassword } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('Admin', 'SuperAdmin', 'TeamLead'), getUsers);
router.put('/:id/role', protect, authorize('SuperAdmin'), updateUserRole);
router.put('/:id/password', protect, authorize('Admin', 'SuperAdmin', 'TeamLead'), resetPassword);
router.route('/:id')
    .put(protect, authorize('Admin', 'SuperAdmin'), updateUserDetails)
    .delete(protect, authorize('SuperAdmin'), deleteUser);

export default router;
