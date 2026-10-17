
const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Both authentication and administrator authorization are required.
router.get("/status", protect, adminOnly, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Administrator access verified.",
    admin: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = router;
