const express = require('express');
const path = require('path');
const router = express.Router();
const multer = require('multer');
const authenticateToken = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

// // Serve static files from 'uploads' folder
// router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// // Set up multer for image upload
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/'); // Ensure this folder exists
//   },
//   filename: (req, file, cb) => {
//     cb(null, 'image-' + Date.now() + path.extname(file.originalname));
//   }
// });

// const upload = multer({ 
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Invalid file type. Only images are allowed.'), false);
//     }
//   }
// });

// Routes for authentication
router.post('/register', authController.register);
router.post('/login', authController.login);
// router.post('/saveImage', authenticateToken, upload.single('image'), authController.saveImage);

module.exports = router;