import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    employeeId: { type: String, required: true, unique: true },
    designation: { type: String, default: 'Employee' },
    role: {
        type: String,
        enum: ['SuperAdmin', 'Admin', 'TeamLead', 'Employee'],
        default: 'Employee'
    },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to TeamLead
    profilePicture: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
