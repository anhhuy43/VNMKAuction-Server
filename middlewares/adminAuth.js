const jwt = require('jsonwebtoken');
const User = require('../app/models/User'); // Model User để kiểm tra role
const authConstant = require('../constants/authConstant');

const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Lấy token từ header

    if (!token) {
      return res.status(401).json({ message: 'Token not found' });
    }

    // Giải mã token
    const decoded = jwt.verify(token, authConstant.JWT_SECRET_KEY);

    // Kiểm tra role từ database
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only!' });
    }

    // Gắn thông tin user vào request để các middleware/route sau dùng
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in adminAuth middleware:', error);
    res.status(403).json({ message: 'Unauthorized or invalid token.' });
  }
};

module.exports = adminAuth;
