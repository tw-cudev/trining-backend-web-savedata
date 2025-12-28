const mongoose = require("mongoose")

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: ["login", "logout", "upload", "download", "delete", "role_change", "account_disable"],
      required: true,
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      default: null,
    },
    metadata: {
      type: Object,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("ActivityLog", activityLogSchema)
