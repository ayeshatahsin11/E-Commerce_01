const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Banner title is required"], trim: true, maxlength: 80 },
    subtitle: { type: String, trim: true, maxlength: 200 },
    buttonText: { type: String, trim: true, maxlength: 30, default: "Shop now" },
    link: {
      type: String,
      trim: true,
      default: "/shop",
      validate: {
        // only pages of our own site (starts with a single "/")
        validator: (value) => !value || /^\/(?!\/)/.test(value),
        message: "Link must be a page of this site and start with /",
      },
    },
    image: {
      url: { type: String, required: [true, "Banner image is required"] },
      publicId: { type: String, required: true },
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }, // smaller number shows first
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);