import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BASE_DIR = 'C:/Users/noushad.meethal/Downloads/9th STD';

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

    if (!fs.existsSync(folderPath)) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    if (fs.existsSync(questionsPath)) {
      const data = fs.readFileSync(questionsPath, 'utf8');
      return NextResponse.json(JSON.parse(data));
    } else {
      return NextResponse.json(null);
    }
  } catch (error: any) {
    console.error('Error reading questions:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
