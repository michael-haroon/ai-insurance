// src/lib/parser.ts
import { extractInsuredName } from '@/lib/llm'

export interface ParsedDocument {
  text: string
  insuredName: string
}

/**
 * High-level helper: give it a File, get back the extracted
 * plain-text *and* the insured name (via LLM).
 */
export async function parseFile(file: File): Promise<ParsedDocument> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  // 1️⃣  Extract plain text via format-specific route
  let text: string
  switch (ext) {
    case 'pdf':
      text = await parseViaApi('/parse-pdf', file)
      if (typeof text !== 'string') {
        console.error('PDF text is not a string:', text);
        text = JSON.stringify(text);
      }
      break
    case 'docx':
      text = await parseViaApi('/parse-docx', file)
      break
    case 'txt':
      text = await file.text()
      break
    default:
      throw new Error(`Unsupported file type: ${ext}`)
  }

  // 2️⃣  Ask the LLM for the primary insured
  const insuredName = await extractInsuredName(text)

  return { text, insuredName }
}

/* ---------- helpers ---------- */

async function parseViaApi(endpoint: string, file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)

  const res = await fetch(`/api${endpoint}`, { method: 'POST', body: fd })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `${endpoint} failed: ${res.status}`)
  }
  const { text } = await res.json()
  return text
}