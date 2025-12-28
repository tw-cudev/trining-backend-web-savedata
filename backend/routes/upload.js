const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const User = require("../models/User")
const File = require("../models/File")
const authMiddleware = require("../middleware/auth")

const router = express.Router()

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
})

// Upload file
router.post("/file", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Create file record
    const newFile = new File({
      userId: req.userId,
      fileName: req.body.fileName || req.file.originalname,
      fileSize: req.file.size,
      fileType: path.extname(req.file.originalname).substring(1).toUpperCase(),
      filePath: `/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
    })

    await newFile.save()

    // Update user's total storage
    user.totalStorageUsed += req.file.size
    user.files.push({
      fileId: newFile._id,
      fileName: newFile.fileName,
      fileSize: newFile.fileSize,
      fileType: newFile.fileType,
      filePath: newFile.filePath,
    })

    await user.save()

    res.status(201).json({
      message: "File uploaded successfully",
      file: newFile,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Upload failed" })
  }
})

// Get all files for user
router.get("/files", authMiddleware, async (req, res) => {
  try {
    const files = await File.find({
      userId: req.userId,
      isDeleted: false,
    }).sort({ uploadDate: -1 })

    res.json(files)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch files" })
  }
})

// Delete file
router.delete("/file/:fileId", authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId)

    if (!file || file.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" })
    }

    // Delete file from system
    const filePath = path.join(__dirname, "..", file.filePath)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // Mark as deleted in DB
    file.isDeleted = true
    await file.save()

    // Update user's storage
    const user = await User.findById(req.userId)
    user.totalStorageUsed -= file.fileSize
    user.files = user.files.filter((f) => !f.fileId.equals(file._id))
    await user.save()

    res.json({ message: "File deleted successfully" })
  } catch (err) {
    res.status(500).json({ error: "Delete failed" })
  }
})

module.exports = router
