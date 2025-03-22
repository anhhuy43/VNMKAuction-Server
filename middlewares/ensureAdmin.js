const ensureAdmin = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập để truy cập' });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập vào trang này' });
  }

  next();
};

module.exports = ensureAdmin;
