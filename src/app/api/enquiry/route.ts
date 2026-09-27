import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Enquiry from '@/models/Enquiry';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Connect to the database
    await connectToDatabase();

    // Create a new enquiry document
    const newEnquiry = await Enquiry.create(body);

    return NextResponse.json({ success: true, data: newEnquiry }, { status: 201 });
  } catch (error: any) {
    console.error("Error saving enquiry:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save enquiry' },
      { status: 500 }
    );
  }
}
