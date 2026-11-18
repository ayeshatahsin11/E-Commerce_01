const Banner = require("../models/Banner");
const asyncHandler = require("../utils/asyncHandler");
const { saveImages, deleteImage, isRealImage } = require("../utils/imageStorage");

const asString = (value) => (typeof value === "string" ? value : undefined);
const toBool = (value) => value === true || value === "true";

// Text fields arrive as strings (multipart form-data), so convert them here
const readFields = (body = {}) => {
  const data = {};

  for (const key of ["title", "subtitle", "buttonText", "link"]) {
    const value = asString(body[key]);
    if (value !== undefined) data[key] = value;
  }

  if (body.sortOrder !== undefined && body.sortOrder !== "") {
    const number = Number(body.sortOrder);
    if (Number.isFinite(number)) data.sortOrder = number;
  }
  if (body.isActive !== undefined) data.isActive = toBool(body.isActive);

  return data;
};

// GET /api/banners  (public: only active banners)
exports.getBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find({ isActive: true }).sort("sortOrder -createdAt");
  res.json({ success: true, count: banners.length, banners });
});

// GET /api/banners/all  (admin: includes hidden banners)
exports.getAllBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort("sortOrder -createdAt");
  res.json({ success: true, count: banners.length, banners });
});

// POST /api/banners  (admin)  form-data: image (file), title, subtitle, buttonText, link, sortOrder, isActive
exports.createBanner = asyncHandler(async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: "Banner image is required" });
  }
  if (!isRealImage(file.buffer)) {
    return res.status(400).json({ success: false, message: "The file is not a valid image" });
  }

  const [image] = await saveImages([file]);

  try {
    const banner = await Banner.create({ ...readFields(req.body), image });
    res.status(201).json({ success: true, banner });
  } catch (error) {
    await deleteImage(image); // don't leave an image that no banner uses
    throw error;
  }
});

// PUT /api/banners/:id  (admin)  same fields as create; image is optional (replaces the old one)
exports.updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    return res.status(404).json({ success: false, message: "Banner not found" });
  }
  if (req.file && !isRealImage(req.file.buffer)) {
    return res.status(400).json({ success: false, message: "The file is not a valid image" });
  }

  banner.set(readFields(req.body));

  let newImage = null;
  let oldImage = null;
  if (req.file) {
    [newImage] = await saveImages([req.file]);
    oldImage = { publicId: banner.image.publicId };
    banner.image = newImage;
  }

  try {
    await banner.save();
  } catch (error) {
    if (newImage) await deleteImage(newImage);
    throw error;
  }

  if (oldImage) await deleteImage(oldImage);
  res.json({ success: true, banner });
});

// DELETE /api/banners/:id  (admin)
exports.deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    return res.status(404).json({ success: false, message: "Banner not found" });
  }

  const image = { publicId: banner.image.publicId };
  await banner.deleteOne();
  await deleteImage(image);

  res.json({ success: true, message: "Banner deleted" });
});