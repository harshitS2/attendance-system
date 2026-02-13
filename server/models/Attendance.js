import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true }, // Normalized to midnight
    sessions: [{
        checkIn: {
            time: { type: Date },
            location: {
                lat: { type: Number },
                lng: { type: Number },
                address: { type: String }
            },
            reason: { type: String }, // Reason if manually added/noted
            status: {
                type: String,
                enum: ['Approved', 'Pending', 'Rejected'],
                default: 'Approved'
            }
        },
        checkOut: {
            time: { type: Date },
            location: {
                lat: { type: Number },
                lng: { type: Number },
                address: { type: String }
            },
            reason: { type: String }
        }
    }],
    totalHours: { type: Number, default: 0 }, // In minutes or hours? Let's verify. Milliseconds? Just Number.
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Leave', 'HalfDay', 'OnBreak'],
        default: 'Absent'
    }
}, { timestamps: true });

// Compound index to ensure one record per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
