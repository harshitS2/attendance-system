import Shift from '../models/Shift.js';
import User from '../models/User.js';

// @desc    Assign Shift
// @route   POST /api/shifts
// @access  Private/TeamLead/Admin
const assignShift = async (req, res) => {
    const { userId, shiftType, startTime, endTime, effectiveDate, endDate } = req.body;
    const assignedBy = req.user._id;

    try {
        // Check if user exists
        const userToAssign = await User.findById(userId);
        if (!userToAssign) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if TeamLead is assigning to their own team (optional logic)
        // For now, allow TeamLead to assign to anyone, or filter in frontend dropdown

        const shift = await Shift.create({
            userId,
            assignedBy,
            shiftType,
            startTime,
            endTime,
            effectiveDate,
            endDate
        });

        res.status(201).json(shift);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get My Shifts
// @route   GET /api/shifts/my
// @access  Private
const getMyShifts = async (req, res) => {
    const userId = req.user._id;
    try {
        const shifts = await Shift.find({ userId }).sort({ effectiveDate: -1 });
        res.json(shifts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Team Shifts
// @route   GET /api/shifts/team
// @access  Private/TeamLead/Admin
const getTeamShifts = async (req, res) => {
    // Ideally filter by teamId if hierarchy exists
    // For now return all shifts created by this TeamLead
    const assignedBy = req.user._id;
    try {
        const shifts = await Shift.find({ assignedBy }).populate('userId', 'name email').sort({ effectiveDate: -1 });
        res.json(shifts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
}

export { assignShift, getMyShifts, getTeamShifts };
