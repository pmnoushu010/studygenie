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
