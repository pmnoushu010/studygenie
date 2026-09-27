import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const apiKey = formData.get('apiKey') as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }
    if (!apiKey) {
      return NextResponse.json({ error: 'No API Key provided' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Process all uploaded files
    const parts: any[] = [];
    
    const prompt = `
      You are an expert teacher. Analyze this educational material (from a 9th standard textbook, which may span multiple pages/images) and generate a question paper based on its combined contents.
      
      Extract the core concepts and create the following types of questions.
      You MUST respond ONLY with a valid JSON object matching this exact structure, with no markdown formatting or backticks around it:
      {
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
        ]
      }
      
      Generate at least 3 questions for each category. Make sure they are accurate and based ON THE PROVIDED IMAGES/DOCUMENTS.
    `;
    
    parts.push({ text: prompt });

    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString('base64');
      const mimeType = file.type || 'application/pdf';
      
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: parts
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text();
    if (!jsonText) {
       return NextResponse.json({ error: 'Failed to generate questions.' }, { status: 500 });
    }
    
    const parsedData = JSON.parse(jsonText);
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error('Error generating questions:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
