// src/app/api/parse-docx/route.ts
import { NextResponse } from 'next/server';
import mammoth from 'mammoth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert File to Buffer (which mammoth understands better than ArrayBuffer)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Use the buffer format that mammoth prefers
    const result = await mammoth.extractRawText({ buffer });
    
    // Log success for debugging
    console.log(`Successfully parsed DOCX file: ${file.name}, extracted ${result.value.length} chars`);
    
    return NextResponse.json({ text: result.value });
  } catch (err: any) {
    console.error('Error parsing DOCX:', err);
    
    // Return error response
    return NextResponse.json(
      { error: 'Error parsing DOCX', details: String(err) },
      { status: 500 }
    );
  }
}