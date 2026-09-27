import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ROOT_DIR = 'C:/Users/noushad.meethal/Downloads/9th STD';

export async function POST(req: NextRequest) {
  try {
    const { folder } = await req.json();

    if (!folder) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    // Security check to prevent path traversal
    if (folder.includes('..') || folder.includes('/') || folder.includes('\\')) {
      return NextResponse.json({ error: 'Invalid folder name' }, { status: 400 });
    }

    const folderPath = path.join(ROOT_DIR, folder);
    
    if (!fs.existsSync(folderPath)) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Find all images in the folder
    const files = fs.readdirSync(folderPath);
    const imageFiles = files.filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.png'));

    if (imageFiles.length === 0) {
      return NextResponse.json({ error: 'No JPG or PNG files found to convert.' }, { status: 400 });
    }

    const { PDFDocument } = require('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    
    for (const file of imageFiles) {
      const filePath = path.join(folderPath, file);
      const imageBytes = fs.readFileSync(filePath);
      
      let image;
      if (file.toLowerCase().endsWith('.png')) {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        image = await pdfDoc.embedJpg(imageBytes);
      }
      
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }
    
    const pdfBytes = await pdfDoc.save();
    
    // Save combined PDF to folder
    const combinedPdfPath = path.join(folderPath, 'combined_chapter.pdf');
    fs.writeFileSync(combinedPdfPath, pdfBytes);

    return NextResponse.json({ success: true, message: 'PDF generated successfully!' });

  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
