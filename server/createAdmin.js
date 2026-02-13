import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const email = 'admin@example.com';
        const password = 'admin';
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.findOne({ email });

        if (user) {
            user.role = 'Admin';
            user.password = hashedPassword;
            await user.save();
            console.log('User updated to Admin with password "admin"');
        } else {
            await User.create({
                name: 'Admin User',
                email,
                password: hashedPassword,
                employeeId: 'ADMIN001',
                designation: 'Administrator',
                role: 'Admin'
            });
            console.log('Admin user created');
        }

        console.log('Use these credentials:');
        console.log('Email: admin@example.com');
        console.log('Password: admin');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

createAdmin();
