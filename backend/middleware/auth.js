import jwt from 'jsonwebtoken';
import Student from '../models/student.js';
import Faculty from '../models/faculty.js';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

export const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ error: 'Forbidden: insufficient role' });
  }
  next();
};

export const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden: insufficient role' });
  }
  next();
};

export const allowSelfOrAdmin = (model, idField = 'id', paramKey = 'id') => async (req, res, next) => {
  if (req.user.role === 'admin') return next();
  try {
    const doc = await model.findById(req.params[paramKey]);
    if (!doc) return res.status(404).json({ error: 'Resource not found' });
    if (doc[idField] === req.user.id) return next();
    return res.status(403).json({ error: 'Forbidden: not your resource' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}; 