
const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Configure Cloudinary using credentials from backend/.env.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Keep uploaded files in memory instead of saving them locally.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error("Only JPG, PNG, WEBP, and GIF images are allowed.")
      );
    }

    callback(null, true);
  },
});

// Upload an image to Cloudinary.
router.post("/image", protect, adminOnly, (req, res) => {
  upload.single("image")(req, res, async (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Image must be 5 MB or smaller."
            : error.message || "Image upload failed.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image.",
      });
    }

    const {
      CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET,
    } = process.env;

    if (
      !CLOUDINARY_CLOUD_NAME ||
      !CLOUDINARY_API_KEY ||
      !CLOUDINARY_API_SECRET
    ) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary is not configured on the server.",
      });
    }

    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "inkwell/blog-covers",
            resource_type: "image",
          },
          (uploadError, uploadResult) => {
            if (uploadError) {
              return reject(uploadError);
            }

            resolve(uploadResult);
          }
        );

        stream.end(req.file.buffer);
      });

      return res.status(201).json({
        success: true,
        message: "Image uploaded successfully.",
        imageUrl: result.secure_url,
        publicId: result.public_id,
      });
    } catch (uploadError) {
      console.error(
        "Cloudinary upload failed:",
        uploadError.message
      );

      return res.status(502).json({
        success: false,
        message: "Could not upload the image. Please try again.",
      });
    }
  });
});

module.exports = router;
