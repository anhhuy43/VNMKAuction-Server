const jwt = require("jsonwebtoken");

const authConstant = require("../constants/authConstant");

const authenticateJWT = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Lấy token từ headers (Bearer <token>)

  if (!token) {
    return res.status(401).json({ message: 'Token is required' });
  }

  jwt.verify(token, authConstant.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user; // Gắn thông tin người dùng vào req.user
    next(); // Tiếp tục tới route tiếp theo
  });
};

module.exports = authenticateJWT;
