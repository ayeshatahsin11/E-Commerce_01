const fs = require("fs/promises");
const path = require("path");
const { UPLOAD_DIR, PUBLIC_PATH } = require("../middleware/upload");

// Delete files that multer just saved (used when a request fails after upload)
const removeUploadedFiles = (files = []) =>
  Promise.all(files.map((file) => fs.unlink(file.path).catch(() => {})));

// Delete a stored image by its public URL, e.g. "/uploads/products/abc.jpg"
const removeFileByUrl = async (url) => {
  if (typeof url !== "string" || !url.startsWith(PUBLIC_PATH + "/")) return;
  await fs.unlink(path.join(UPLOAD_DIR, path.basename(url))).catch(() => {});
};

// Check the real file content (the mimetype sent by the client can be faked)
const isRealImage = async (filePath) => {
  const handle = await fs.open(filePath, "r");
  try {
    const buf = Buffer.alloc(12);
    await handle.read(buf, 0, 12, 0);

    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    const isPng = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isWebp = buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP";

    return isJpeg || isPng || isWebp;
  } finally {
    await handle.close();
  }
};

module.exports = { removeUploadedFiles, removeFileByUrl, isRealImage };