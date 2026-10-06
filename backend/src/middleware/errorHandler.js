const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || "Server error";

  // Duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || err.keyPattern || {})[0] || "value";
    status = 409;
    message = `${field} already exists`;
  }
  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  }
  if (err.name === "MulterError") {
    status = 400;
    if (err.code === "LIMIT_FILE_SIZE") message = "Each image must be 5MB or smaller";
    else if (err.code === "LIMIT_UNEXPECTED_FILE" || err.code === "LIMIT_FILE_COUNT")
      message = "You can upload up to 5 images, and the form-data field name must be 'images'";
  }
  if (err.name === "CastError") {
    status = 400;
    message = "Invalid ID";
  }

  if (process.env.NODE_ENV !== "production") console.error(err);

  res.status(status).json({ success: false, message });
};

module.exports = errorHandler;