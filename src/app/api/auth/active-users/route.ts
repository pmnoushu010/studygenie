import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Session from "@/models/Session";

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    // Define "active" as having pinged the server within the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const activeSessions = await Session.find({
      lastActive: { $gte: fiveMinutesAgo },
      role: { $ne: "superadmin" } // Optional: Exclude superadmin from the list if you only want to see students
    })
    .sort({ lastActive: -1 })
    .select("username ipAddress lastActive userAgent -_id"); // Exclude internal ID

    return NextResponse.json({ success: true, activeUsers: activeSessions });
  } catch (error: any) {
    console.error("Active Users API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
