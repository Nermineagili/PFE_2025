const express = require('express');
const router = express.Router(); // Initialize the router
const multer = require('multer');
const { uploadProfilePic, getUserById , updateUser, changePassword} = require('../controllers/userController'); // Import controllers
const { authenticateToken, validateObjectId } = require('../middleware/authMiddleware'); // Import middleware

// Set storage options for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Define where to save the files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Set the file name (added hyphen for readability)
    }
});

// Initialize multer with the storage options
const upload = multer({ storage: storage });

// Define the route to upload the profile picture
router.post('/upload-profile-pic', authenticateToken, (req, res, next) => {
    console.log(req.body);  // Log the fields sent in the request body
    next();
}, upload.single('image'), uploadProfilePic);

// Define the route to get user by ID
router.get('/:id', authenticateToken, validateObjectId, getUserById); // Protect this route with authentication and validate ObjectId

// ✅ Update User Profile (Authenticated)
router.put('/:id', authenticateToken, validateObjectId, updateUser);

router.put('/change-password/:userId', authenticateToken, changePassword);


module.exports = router; // Export the router



































// const express = require('express');
// const router = express.Router(); // Initialize the router

// const { uploadProfilePic } = require('../controllers/userController');
// const authenticateToken = require('../middleware/authenticateToken');
// const multer = require('multer');
// const { getUserById } = require('../controllers/userController'); // Adjust path accordingly

// // Set storage options for multer
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/'); // Define where to save the files
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + file.originalname); // Set the file name
//     }
// });

// // Initialize multer with the storage options
// const upload = multer({ storage: storage });

// // Define the route to upload the profile picture
// router.post('/upload-profile-pic', upload.single('image'), authenticateToken, uploadProfilePic);

// // Define the route to get user by ID
// router.get('/:id', getUserById); // This will use the controller to fetch the user by ID

// module.exports = router; // Export the router
