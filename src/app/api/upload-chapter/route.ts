import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BASE_DIR = path.join(process.cwd(), 'data');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const chapterName = formData.get('chapterName') as string;
    const subject = formData.get('subject') as string || 'Biology';
    const files = formData.getAll('files') as File[];

    if (!chapterName) {
      return NextResponse.json({ error: 'Chapter name is required' }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (chapterName.includes('..') || chapterName.includes('/') || chapterName.includes('\\') || subject.includes('..') || subject.includes('/') || subject.includes('\\')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const folderPath = path.join(BASE_DIR, subject, chapterName);
    
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(folderPath, file.name);
      fs.writeFileSync(filePath, buffer);
    }

    return NextResponse.json({ success: true, message: 'Files uploaded successfully' });
  } catch (error: any) {
    console.error('Error uploading files:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
