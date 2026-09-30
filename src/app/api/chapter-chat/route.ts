import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.join(process.cwd(), 'data');

export async function POST(req: NextRequest) {
  try {
    const { subject, folder, messages } = await req.json();
    const apiKeys = (process.env.GEMINI_API_KEYS || "").split(",").map(k => k.trim()).filter(Boolean);

    if (!subject || !messages) {
      return NextResponse.json({ error: 'Subject and messages are required' }, { status: 400 });
    }

    if (apiKeys.length === 0) {
      return NextResponse.json({ error: 'No API Keys provided in environment variables' }, { status: 500 });
    }

    // Security check to prevent path traversal
    if ((folder && (folder.includes('..') || folder.includes('/') || folder.includes('\\'))) || subject.includes('..') || subject.includes('/') || subject.includes('\\')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const subjectPath = path.join(ROOT_DIR, subject);
    if (!fs.existsSync(subjectPath)) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    let context = "";
    let scopeText = "";

    if (folder) {
      // Specific chapter chat
      const folderPath = path.join(subjectPath, folder);
      if (!fs.existsSync(folderPath)) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
      }

      const chapterTxtPath = path.join(folderPath, 'chapter.txt');
      if (fs.existsSync(chapterTxtPath)) {
        context = fs.readFileSync(chapterTxtPath, 'utf-8');
      } else {
        const questionsJsonPath = path.join(folderPath, 'questions.json');
        if (fs.existsSync(questionsJsonPath)) {
          context = fs.readFileSync(questionsJsonPath, 'utf-8');
        }
      }
      scopeText = `the chapter "${folder}"`;
    } else {
      // Whole subject chat
      const folders = fs.readdirSync(subjectPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      for (const f of folders) {
        const folderPath = path.join(subjectPath, f);
        const chapterTxtPath = path.join(folderPath, 'chapter.txt');
        if (fs.existsSync(chapterTxtPath)) {
          context += `\n\n--- Chapter: ${f} ---\n` + fs.readFileSync(chapterTxtPath, 'utf-8');
        } else {
          const questionsJsonPath = path.join(folderPath, 'questions.json');
          if (fs.existsSync(questionsJsonPath)) {
            context += `\n\n--- Chapter: ${f} ---\n` + fs.readFileSync(questionsJsonPath, 'utf-8');
          }
        }
      }
      scopeText = `all chapters in the subject`;
    }

    if (!context) {
      return NextResponse.json({ error: 'No content found for the subject/chapter.' }, { status: 404 });
    }

    const systemPrompt = `You are a helpful SG Tutor for a student studying the subject "${subject}", specifically covering ${scopeText}.
Your goal is to answer the student's questions accurately using ONLY the provided context below.
If the student asks a question that cannot be answered using the provided context, politely inform them that the information is not covered in the current study material.

--- CONTEXT ---
${context}
-----------------------
`;

    // Format messages for Google Gen AI
    const contents = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Inject system prompt into the first user message
    if (contents.length > 0 && contents[0].role === 'user') {
      contents[0].parts[0].text = systemPrompt + "\n\nUser Question: " + contents[0].parts[0].text;
    } else {
      contents.unshift({
        role: 'user',
        parts: [{ text: systemPrompt }]
      });
    }

    let responseText = "";
    let currentKeyIndex = 0;
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
          contents: contents
        });
        responseText = response.text || "";
        break; // Success
      } catch (err: any) {
        const isQuotaError = err.status === 429 || (err.message && (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('quota')));
        const isServerError = err.status === 503 || err.status === 500 || (err.message && err.message.includes('503'));

        if (isQuotaError) {
          console.warn(`Quota exceeded for key starting with ${key.substring(0, 4)}... Switching to next key.`);
          currentKeyIndex++; // Switch to next key
        } else if (isServerError) {
          retries -= 1;
          if (retries === 0) throw err;
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          throw err;
        }
      }
    }

    if (!responseText) {
      return NextResponse.json({ error: 'Failed to generate a response.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, reply: responseText });

  } catch (error: any) {
    console.error('Error in chapter chat:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
