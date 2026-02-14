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

// @desc    Assign Weekly Shifts
// @route   POST /api/shifts/weekly
// @access  Private/TeamLead/Admin
const assignWeeklyShifts = async (req, res) => {
    const { userId, weekStartDate, shifts } = req.body; // shifts: [{ date, shiftType, startTime, endTime, isOff }]
    const assignedBy = req.user._id;

    try {
        const userToAssign = await User.findById(userId);
        if (!userToAssign) {
            return res.status(404).json({ message: 'User not found' });
        }

        const shiftPromises = shifts.map(async (dayShift) => {
            if (dayShift.isOff) {
                // Should we delete existing shift? or mark as Off? 
                // For now, let's delete any existing shift for this date if marked as Off
                await Shift.findOneAndDelete({ userId, effectiveDate: dayShift.date });
                return null;
            }

            // Using findOneAndUpdate with upsert to create or replace
            return Shift.findOneAndUpdate(
                { userId, effectiveDate: dayShift.date },
                {
                    userId,
                    assignedBy,
                    shiftType: dayShift.shiftType,
                    startTime: dayShift.startTime,
                    endTime: dayShift.endTime,
                    effectiveDate: dayShift.date
                },
                { new: true, upsert: true }
            );
        });

        const results = await Promise.all(shiftPromises);
        res.status(201).json({ message: 'Weekly shifts updated', count: results.filter(r => r).length });

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

export { assignShift, getMyShifts, getTeamShifts, assignWeeklyShifts };
