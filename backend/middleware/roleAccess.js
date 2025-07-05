const User = require('../models/User'); 
// const Faculty = require('../models/Faculty');

// Middleware to check if user is authenticated and has the required role
// The middleware checks the header of the request for a user email,
// retrieves the user from the database, and checks if the user has the required role.  
// The variable x-user-email is used in header to pass the email of the current user
// So, during testing do the same.

const isAuthenticated = (req, res, next) => {
  console.log(req.user)
  if (!req.user) {
    return res.status(401).json({ message: 'Not logged in' });
  }
  next();
};

const restrictTo = (...allowedRoles) => {
  return async (req, res, next) => {
    const email = req.headers['x-user-email'];

    if (!email) {
      return res.status(400).json({ message: 'Email required for auth' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    req.user = user;
    next();
  };
};



module.exports = { isAuthenticated, restrictTo };
