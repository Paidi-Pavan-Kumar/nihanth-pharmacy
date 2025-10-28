import jwt from "jsonwebtoken";

// Optional Authentication Middleware
// If token is present, validate it and set userId
// If no token, let the request proceed without userId
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.token;

    if (token) {
      // Verify token if present
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.body.userId = decoded.id;
    }

    // Continue regardless of authentication status
    next();
  } catch (error) {
    // If token validation fails, just continue without userId
    console.log("Optional Auth Error:", error.message);
    next();
  }
};

export default optionalAuth;
