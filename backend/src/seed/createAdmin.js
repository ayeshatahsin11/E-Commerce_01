require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = process.env.ADMIN_EMAIL.toLowerCase();

    if (await User.findOne({ email })) {
      console.log("Admin already exists:", email);
    } else {
      await User.create({
        name: process.env.ADMIN_NAME || "Admin",
        email,
        password: process.env.ADMIN_PASSWORD,
        role: "admin",
      });
      console.log("Admin created:", email);
    }
  } catch (error) {
    console.error(error.message);
  } finally {
    await mongoose.disconnect();
  }
})();