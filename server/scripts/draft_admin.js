import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const adminEmail = 'admin@example.com';
        const adminPassword = 'admin123';

        // Check if admin exists
        const userExists = await User.findOne({ email: adminEmail });

        if (userExists) {
            console.log('Admin user already exists. Updating role...');
            userExists.role = 'Admin';
            await userExists.save();
            console.log('User role updated to Admin');
        } else {
            // Create user (hashing handled by pre-save hook? No, controller does hashing usually. 
            // Wait, looking at authController, it hashes manually.
            // I need to hash the password here if there's no pre-save hook.)

            // Let's check User model for pre-save hook.
            // Assuming no pre-save hook based on authController code.
            // I'll import bcryptjs.
        }

    } catch (error) {
        console.error('Error:', error);
    }
};

// ... I need to check User model first for pre-save hook or I can just use the registration endpoint.
// Actually, easier way:
// I will create a script that just finds a user by email and promotes them.
// The user asked for "Give me admin credentials".
// I will create a new user via the API or just insert one.

// Let's just create a script that promotes a user provided by arguments, or creates a default one.
