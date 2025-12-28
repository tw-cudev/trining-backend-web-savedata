const express = require("express")
const User = require("../models/User")
const File = require("../models/File")
const ActivityLog = require("../models/ActivityLog")
const { authMiddleware, adminMiddleware } = require("../middleware/auth")

const router = express.Router()

// Apply auth and admin middleware to all routes
router.use(authMiddleware)
router.use(adminMiddleware)

// Get all users with pagination and search
router.get("/users", async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    let query = {}

    if (search) {
      query = {
        $or: [
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { fullName: { $regex: search, $options: "i" } },
        ],
      }
    }

    const users = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(Number.parseInt(limit))
      .sort({ createdAt: -1 })

    const total = await User.countDocuments(query)

    res.json({
      users,
      pagination: {
        total,
        page: Number.parseInt(page),
        pages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" })
  }
})

// Get user details
router.get("/users/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password")
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Get user's files and activity
    const files = await File.find({ userId: user._id, isDeleted: false })
    const activities = await ActivityLog.find({ userId: user._id }).limit(20).sort({ timestamp: -1 })

    res.json({
      user,
      files,
      activities,
    })
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user details" })
  }
})

// Change user role
router.patch("/users/:userId/role", async (req, res) => {
  try {
    const { role } = req.body

    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" })
    }

    const user = await User.findByIdAndUpdate(req.params.userId, { role }, { new: true }).select("-password")

    await ActivityLog.create({
      userId: req.userId,
      action: "role_change",
      metadata: { targetUser: user._id, newRole: role },
    })

    res.json({ message: "User role updated", user })
  } catch (err) {
    res.status(500).json({ error: "Failed to update user role" })
  }
})

// Disable user account
router.patch("/users/:userId/disable", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { status: "disabled" }, { new: true }).select(
      "-password",
    )

    await ActivityLog.create({
      userId: req.userId,
      action: "account_disable",
      metadata: { targetUser: user._id },
    })

    res.json({ message: "User account disabled", user })
  } catch (err) {
    res.status(500).json({ error: "Failed to disable user" })
  }
})

// Enable user account
router.patch("/users/:userId/enable", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { status: "active" }, { new: true }).select(
      "-password",
    )

    res.json({ message: "User account enabled", user })
  } catch (err) {
    res.status(500).json({ error: "Failed to enable user" })
  }
})

// Delete user account
router.delete("/users/:userId", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId)

    // Delete all user's files
    await File.updateMany({ userId: user._id }, { isDeleted: true })

    res.json({ message: "User deleted successfully" })
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" })
  }
})

// Get all files from all users
router.get("/files", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (page - 1) * limit

    const files = await File.find({ isDeleted: false })
      .populate("userId", "email fullName")
      .skip(skip)
      .limit(Number.parseInt(limit))
      .sort({ uploadDate: -1 })

    const total = await File.countDocuments({ isDeleted: false })

    res.json({
      files,
      pagination: {
        total,
        page: Number.parseInt(page),
        pages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch files" })
  }
})

// Delete any file (admin only)
router.delete("/files/:fileId", async (req, res) => {
  try {
    const file = await File.findByIdAndUpdate(req.params.fileId, { isDeleted: true }, { new: true })

    await ActivityLog.create({
      userId: req.userId,
      action: "delete",
      fileId: file._id,
      metadata: { reason: "Admin deletion" },
    })

    res.json({ message: "File deleted successfully" })
  } catch (err) {
    res.status(500).json({ error: "Failed to delete file" })
  }
})

// Get dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const totalFiles = await File.countDocuments({ isDeleted: false })
    const totalStorage = await File.aggregate([{ $group: { _id: null, totalSize: { $sum: "$fileSize" } } }])

    const recentActivity = await ActivityLog.find()
      .limit(20)
      .sort({ timestamp: -1 })
      .populate("userId", "email fullName")

    // Get storage per user
    const storagePerUser = await File.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$userId", totalSize: { $sum: "$fileSize" }, count: { $sum: 1 } } },
      { $sort: { totalSize: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
    ])

    res.json({
      totalUsers,
      totalFiles,
      totalStorage: totalStorage[0]?.totalSize || 0,
      storagePerUser,
      recentActivity,
    })
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch statistics" })
  }
})

module.exports = router
