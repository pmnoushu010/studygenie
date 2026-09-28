import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import connectToDatabase from '@/lib/mongodb';
import ChapterQuestion from '@/models/ChapterQuestion';

const BASE_DIR = path.join(process.cwd(), 'data');

export async function POST(req: NextRequest) {
  try {
    const { subject, oldFolder, newFolder } = await req.json();

    if (!subject || !oldFolder || !newFolder) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (
      subject.includes('..') || subject.includes('/') || subject.includes('\\') ||
      oldFolder.includes('..') || oldFolder.includes('/') || oldFolder.includes('\\') ||
      newFolder.includes('..') || newFolder.includes('/') || newFolder.includes('\\')
    ) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const oldPath = path.join(BASE_DIR, subject, oldFolder);
    const newPath = path.join(BASE_DIR, subject, newFolder);

    if (!fs.existsSync(oldPath)) {
      return NextResponse.json({ error: 'Original folder not found' }, { status: 404 });
    }

    if (fs.existsSync(newPath)) {
      return NextResponse.json({ error: 'A folder with the new name already exists' }, { status: 400 });
    }

    // Rename in file system
    fs.renameSync(oldPath, newPath);

    // Try renaming in MongoDB
    try {
      await connectToDatabase();
      await ChapterQuestion.findOneAndUpdate(
        { subject, folder: oldFolder },
        { folder: newFolder }
      );
    } catch (dbError) {
      console.error('Error renaming in MongoDB:', dbError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error renaming folder:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
