import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import connectToDatabase from '@/lib/mongodb';
import ChapterQuestion from '@/models/ChapterQuestion';

const BASE_DIR = path.join(process.cwd(), 'data');

export async function POST(req: NextRequest) {
  try {
    const { subject, folder } = await req.json();

    if (!subject || !folder) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (
      subject.includes('..') || subject.includes('/') || subject.includes('\\') ||
      folder.includes('..') || folder.includes('/') || folder.includes('\\')
    ) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const folderPath = path.join(BASE_DIR, subject, folder);

    // Delete in file system
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
    }

    // Try deleting in MongoDB
    try {
      await connectToDatabase();
      await ChapterQuestion.findOneAndDelete({ subject, folder });
    } catch (dbError) {
      console.error('Error deleting from MongoDB:', dbError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting folder:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
