const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Files are saved in backend/uploads/products and served at /uploads/products/<file>
const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "products");
const PUBLIC_PATH = "/uploads/products";

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// extension comes from the mimetype, never from the user's file name
const ALLOWED_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    cb(null, unique + ALLOWED_TYPES[file.mimetype]);
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_TYPES[file.mimetype]) {
    const error = new Error("Only JPG, PNG or WEBP images are allowed");
    error.statusCode = 400;
    return cb(error);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5 MB each, 5 files per request
});

// form-data field name must be "images"
const uploadProductImages = upload.array("images", 5);

module.exports = { uploadProductImages, UPLOAD_DIR, PUBLIC_PATH };