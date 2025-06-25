const authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        // req.user.role is now the selected role for the session
        if (!req.user || (roles.length && !roles.includes(req.user.role))) {
            // user's role is not authorized or user is not logged in
            return res.status(403).json({ message: 'Forbidden: You do not have permission to access this resource.' });
        }

        // authentication and authorization successful
        next();
    };
};

module.exports = authorize; 