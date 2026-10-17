
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { cookieOptions } = require("../middleware/authMiddleware");

function issueToken(userId, res) {
  const token = jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.cookie("token", token, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });
}

function handleValidationErrors(req, res) {
  const { validationResult } = require("express-validator");
  const errors = validationResult(req);

  if (errors.isEmpty()) return false;

  res.status(400).json({
    success: false,
    message: "Please correct the submitted information.",
    errors: errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    })),
  });

  return true;
}

async function register(req, res, next) {
  try {
    if (handleValidationErrors(req, res)) return;

    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Public registration always creates a regular user.
    const user = await User.create({ name, email, password });

    issueToken(user._id, res);

    return res.status(201).json({
      success: true,
      message: "Your account has been created successfully.",
      user: user.toJSON(),
    });
  } catch (error) {
    // Handle concurrent registrations for the same email.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    next(error);
  }
}

async function login(req, res, next) {
  try {
    if (handleValidationErrors(req, res)) return;

    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    // Password must be explicitly selected because select:false is set.
    const user = await User.findOne({ email }).select("+password");

    // Use the same message for an unknown email and wrong password.
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    issueToken(user._id, res);

    return res.status(200).json({
      success: true,
      message: "You are now logged in.",
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    user: req.user.toJSON(),
  });
}

function logout(req, res) {
  res.clearCookie("token", cookieOptions);

  return res.status(200).json({
    success: true,
    message: "You have been logged out.",
  });
}

module.exports = { register, login, getMe, logout };
