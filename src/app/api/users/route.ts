import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate required fields
    const requiredFields = ["username", "password", "name", "email", "mobileNumber"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
      if (typeof body[field] === 'string') {
        body[field] = body[field].trim();
      }
    }

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ username: body.username });
    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }

    const newUser = new User({
      ...body,
      role: "student", // By default all created users are students
      stream: body.stream || "9th"
    });

    await newUser.save();

    return NextResponse.json({ success: true, message: "User created successfully" });
  } catch (error: any) {
    console.error("Create User API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const users = await User.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Get Users API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    
    await connectToDatabase();
    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Delete User API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, newPassword } = await req.json();
    if (!id || !newPassword) {
      return NextResponse.json({ error: "Missing ID or newPassword" }, { status: 400 });
    }
    
    await connectToDatabase();
    const updatedUser = await User.findByIdAndUpdate(id, { password: newPassword }, { new: true });
    
    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Update User API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
