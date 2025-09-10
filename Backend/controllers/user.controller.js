const User = require("../models/user.model.js");
const app = require("../app.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const generateJWT = require("../utils/jwtGenerator.js");
const ResponseEntity = require("../utils/ResponseEntity.js");

// register controller

const register = async (req, res) => {
  console.log("JWT_SECRET:", process.env.JWT_SECRET);

  const req_body = req.body;

  if (!req_body.fullName) {
    const response = new ResponseEntity(0, "Please Enter the Name", {});
    return res.status(400).json(response);
  }

  if (!req_body.email) {
    const response = new ResponseEntity(0, "Please Enter the E-mail", {});
    return res.status(400).json(response);
  }

  if (!req_body.password) {
    const response = new ResponseEntity(0, "Please Enter the Password", {});
    return res.status(400).json(response);
  }

  if (await User.findOne({ email: req_body.email })) {
    const response = new ResponseEntity(
      0,
      "User is Already Registered with this E-Mail",
      {}
    );
    return res.status(400).json(response);
  }

  const user_req = {
    fullName: req_body.fullName,
    email: req_body.email,
    phone: req_body.phone,
    address: req_body.address,
    hashedPassword: bcrypt.hashSync(req_body.password, 8),
  };

  try {
    const token = generateJWT({ email: user_req.email }); //jwt.sign({username: user_req.username}, process.env.JWT_SECRET, {expiresIn: "2d"})
    const user = await User.create(user_req);

    const created_user = await User.findOne({ email: user.email }).select(
      "-password"
    );

    const response = new ResponseEntity(
      1,
      "User Created Successfully",
      created_user
    );
    res.cookie("token", token).status(201).json(response);
  } catch (err) {
    console.log("Some Problem Occured While Creating the User");
    const response = new ResponseEntity(0, "Error While Creating the User", {});
    res.status(500).json(response);
  }
};

// Login Controller on the Basis of E-Mail and Password

const login = async (req, res) => {
  const req_body = req.body;

  if (!req_body.email) {
    const response = new ResponseEntity(0, "Enter the E-mail", {});
    return res.status(400).json(response);
  }

  if (!req_body.password) {
    const response = new ResponseEntity(0, "Enter the Password", {});
    return res.status(400).json(response);
  }

  const user = await User.findOne({ email: req_body.email });
  if (!user) {
    const response = new ResponseEntity(
      0,
      "This E-Mail does not Exist in the DataBase",
      {}
    );
    return res.status(400).json(response);
  }

  if (!bcrypt.compareSync(req_body.password, user.hashedPassword)) {
    const response = new ResponseEntity(0, "Invalid Password", {});
    return res.status(400).json(response);
  }

  try {
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "2d",
    });

    const response = new ResponseEntity(1, "Logged in Successfully", {});
    res.cookie("token", token).status(200).json(response);
  } catch (error) {
    const response = new ResponseEntity(0, "Some Error while Logging in", {});
    res.status(500).json(response);
  }
};

// logout controller

const logout = (req, res) => {
  try {
    const response = new ResponseEntity(1, "Logged out Successfully", {});
    res.clearCookie("token").status(200).json(response);
  } catch (error) {
    console.log(req.cookie);
    const response = new ResponseEntity(0, "Error while Logging Out", {});
    res.status(500).json(response);
  }
};

// test route to verify isLoggedIn middleware

const protected = (req, res) => {
  try {
    const response = new ResponseEntity(1, "You are in a Protected Route", {});
    res.status(200).json(response);
  } catch (error) {
    const response = new ResponseEntity(
      0,
      "Some Error while Accessing the Protected Route",
      {}
    );
  }
};

module.exports = { register, login, logout, protected };
