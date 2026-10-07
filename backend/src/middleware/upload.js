const multer = require("multer");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    const error = new Error("Only JPG, PNG or WEBP images are allowed");
    error.statusCode = 400;
    return cb(error);
  }
  cb(null, true);
};

// Files are kept in memory first, so nothing is saved until every check has passed
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5 MB each, 5 files per request
});

// form-data field name must be "images"
const uploadProductImages = upload.array("images", 5);

module.exports = { uploadProductImages };