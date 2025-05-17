const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/settingsController');
const { authenticateToken, checkAdminOrSupervisor, validateObjectId } = require('../middleware/authMiddleware');



// Settings routes
router.get('/:id', 
  authenticateToken, 
  validateObjectId, 
  checkAdminOrSupervisor, 
  SettingsController.getSettings
);
router.put('/:id', 
  authenticateToken, 
  validateObjectId, 
  checkAdminOrSupervisor, 
  SettingsController.updateSettings
);

module.exports = router;