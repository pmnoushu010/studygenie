import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Session from "@/models/Session";
import User from "@/models/User";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = (body.username || "").trim();
    const password = (body.password || "").trim();

    await connectToDatabase();

    let role = "";
    let stream = "9th"; // default

    if (username === "pmnoushu010" && password === "Shanumon@12345$$") {
      role = "superadmin";
      stream = "all";
    } else if (username === "admin" && password === "admin") {
      role = "student";
      stream = "9th";
    } else {
      const user = await User.findOne({ username, password });
      if (user) {
        role = user.role || "student";
        stream = user.stream || "9th";
      } else {
        return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
      }
    }

    // Get IP address reliably
    const cfIp = req.headers.get("cf-connecting-ip");
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    
    let ipAddress = "127.0.0.1";
    if (cfIp) {
      ipAddress = cfIp.trim();
    } else if (req.ip) {
      ipAddress = req.ip;
    } else if (forwardedFor) {
      ipAddress = forwardedFor.split(",")[0].trim();
    } else if (realIp) {
      ipAddress = realIp.trim();
    }
    
    const userAgent = req.headers.get("user-agent") || "Unknown";

    const sessionId = crypto.randomUUID();

    const newSession = new Session({
      sessionId,
      username,
      role,
      ipAddress,
      userAgent,
      lastActive: new Date(),
    });

    await newSession.save();

    return NextResponse.json({
      success: true,
      sessionId,
      username,
      role,
      stream,
    });
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: error.message || error.toString() || "Internal Server Error" }, { status: 500 });
  }
}
