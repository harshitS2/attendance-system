import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shiftType: { type: String, required: true }, // e.g., 'Morning', 'Evening', 'Night'
    startTime: { type: String, required: true }, // HH:mm format
    endTime: { type: String, required: true },   // HH:mm format
    effectiveDate: { type: Date, required: true },
    endDate: { type: Date } // Optional, for temporary shifts
}, { timestamps: true });

export default mongoose.model('Shift', shiftSchema);
