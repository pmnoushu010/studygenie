import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Session from "@/models/Session";

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "No session ID provided" }, { status: 400 });
    }

    await connectToDatabase();

    const updatedSession = await Session.findOneAndUpdate(
      { sessionId },
      { lastActive: new Date() },
      { new: true }
    );

    if (!updatedSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Ping API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
