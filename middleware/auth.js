const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('email name passwordUpdatedAt');

    if (!admin) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (
      admin.passwordUpdatedAt &&
      decoded.iat &&
      admin.passwordUpdatedAt.getTime() > decoded.iat * 1000
    ) {
      return res.status(401).json({ error: 'Password was changed. Please login again.' });
    }

    req.admin = {
      id: admin._id,
      email: admin.email,
      name: admin.name,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
