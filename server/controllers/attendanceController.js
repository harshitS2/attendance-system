import Attendance from '../models/Attendance.js';

// @desc    Check In
// @route   POST /api/attendance/check-in
// @access  Private
const checkIn = async (req, res) => {
    const { location, reason, userId: adminUserId, manualTime } = req.body;
    let userId = req.user._id;

    // Admin acting on behalf of user
    const isAdmin = ['Admin', 'SuperAdmin'].includes(req.user.role);
    if (adminUserId && isAdmin) {
        userId = adminUserId;
    }

    const checkInTime = (manualTime && isAdmin) ? new Date(manualTime) : new Date();


    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    try {
        let attendance = await Attendance.findOne({
            userId,
            date: {
                $gte: todayStart,
                $lte: todayEnd
            }
        });

        if (!attendance) {
            attendance = new Attendance({
                userId,
                date: todayStart,
                sessions: [],
                status: 'Present'
            });
        }

        // Check if there is an open session
        const openSession = attendance.sessions.find(session => !session.checkOut || !session.checkOut.time);
        if (openSession) {
            return res.status(400).json({ message: 'Already checked in. Please check out first.' });
        }

        // Determine status: First check-in is Approved, subsequent are Pending unless Admin
        const status = (attendance.sessions.length > 0 && !isAdmin) ? 'Pending' : 'Approved';

        attendance.sessions.push({
            checkIn: {
                time: checkInTime,
                location: location,
                reason: reason,
                status: status
            }
        });
        attendance.status = 'Present';

        await attendance.save();
        res.status(201).json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const checkOut = async (req, res) => {
    const { location, reason, userId: adminUserId, manualTime } = req.body;
    let userId = req.user._id;

    const isAdmin = ['Admin', 'SuperAdmin'].includes(req.user.role);

    if (adminUserId && isAdmin) {
        userId = adminUserId;
    }

    const checkOutTime = (manualTime && isAdmin) ? new Date(manualTime) : new Date();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    try {
        const attendance = await Attendance.findOne({
            userId,
            date: {
                $gte: todayStart,
                $lte: todayEnd
            }
        });

        if (!attendance) {
            return res.status(400).json({ message: 'No attendance record found for today.' });
        }

        // Find open session
        const openSession = attendance.sessions.find(session => !session.checkOut || !session.checkOut.time);

        if (!openSession) {
            return res.status(400).json({ message: 'Not checked in or already checked out.' });
        }

        openSession.checkOut = {
            time: checkOutTime,
            location: location,
            reason: reason
        };

        // Calculate total hours
        let totalMs = 0;
        attendance.sessions.forEach(session => {
            if (session.checkIn?.time && session.checkOut?.time) {
                totalMs += (new Date(session.checkOut.time) - new Date(session.checkIn.time));
            }
        });
        attendance.totalHours = totalMs / (1000 * 60 * 60); // Hours

        await attendance.save();
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const getStatus = async (req, res) => {
    const userId = req.user._id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    try {
        const attendance = await Attendance.findOne({
            userId,
            date: {
                $gte: todayStart,
                $lte: todayEnd
            }
        });

        if (attendance) {
            // Map to older format for frontend compatibility if needed, or update frontend. 
            // Let's attach a 'currentSession' property for easy frontend logic
            const currentSession = attendance.sessions.find(s => !s.checkOut || !s.checkOut.time);
            const response = attendance.toObject();
            if (currentSession) {
                response.checkIn = currentSession.checkIn;
                response.checkOut = null;
            } else if (attendance.sessions.length > 0) {
                // Last session
                const lastSession = attendance.sessions[attendance.sessions.length - 1];
                response.checkIn = lastSession.checkIn;
                response.checkOut = lastSession.checkOut;
            }
            res.json(response);
        } else {
            res.json(null);
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
}

const getHistory = async (req, res) => {
    const userId = req.user._id;
    try {
        const history = await Attendance.find({ userId })
            .sort({ date: -1 })
            .limit(60);

        // Transform for frontend if needed? 
        // Frontend expects checkIn/checkOut. We should probably transform sessions to be usable.
        // For now, let's return raw and update frontend to handle sessions.
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching history' });
    }
};

const getHistoryRange = async (req, res) => {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;
    try {
        const query = { userId };
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        } else {
            // Default last 60 days
            const d = new Date();
            d.setDate(d.getDate() - 60);
            query.date = { $gte: d };
        }

        const history = await Attendance.find(query).sort({ date: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching history' });
    }
};

const getLiveStatus = async (req, res) => {
    // Open to all authenticated users as requested "Admins and other employees..."
    // if (!['Admin', 'SuperAdmin', 'TeamLead'].includes(req.user.role)) {
    //     return res.status(403).json({ message: 'Not authorized to view live status' });
    // }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    try {
        const attendance = await Attendance.find({
            date: {
                $gte: todayStart,
                $lte: todayEnd
            }
        }).populate('userId', 'name designation role');

        // We also want to include users who are NOT in the attendance table (Absent)
        // So fetch all users first
        const User = (await import('../models/User.js')).default;
        const allUsers = await User.find({}).select('name designation role profilePicture employeeId');

        const liveData = allUsers.map(user => {
            const userAttendance = attendance.find(a => a.userId._id.toString() === user._id.toString());
            let status = 'Absent';
            let lastCheckIn = null;
            let lastCheckOut = null;

            let sessionId = null;
            let totalHours = 0;
            if (userAttendance) {
                // Calculate total hours
                let totalMs = 0;
                userAttendance.sessions.forEach(session => {
                    if (session.checkIn?.time && session.checkOut?.time) {
                        totalMs += (new Date(session.checkOut.time) - new Date(session.checkIn.time));
                    }
                });

                // Add current open session time if present
                const currentOpen = userAttendance.sessions.find(s => !s.checkOut || !s.checkOut.time);
                if (currentOpen && currentOpen.checkIn?.time) {
                    totalMs += (new Date() - new Date(currentOpen.checkIn.time));
                }

                totalHours = totalMs / (1000 * 60 * 60);

                status = userAttendance.status;
                const currentSession = userAttendance.sessions.find(s => !s.checkOut || !s.checkOut.time);
                if (currentSession) {
                    status = 'Present'; // Currently In
                    lastCheckIn = currentSession.checkIn;
                    sessionId = currentSession._id;
                } else if (userAttendance.sessions.length > 0) {
                    // Checked out
                    const last = userAttendance.sessions[userAttendance.sessions.length - 1];
                    lastCheckIn = last.checkIn;
                    lastCheckOut = last.checkOut;
                    sessionId = last._id;
                }
            }

            return {
                userId: user,
                status,
                checkIn: lastCheckIn,
                checkOut: lastCheckOut,
                totalHours,
                attendanceId: userAttendance?._id,
                sessionId
            };
        });

        res.json(liveData);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching live status', error: error.message });
    }
};

const getAttendanceByUserId = async (req, res) => {
    const userId = req.params.userId;
    try {
        const history = await Attendance.find({ userId })
            .sort({ date: -1 })
            .sort({ date: -1 })
            .limit(60); // Last 60 days
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching user history' });
    }
};

const approveSession = async (req, res) => {
    const { attendanceId, sessionId } = req.body;
    try {
        const attendance = await Attendance.findById(attendanceId);
        if (!attendance) return res.status(404).json({ message: 'Attendance not found' });

        const session = attendance.sessions.id(sessionId);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        session.checkIn.status = 'Approved';
        await attendance.save();
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export { checkIn, checkOut, getStatus, getHistory, getHistoryRange, getLiveStatus, getAttendanceByUserId, approveSession };
