// app/api/parse-pdf/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let pdfParse: any;

async function getPdfParser() { 
  if (!pdfParse) {
    pdfParse = (await import('pdf-parse')).default;
  }
  return pdfParse;
}

export async function POST(request: Request) {
try {
// Read incoming file bytes
const parser = await getPdfParser();
const buffer = Buffer.from(await request.arrayBuffer());


// Attempt direct parse
  try {
    const { text } = await parser(buffer);
    console.log("PDF parsed successfully, text sample:", text.substring(0, 100));
    return NextResponse.json({ text });
  } catch (firstErr: any) {
    console.warn("Direct parse failed, attempting QPDF fallback:", firstErr.message);

    try {
      // Check if QPDF is available
      execSync('which qpdf', { stdio: 'ignore' });

      // Write temp files
      const inPath = join(tmpdir(), `in-${Date.now()}.pdf`);
      const outPath = join(tmpdir(), `out-${Date.now()}.pdf`);
      fs.writeFileSync(inPath, buffer);

      // Run QPDF to repair XRef
      execSync(`qpdf ${inPath} ${outPath}`);

      // Read repaired PDF and re-parse
      const repairedBuffer = fs.readFileSync(outPath);
      const { text } = await parser(repairedBuffer);
      console.log("PDF repaired with QPDF, text sample:", text.substring(0, 100));
      return NextResponse.json({ text });
    } catch (qpdfErr: any) {
      console.warn("QPDF fallback failed:", qpdfErr.message);
      
      // Final fallback: treat as plain text
      console.log("Using plain text fallback extraction");
      
      // This is a very crude approach that won't work well for binary PDFs,
      // but it's better than nothing as a last resort
      let rawText = "";
      
      // Try to extract any readable text from the buffer
      for (let i = 0; i < buffer.length; i++) {
        const byte = buffer[i];
        // Only include printable ASCII characters
        if (byte >= 32 && byte <= 126) {
          rawText += String.fromCharCode(byte);
        } else if (byte === 10 || byte === 13) {
          // Add newlines
          rawText += '\n';
        }
      }
      
      // Clean up the output a bit
      const cleanedText = rawText
        .replace(/[\x00-\x1F\x7F-\xFF]/g, "") // Remove non-printable chars
        .replace(/\s+/g, " ")                 // Normalize whitespace
        .replace(/\s\s+/g, "\n")              // Convert multiple spaces to newlines
        .trim();
      
      console.log("Plain text fallback extracted:", cleanedText.substring(0, 100));
      return NextResponse.json({ text: cleanedText });
    }
  }
} catch (err: any) {
  console.error("parse-pdf error:", err);
  return NextResponse.json(
    { error: "Failed to parse PDF", details: String(err) },
    { status: 500 }
    );
  }
}