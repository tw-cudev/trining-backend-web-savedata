import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password required" }, { status: 400 })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    if (user.status === "disabled") {
      return NextResponse.json({ message: "Account is disabled" }, { status: 403 })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || "secret-key", {
      expiresIn: "7d",
    })

    return NextResponse.json({
      token,
      user: { id: user._id, email: user.email, role: user.role },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Login failed" }, { status: 500 })
  }
}
