import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Message from "@/models/Message";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const user1 = searchParams.get("user1");
    const user2 = searchParams.get("user2");

    if (!user1 || !user2) {
      return NextResponse.json({ error: "user1 and user2 are required" }, { status: 400 });
    }

    await connectToDatabase();

    // Fetch messages where sender is user1 and receiver is user2 OR sender is user2 and receiver is user1
    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 }
      ]
    }).sort({ createdAt: 1 }); // Oldest to newest

    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error("Messages GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { senderId, senderRole, receiverId, text } = await req.json();

    if (!senderId || !receiverId || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();

    const newMessage = new Message({
      senderId,
      senderRole,
      receiverId,
      text,
      createdAt: new Date()
    });

    await newMessage.save();

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    console.error("Messages POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { receiverId, senderId } = await req.json();

    if (!receiverId || !senderId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();

    await Message.updateMany(
      { receiverId, senderId, read: false },
      { $set: { read: true } }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Messages PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
