const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const ActivityLog = require("../models/ActivityLog")
const { authMiddleware } = require("../middleware/auth")

const router = express.Router()

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const validatePassword = (password) => {
  return password.length >= 8
}

// Register with Email & Password
router.post("/register", async (req, res) => {
  try {
    const { email, phone, password, fullName } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" })
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters" })
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() })
    if (existingEmail) {
      return res.status(400).json({ error: "Email already registered" })
    }

    // Check if phone already exists (if provided)
    if (phone) {
      const existingPhone = await User.findOne({ phone })
      if (existingPhone) {
        return res.status(400).json({ error: "Phone number already registered" })
      }
    }

    const userCount = await User.countDocuments()
    const isFirstUser = userCount === 0

    // Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      phone: phone || null,
      password,
      fullName: fullName || "User",
      role: isFirstUser ? "admin" : "user",
      status: "active",
    })

    await newUser.save()

    // Generate JWT token
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" })

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        phone: newUser.phone,
        fullName: newUser.fullName,
        role: newUser.role,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Registration failed" })
  }
})

// Login with Email or Phone
router.post("/login", async (req, res) => {
  try {
    const { email, phone, password } = req.body

    if ((!email && !phone) || !password) {
      return res.status(400).json({ error: "Email/Phone and password required" })
    }

    // Find user by email or phone
    const user = await User.findOne({
      $or: [{ email: email?.toLowerCase() }, { phone }],
    }).select("+password")

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    if (user.status === "disabled") {
      return res.status(403).json({ error: "Account has been disabled" })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" })

    await ActivityLog.create({
      userId: user._id,
      action: "login",
      metadata: { email: user.email },
    })

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Login failed" })
  }
})

// Get current user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password")
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" })
  }
})

module.exports = router
