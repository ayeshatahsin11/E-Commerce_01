const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { v2: cloudinary } = require("cloudinary");

// Local fallback: backend/uploads/products, served at /uploads/products/<file>
const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "products");
const PUBLIC_PATH = "/uploads/products";

const EXTENSIONS = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

// Cloudinary is used only when all three keys are set in .env
const useCloudinary = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

const configureCloudinary = () =>
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

// Check the real file content (the mimetype sent by the client can be faked)
const isRealImage = (buffer) => {
  if (!buffer || buffer.length < 12) return false;

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";

  return isJpeg || isPng || isWebp;
};

const saveToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "ecommerce/products", resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(file.buffer);
  });

const saveToDisk = async (file) => {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${EXTENSIONS[file.mimetype]}`;
  await fs.writeFile(path.join(UPLOAD_DIR, filename), file.buffer);
  return { url: `${PUBLIC_PATH}/${filename}`, publicId: `local/${filename}` };
};

// Delete one stored image. Never throws: a failed cleanup must not break the request.
const deleteImage = async (image) => {
  try {
    if (!image || !image.publicId) return;

    if (image.publicId.startsWith("local/")) {
      await fs.unlink(path.join(UPLOAD_DIR, path.basename(image.publicId))).catch(() => {});
    } else if (useCloudinary()) {
      configureCloudinary();
      await cloudinary.uploader.destroy(image.publicId);
    }
  } catch (error) {
    console.error("Could not delete image:", error.message);
  }
};

// Save many files. If any one fails, the ones already saved are removed again.
const saveImages = async (files) => {
  if (useCloudinary()) configureCloudinary();

  const results = await Promise.allSettled(
    files.map((file) => (useCloudinary() ? saveToCloudinary(file) : saveToDisk(file)))
  );

  const saved = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
  const failed = results.find((r) => r.status === "rejected");

  if (failed) {
    await Promise.all(saved.map(deleteImage));
    console.error("Image upload failed:", failed.reason && failed.reason.message);
    const error = new Error("Image upload failed, please try again");
    error.statusCode = 502;
    throw error;
  }

  return saved;
};

module.exports = { saveImages, deleteImage, isRealImage };