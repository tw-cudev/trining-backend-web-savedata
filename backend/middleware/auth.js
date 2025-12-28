const jwt = require("jsonwebtoken")
const User = require("../models/User")

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
      return res.status(401).json({ error: "No token provided" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    const user = await User.findById(decoded.userId)

    if (!user) {
      return res.status(401).json({ error: "User not found" })
    }

    if (user.status === "disabled") {
      return res.status(403).json({ error: "Account is disabled" })
    }

    req.userId = decoded.userId
    req.user = user
    next()
  } catch (err) {
    res.status(401).json({ error: "Invalid token" })
  }
}

const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" })
    }

    next()
  } catch (err) {
    res.status(500).json({ error: "Authorization error" })
  }
}

module.exports = { authMiddleware, adminMiddleware }
