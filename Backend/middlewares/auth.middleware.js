const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");
const ResponseEntity = require("../utils/ResponseEntity.js");

const isLoggedIn = async (req, res, next) => {
  try {
    // Try to get token from cookie first, then from Authorization header
    let token = req.cookies.token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }
    
    if (!token) {
      const response = new ResponseEntity(0, "You are not Authorized", {});
      return res.status(401).json(response);
    }

    const { email } = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ email });
    if (!user) {
      const response = new ResponseEntity(0, "No user found", {});
      return res.status(404).json(response);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    
    if (error.name === 'JsonWebTokenError') {
      const response = new ResponseEntity(0, "Invalid token", {});
      return res.status(401).json(response);
    }
    
    if (error.name === 'TokenExpiredError') {
      const response = new ResponseEntity(0, "Token expired", {});
      return res.status(401).json(response);
    }
    
    const response = new ResponseEntity(0, "Authorization error", {});
    return res.status(500).json(response);
  }
};

module.exports = isLoggedIn;
