// Role-Based Access Control middleware
// Usage: authorize('ADMIN', 'TEACHER') — pass one or more allowed roles

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please login first.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized for this action.`,
        requiredRoles: roles,
      });
    }

    next();
  };
};

export { authorize };
