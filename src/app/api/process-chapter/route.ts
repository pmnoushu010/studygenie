import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import connectToDatabase from '@/lib/mongodb';
import ChapterQuestion from '@/models/ChapterQuestion';

const ROOT_DIR = path.join(process.cwd(), 'data');

export async function POST(req: NextRequest) {
  try {
    const { subject = 'Biology', folder, selectedFiles } = await req.json();
    const apiKeys = (process.env.GEMINI_API_KEYS || "").split(",").map(k => k.trim()).filter(Boolean);

    if (!folder) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }
    if (apiKeys.length === 0) {
      return NextResponse.json({ error: 'No API Keys provided in environment variables' }, { status: 500 });
    }

    // Security check to prevent path traversal
    if (folder.includes('..') || folder.includes('/') || folder.includes('\\') || subject.includes('..') || subject.includes('/') || subject.includes('\\')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const folderPath = path.join(ROOT_DIR, subject, folder);
    
    if (!fs.existsSync(folderPath)) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Find all PDFs and images in the folder
    let files = fs.readdirSync(folderPath);
    if (selectedFiles && Array.isArray(selectedFiles) && selectedFiles.length > 0) {
       files = files.filter(f => selectedFiles.includes(f));
    }
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
    const imageFiles = files.filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.png'));
    const textFiles = files.filter(f => f.toLowerCase().endsWith('.txt') || f.toLowerCase().endsWith('.md'));

    if (pdfFiles.length === 0 && imageFiles.length === 0 && textFiles.length === 0) {
      return NextResponse.json({ error: 'No PDF, image, or text files found to process.' }, { status: 400 });
    }

    const parts: any[] = [];
    
    let prompt = "";
    if (subject === "Basic Mechanical Engineering") {
      prompt = `
      You are an expert Engineering Professor. Analyze this educational material for B.Tech Basic Mechanical Engineering and generate a university-style question paper based on its contents.
      
      Extract the core concepts and create the following types of questions based strictly on the provided material.
      You MUST respond ONLY with a valid JSON object matching this exact structure, with no markdown formatting or backticks around it:
      {
        "summary": "A detailed overview of the important details, core concepts, and main content to read and understand before answering questions.",
        "sa": [
          { "q": "Part A (3 Marks): Question text here (e.g. Write a note on... or How are... classified?)", "a": "Answer here" }
        ],
        "essay": [
          { "q": "Part B (12 Marks): Question text here (e.g. With the help of a neat sketch explain...)", "a": "Detailed multi-point answer here" }
        ]
      }
      Generate a thorough summary of the material. Then, generate 5-8 questions for the "sa" (Part A, 3 Marks) category and 3-5 questions for the "essay" (Part B, 12 Marks) category. Make sure they are accurate and based ON THE PROVIDED IMAGES/DOCUMENTS.
      `;
    } else {
      prompt = `
      You are an expert teacher. Analyze this educational material (from a textbook, which may span multiple pages/images) and generate a question paper based on its combined contents.
      
      Extract the core concepts and create the following types of questions.
      You MUST respond ONLY with a valid JSON object matching this exact structure, with no markdown formatting or backticks around it:
      {
        "summary": "A detailed overview of the important details, core concepts, and main content to read and understand before answering questions.",
        "oneword": [
          { "q": "Question text here", "a": "Answer here" }
        ],
        "sa": [
          { "q": "Question text here", "a": "Answer here" }
        ],
        "fill": [
          { "q": "Question text here", "a": "Answer here" }
        ],
        "match": [
          { "q": "Term 1", "a": "Matching definition/term" }
        ],
        "essay": [
          { "q": "Very important 5-mark essay question here", "a": "Detailed multi-point answer here" }
        ]
      }
      Generate a thorough summary of the material. Then, generate 7 to 10 questions for the "oneword" category if the chapter is large enough. For all other categories, generate at least 3 questions (including at least 3 essay questions). Make sure they are accurate and based ON THE PROVIDED IMAGES/DOCUMENTS.
      `;
    }
    
    const fileParts: any[] = [];
    
    // Read local PDF files and convert to base64
    for (const file of pdfFiles) {
      const filePath = path.join(folderPath, file);
      const buffer = fs.readFileSync(filePath);
      const base64Data = Buffer.from(buffer).toString('base64');
      
      fileParts.push({
        inlineData: {
          data: base64Data,
          mimeType: 'application/pdf'
        }
      });
    }

    // Read local image files and convert to base64
    for (const file of imageFiles) {
      const filePath = path.join(folderPath, file);
      const buffer = fs.readFileSync(filePath);
      const base64Data = Buffer.from(buffer).toString('base64');
      
      let mimeType = 'image/jpeg';
      if (file.toLowerCase().endsWith('.png')) mimeType = 'image/png';
      
      fileParts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    // Read text files directly as text parts
    for (const file of textFiles) {
      const filePath = path.join(folderPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      fileParts.push({ text: "\n--- Content from " + file + " ---\n" + content + "\n" });
    }

    const mergedData: any = {
      summary: "",
      oneword: [],
      sa: [],
      fill: [],
      match: [],
      essay: []
    };

    let currentKeyIndex = 0;

    async function processPartWithRetry(part: any) {
      let retries = 3;
      while (retries > 0) {
        if (currentKeyIndex >= apiKeys.length) {
          throw new Error("API Quota Exceeded across all available keys.");
        }
        const key = apiKeys[currentKeyIndex];
        const ai = new GoogleGenAI({ apiKey: key });
        
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }, part]
              }
            ],
            config: {
              responseMimeType: "application/json"
            }
          });
          return response.text;
        } catch (err: any) {
          const isQuotaError = err.status === 429 || (err.message && (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('quota')));
          const isServerError = err.status === 503 || err.status === 500 || (err.message && err.message.includes('503'));

          if (isQuotaError) {
            console.warn(`Quota exceeded for key starting with ${key.substring(0, 4)}... Switching to next key.`);
            currentKeyIndex++; // Switch to next key
            // Do not decrement retries; we just try the new key
          } else if (isServerError) {
            retries -= 1;
            if (retries === 0) throw err;
            console.warn(`Server busy (503). Retrying in 5 seconds... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, 5000));
          } else {
            throw err;
          }
        }
      }
      return null;
    }

    let hasProcessedAny = false;
    for (const part of fileParts) {
       console.log("Processing a page/image...");
       try {
         const jsonText = await processPartWithRetry(part);
         if (jsonText) {
            const parsed = JSON.parse(jsonText);
            if (parsed.summary) {
              mergedData.summary += (mergedData.summary ? "\n\n" : "") + parsed.summary;
            }
            if (parsed.oneword) mergedData.oneword.push(...parsed.oneword);
            if (parsed.sa) mergedData.sa.push(...parsed.sa);
            if (parsed.fill) mergedData.fill.push(...parsed.fill);
            if (parsed.match) mergedData.match.push(...parsed.match);
            if (parsed.essay) mergedData.essay.push(...parsed.essay);
            hasProcessedAny = true;
         }
       } catch (error: any) {
         console.error("Error processing a part:", error);
         // If we run out of quota entirely, we should stop trying other parts and return what we have, or error if we have nothing.
         if (error.message && error.message.includes("API Quota Exceeded")) {
            console.warn("Out of quota. Stopping processing of remaining pages.");
            break;
         }
         // Otherwise, we might just skip the failed part and continue to the next
       }
    }

    if (!hasProcessedAny) {
      return NextResponse.json({ error: 'Failed to generate questions. Model may be unavailable or out of quota.' }, { status: 500 });
    }

    // Save to MongoDB
    try {
      await connectToDatabase();
      await ChapterQuestion.findOneAndUpdate(
        { subject, folder },
        { subject, folder, data: mergedData },
        { upsert: true, new: true }
      );
    } catch (dbError) {
      console.error('Error saving to MongoDB:', dbError);
    }

    // Save to local file system
    const questionsPath = path.join(folderPath, 'questions.json');
    try {
      fs.writeFileSync(questionsPath, JSON.stringify(mergedData, null, 2));
    } catch (fsError) {
      console.error('Error saving to filesystem:', fsError);
    }

    return NextResponse.json({ success: true, data: mergedData });

  } catch (error: any) {
    console.error('Error generating questions:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
