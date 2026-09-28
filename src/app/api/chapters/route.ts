import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BASE_DIR = path.join(process.cwd(), 'data');

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const subject = searchParams.get('subject') || 'Biology';
    
    if (subject.includes('..') || subject.includes('/') || subject.includes('\\')) {
      return NextResponse.json({ error: 'Invalid subject' }, { status: 400 });
    }

    const rootDir = path.join(BASE_DIR, subject);
    if (!fs.existsSync(rootDir)) {
      return NextResponse.json({ folders: [] });
    }

    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    
    const folders = entries
      .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
      .map(dirent => dirent.name);
      
    folders.sort();

    return NextResponse.json({ folders });
  } catch (error: any) {
    console.error('Error reading chapters directory:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
