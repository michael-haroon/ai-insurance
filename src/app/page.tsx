// src/app/page.tsx
'use client';

import { useState } from 'react';
import Dropzone from '@/components/Dropzone';
import ResultsTable from '@/components/ResultsTable';
import { parseFile } from '@/lib/parser';
import { findBestMatch } from '@/lib/match';

interface Result {
  fileName: string;
  extractedName: string;
  matchedId: string;
  confidence: number;
  status: 'uploaded' | 'processing' | 'done' | 'error';
  error?: string;
}

export default function Home() {
  const [results, setResults] = useState<Result[]>([]);

  const handleFilesAccepted = async (files: File[]) => {
    // Add new files to results with 'uploaded' status
    const newResults = files.map(file => ({
      fileName: file.name,
      extractedName: '',
      matchedId: '',
      confidence: 0,
      status: 'uploaded' as const,
    }));
    
    // Add new results to state
    setResults(prev => [...prev, ...newResults]);
    
    // Store the starting index for our batch
    const startIndex = results.length;

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const resultIndex = startIndex + i;

      try {
        // Update status to processing
        setResults(prev => {
          const updated = [...prev];
          updated[resultIndex] = { ...updated[resultIndex], status: 'processing' };
          return updated;
        });

        // Parse document - this returns {text, insuredName}
        const parsedDoc = await parseFile(file);
        
        // Find best match
        const match = findBestMatch(parsedDoc.insuredName);
        console.log(`Matching "${parsedDoc.insuredName}" → "${match.name}" (${match.internalId}) with confidence ${match.confidence}`);

        // Update results with success
        setResults(prev => {
          const updated = [...prev];
          updated[resultIndex] = {
            fileName: file.name,
            extractedName: parsedDoc.insuredName,
            matchedId: match.internalId,
            confidence: match.confidence,
            status: 'done',
          };
          return updated;
        });
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        
        // Update results with error
        setResults(prev => {
          const updated = [...prev];
          updated[resultIndex] = {
            ...updated[resultIndex],
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          };
          return updated;
        });
      }
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Insurance Claim Parser</h1>
        <Dropzone onFilesAccepted={handleFilesAccepted} />
        <ResultsTable results={results} />
      </div>
    </main>
  );
}