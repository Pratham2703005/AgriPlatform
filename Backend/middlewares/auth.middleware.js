const app = require("../app.js");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");
const ResponseEntity = require("../utils/ResponseEntity.js");

const isLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      const response = new ResponseEntity(0, "You are not Authorized", {});
      return res.status(400).json(response);
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
    console.error(error);
    const response = new ResponseEntity(0, "Authorization error", {});
    return res.status(500).json(response);
  }
};

module.exports = isLoggedIn;
