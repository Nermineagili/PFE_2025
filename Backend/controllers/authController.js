const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const JWT_SECRET = process.env.JWT_SECRET || 'nermine';

// User Registration
const register = async (req, res) => {
    try {
      const { name, lastname, email, password, profilePic = '', role = 'user' } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = new User({
        name,
        lastname,
        email,
        password: hashedPassword,
        profilePic,
        role
      });
      await newUser.save();
      res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  

// User Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }
    const payload = {
      _id: user._id,
      email: user.email,
      fullname: `${user.name} ${user.lastname}`,
      role: user.role,
      profilePic: user.profilePic,
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" }); // Ensure this is valid
    res.status(200).json({ user: payload, token });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Save User Image
// const saveImage = async (req, res) => {
//   try {
//     const userId = req.user._id;

//     if (!req.file) {
//       return res.status(400).json({ error: "No image provided" });
//     }

//     // Validate file type
//     if (!req.file.mimetype.startsWith('image/')) {
//       return res.status(400).json({ error: "Invalid file type. Only images are allowed." });
//     }

//     // Save the file path relative to the "uploads" directory
//     const imagePath = `/uploads/${req.file.filename}`;

//     // Update user's profile picture in the database
//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { profilePic: imagePath },
//       { new: true }
//     );

//     if (!updatedUser) {
//       return res.status(400).json({ error: 'User not found' });
//     }

//     // Return the relative path for the frontend to use
//     res.json({ imagePath }); // Send updated image URL
//   } catch (error) {
//     console.error('Error saving image:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };


module.exports = { register, login};
