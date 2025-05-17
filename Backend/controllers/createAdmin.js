const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed
const User = require('../models/user'); // Adjust path if needed

// Ensure MONGO_URI is provided
if (!process.env.MONGO_URI) {
    console.error("❌ Error: MONGO_URI is not defined in .env file");
    process.exit(1);
}

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    }
}

// Create an admin user
async function createAdmin() {
    try {
        await connectDB();

        const adminDetails = {
            name: 'New',
            lastname: 'Admin',
            email: 'admin2025@example.com', // Unique email
            password: 'Admin@1234', // Initial password
            role: 'admin',
            settings: {
                language: 'Français',
                emailNotifications: true,
                pushNotifications: true
            }
        };

        // Check if email already exists
        const existingUser = await User.findOne({ email: adminDetails.email });
        if (existingUser) {
            console.log(`⚠️ User with email ${adminDetails.email} already exists:`, existingUser.email);
            return;
        }

        // Hash the admin password
        const hashedPassword = await bcrypt.hash(adminDetails.password, 10);

        // Create the admin user
        const admin = new User({
            name: adminDetails.name,
            lastname: adminDetails.lastname,
            email: adminDetails.email,
            password: hashedPassword,
            role: adminDetails.role,
            settings: adminDetails.settings,
            createdAt: new Date()
        });

        // Save admin to the database
        await admin.save();
        console.log('✅ Admin user created successfully:', admin.email, 'ID:', admin._id);
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ MongoDB connection closed');
        process.exit(0);
    }
}

// Run the function
createAdmin();