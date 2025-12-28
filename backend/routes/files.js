const express = require("express")
const multer = require("multer")
const File = require("../models/File")
const ActivityLog = require("../models/ActivityLog")
const { authMiddleware } = require("../middleware/auth")
const { uploadToCloudinary } = require("../utils/cloudStorage")

const router = express.Router()

// Configure multer for file uploads (temporary storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedMimes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/gif",
      "video/mp4",
      "application/zip",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Invalid file type"))
    }
  },
})

// Upload file
router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" })
    }

    const cloudStorageResult = await uploadToCloudinary(req.file, req.userId)

    // Create file record in database
    const newFile = new File({
      userId: req.userId,
      fileName: req.file.originalname.split(".")[0],
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.originalname.split(".").pop(),
      mimeType: req.file.mimetype,
      storageUrl: cloudStorageResult.secure_url,
    })

    await newFile.save()

    await ActivityLog.create({
      userId: req.userId,
      action: "upload",
      fileId: newFile._id,
      metadata: { fileName: newFile.originalName, size: newFile.fileSize },
    })

    res.status(201).json({
      message: "File uploaded successfully",
      file: newFile,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message || "File upload failed" })
  }
})

// Get user's files
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { search, sort = "uploadDate", order = "desc" } = req.query

    const query = { userId: req.userId, isDeleted: false }

    if (search) {
      query.originalName = { $regex: search, $options: "i" }
    }

    const files = await File.find(query).sort({ [sort]: order === "desc" ? -1 : 1 })

    res.json(files)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch files" })
  }
})

// Get single file
router.get("/:fileId", authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId)

    if (!file) {
      return res.status(404).json({ error: "File not found" })
    }

    if (file.userId.toString() !== req.userId) {
      return res.status(403).json({ error: "Access denied" })
    }

    res.json(file)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch file" })
  }
})

// Delete file
router.delete("/:fileId", authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId)

    if (!file) {
      return res.status(404).json({ error: "File not found" })
    }

    if (file.userId.toString() !== req.userId) {
      return res.status(403).json({ error: "You can only delete your own files" })
    }

    // Mark as deleted
    await File.findByIdAndUpdate(req.params.fileId, { isDeleted: true })

    await ActivityLog.create({
      userId: req.userId,
      action: "delete",
      fileId: file._id,
      metadata: { fileName: file.originalName },
    })

    res.json({ message: "File deleted successfully" })
  } catch (err) {
    res.status(500).json({ error: "Failed to delete file" })
  }
})

module.exports = router
