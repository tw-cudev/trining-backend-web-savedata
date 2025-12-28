const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")

// Load environment variables
dotenv.config()

const app = express()

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("MongoDB connected")
  } catch (err) {
    console.error("MongoDB connection error:", err)
    process.exit(1)
  }
}

connectDB()

// Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/files", require("./routes/files"))
app.use("/api/admin", require("./routes/admin"))

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Server running" })
})

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message || "Internal server error" })
})

module.exports = app

// Local development server
if (require.main === module) {
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}
