// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
// require('dotenv').config({ path: '../.env' }); // Adjust path if needed
// const User = require('../models/user'); // Adjust path if needed

// // Ensure MONGO_URI is provided
// if (!process.env.MONGO_URI) {
//     console.error("❌ Error: MONGO_URI is not defined in .env file");
//     process.exit(1); // Exit if no MongoDB URI
// }

// // Connect to MongoDB
// async function connectDB() {
//     try {
//         await mongoose.connect(process.env.MONGO_URI, { 
//             useNewUrlParser: true, 
//             useUnifiedTopology: true 
//         });
//         console.log("✅ Connected to MongoDB");
//     } catch (err) {
//         console.error("❌ MongoDB connection error:", err);
//         process.exit(1);
//     }
// }

// // Create an admin user
// async function createAdmin() {
//     try {
//         await connectDB(); // Ensure DB is connected before proceeding

//         // Check if an admin already exists
//         const existingAdmin = await User.findOne({ role: 'admin' });

//         if (existingAdmin) {
//             console.log('⚠️ Admin user already exists:', existingAdmin.email);
//             return;
//         }

//         // Hash the admin password
//         const hashedPassword = await bcrypt.hash('Admin1234', 10);

//         // Create the admin user
//         const admin = new User({
//             name: 'Admin',
//             lastname: 'User',
//             email: 'nermineagili@example.com', // Change if needed
//             password: hashedPassword,
//             role: 'admin'
//         });

//         // Save admin to the database
//         await admin.save();
//         console.log('✅ Admin user created successfully:', admin.email);
//     } catch (error) {
//         console.error('❌ Error creating admin user:', error);
//     } finally {
//         mongoose.disconnect();
//         process.exit(0); // Ensure script exits after completion
//     }
// }

// // Run the function
// createAdmin();
