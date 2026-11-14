const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 60 },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: { type: String, enum: ["user", "merchant", "admin"], default: "user" },

    // profile (used to pre-fill checkout)
    phone: { type: String, trim: true, match: [/^[0-9+\-\s()]{7,20}$/, "Please enter a valid phone number"] },
    address: { type: String, trim: true, maxlength: 250 },
    city: { type: String, trim: true, maxlength: 60 },

    // merchant only
    shopName: { type: String, trim: true },
    approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);