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
    const subject = searchParams.get('subject') || 'Biology';
    
    if (subject.includes('..') || subject.includes('/') || subject.includes('\\')) {
      return NextResponse.json({ error: 'Invalid subject' }, { status: 400 });
    }

    const foldersSet = new Set<string>();

    // 1. Try file system
    const rootDir = path.join(BASE_DIR, subject);
    if (fs.existsSync(rootDir)) {
      const entries = fs.readdirSync(rootDir, { withFileTypes: true });
      entries.forEach(dirent => {
        if (dirent.isDirectory() && !dirent.name.startsWith('.')) {
          foldersSet.add(dirent.name);
        }
      });
    }

    // 2. Try MongoDB
    try {
      await connectToDatabase();
      const docs = await ChapterQuestion.find({ subject }).select('folder');
      docs.forEach(doc => {
        if (doc.folder) foldersSet.add(doc.folder);
      });
    } catch (dbError) {
      console.error('Error fetching chapters from MongoDB:', dbError);
    }

    const folders = Array.from(foldersSet);
    folders.sort();

    return NextResponse.json({ folders });
  } catch (error: any) {
    console.error('Error reading chapters directory:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
