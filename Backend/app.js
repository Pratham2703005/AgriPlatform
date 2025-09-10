const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userRoutes = require("./routes/user.route.js");

const app = express();

// Middleware setup
dotenv.config();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes

app.use("/user", userRoutes);

module.exports = app;
