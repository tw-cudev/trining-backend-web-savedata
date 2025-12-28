import mongoose from "mongoose"

let isConnected = false

export async function connectDB() {
  if (isConnected) {
    console.log("[v0] Using cached DB connection")
    return
  }

  try {
    const mongoUri = process.env.MONGODB_URI

    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is not set. Please configure it in Vercel project settings.")
    }

    console.log("[v0] Connecting to MongoDB...")

    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: "majority",
    })

    isConnected = true
    console.log("[v0] MongoDB connected successfully")
  } catch (error) {
    console.error("[v0] Database connection failed:", error)
    isConnected = false
    throw error
  }
}
