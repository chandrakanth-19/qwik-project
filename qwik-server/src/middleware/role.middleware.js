const { forbidden } = require("../utils/apiResponse");

// Usage: authorize("admin") or authorize("merchant", "admin")
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return forbidden(res, "You do not have permission to perform this action");
  }
  next();
};

module.exports = { authorize };
