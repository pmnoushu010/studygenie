import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Message from "@/models/Message";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const user = searchParams.get("user");

    if (!user) {
      return NextResponse.json({ error: "user is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Fetch unread messages where receiver is user
    const unreadMessages = await Message.find({
      receiverId: user,
      read: false
    });

    const unreadCount = unreadMessages.length;
    
    // Get unique senders of these unread messages
    const senders = Array.from(new Set(unreadMessages.map((msg: any) => msg.senderId)));

    return NextResponse.json({ success: true, unreadCount, senders });
  } catch (error: any) {
    console.error("Messages Unread GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
