import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BASE_DIR = 'C:/Users/noushad.meethal/Downloads/9th STD';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const folder = url.searchParams.get('folder');
  const subject = url.searchParams.get('subject') || 'Biology';

  if (!folder || folder.includes('..') || folder.includes('/') || folder.includes('\\') || subject.includes('..') || subject.includes('/') || subject.includes('\\')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const folderPath = path.join(BASE_DIR, subject, folder);
  if (!fs.existsSync(folderPath)) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }

  const files = fs.readdirSync(folderPath).filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.png') || f.toLowerCase().endsWith('.pdf') || f.toLowerCase().endsWith('.txt'));
  
  return NextResponse.json({ files });
}
