const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; 

    if (!token) {
      return res.status(401).json({ message: 'Token not found' });
    }

    const decoded = jwt.verify(token, authConstant.JWT_SECRET_KEY); 

    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'admin') {  
      return res.status(403).json({ message: 'Access denied. Admins only!' });
    }

    req.user = user;  
    next();  
  } catch (error) {
    console.error('Error in adminAuth middleware:', error);
    res.status(403).json({ message: 'Unauthorized or invalid token.' });
  }
};

module.exports = adminAuth;
