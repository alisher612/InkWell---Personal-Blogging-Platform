
const express = require("express");
const { body } = require("express-validator");

const {
  register,
  login,
  getMe,
  logout,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const emailValidation = body("email")
  .isString()
  .withMessage("Email must be text.")
  .bail()
  .trim()
  .isEmail()
  .withMessage("Enter a valid email.")
  .normalizeEmail();

const passwordValidation = body("password")
  .isString()
  .withMessage("Password must be text.")
  .bail()
  .isLength({ min: 8, max: 128 })
  .withMessage("Password must contain 8–128 characters.");

router.post(
  "/register",
  body("name")
    .isString()
    .withMessage("Name must be text.")
    .bail()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must contain 2–60 characters."),
  emailValidation,
  passwordValidation,
  register
);

router.post(
  "/login",
  emailValidation,
  body("password")
    .isString()
    .withMessage("Password must be text.")
    .bail()
    .isLength({ min: 1, max: 128 })
    .withMessage("Password is required."),
  login
);

router.get("/me", protect, getMe);

router.post("/logout", logout);

module.exports = router;
