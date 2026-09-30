import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import connectToDatabase from '@/lib/mongodb';
import ChapterQuestion from '@/models/ChapterQuestion';

export const dynamic = 'force-dynamic';

const BASE_DIR = path.join(process.cwd(), 'data');

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const folder = searchParams.get('folder');
    const subject = searchParams.get('subject') || 'Biology';

    if (!folder) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    if (folder.includes('..') || folder.includes('/') || folder.includes('\\') || subject.includes('..') || subject.includes('/') || subject.includes('\\')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const folderPath = path.join(BASE_DIR, subject, folder);
    const questionsPath = path.join(folderPath, 'questions.json');

    // 1. First, check the file system (which gets updated via GitHub)
    if (fs.existsSync(questionsPath)) {
      try {
        const data = fs.readFileSync(questionsPath, 'utf8');
        return NextResponse.json(JSON.parse(data));
      } catch (fileError) {
        console.error('Error reading from filesystem, falling back to MongoDB:', fileError);
      }
    }

    // 2. If file system doesn't have it (or fails), fallback to MongoDB
    try {
      await connectToDatabase();
      const doc = await ChapterQuestion.findOne({ subject, folder });
      if (doc && doc.data) {
        return NextResponse.json(doc.data);
      }
    } catch (dbError) {
      console.error('Error fetching from MongoDB:', dbError);
    }

    return NextResponse.json(null);
  } catch (error: any) {
    console.error('Error reading questions:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
