const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authenticateJWT');
const ensureAdmin = require('../middlewares/ensureAdmin'); 
const adminController = require('../app/controllers/AdminController');

// Routes dành cho admin
router.get('/get-list-posts', auth, ensureAdmin, adminController.getListPosts);
router.post('/login', adminController.login);
// router.post('/approve-post', auth, ensureAdmin, adminController.approvePost);
// router.post('/reject-post', auth, ensureAdmin, adminController.rejectPost);

module.exports = router;
