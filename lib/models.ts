import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  status: { type: String, enum: ["active", "disabled"], default: "active" },
  storageLimit: { type: Number, default: 5368709120 }, // 5GB
  storageUsed: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
})

const fileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String },
  cloudinaryUrl: { type: String },
  cloudinaryPublicId: { type: String },
  uploadedAt: { type: Date, default: Date.now },
})

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String,
  details: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
})

export const User = mongoose.models.User || mongoose.model("User", userSchema)
export const File = mongoose.models.File || mongoose.model("File", fileSchema)
export const ActivityLog = mongoose.models.ActivityLog || mongoose.model("ActivityLog", activityLogSchema)
