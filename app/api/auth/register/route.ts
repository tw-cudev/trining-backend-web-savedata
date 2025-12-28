import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { email, password, confirmPassword } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password required" }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ message: "Passwords do not match" }, { status: 400 })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ message: "Email already in use" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const isFirstUser = (await User.countDocuments({})) === 0

    const user = await User.create({
      email,
      password: hashedPassword,
      role: isFirstUser ? "admin" : "user",
      status: "active",
    })

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || "secret-key", {
      expiresIn: "7d",
    })

    return NextResponse.json({
      token,
      user: { id: user._id, email: user.email, role: user.role },
    })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ message: "Registration failed" }, { status: 500 })
  }
}
