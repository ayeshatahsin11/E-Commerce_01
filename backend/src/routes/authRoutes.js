const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { register, login, logout, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { success: false, message: "Too many attempts, please try again later" },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.get("/me", protect, getMe);

module.exports = router;