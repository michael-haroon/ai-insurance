// src/app/page.tsx
'use client';

import { useState, useRef } from 'react';
import Dropzone from '@/components/Dropzone';
import ResultsTable from '@/components/ResultsTable';
import { parseFile } from '@/lib/parser';
import { findBestMatch } from '@/lib/match';
import { INSUREDS } from '@/lib/mockData'; // Import mock data

const generateId = () => Math.random().toString(36).substring(2, 9);

interface Result {
  fileName: string;
  extractedName: string;
  matchedId: string;
  confidence: number;
  status: 'uploaded' | 'processing' | 'done' | 'error';
  error?: string;
  timestamp: number;
}

interface QueueItem {
  id: string;
  file: File;
}

export default function Home() {
  const [resultsMap, setResultsMap] = useState<Record<string, Result>>({});
  const processingQueue = useRef<QueueItem[]>([]);
  const isProcessing = useRef(false);

  // Convert map to array for ResultsTable which expects an array
  const resultsList = Object.values(resultsMap).sort((a, b) => a.timestamp - b.timestamp);

  // Handler for manual matching
  const handleManualMatch = (fileName: string, internalId: string) => {
    // Find the result with this filename
    const resultId = Object.keys(resultsMap).find(
      id => resultsMap[id].fileName === fileName
    );
    
    if (!resultId) return;
    
    // Find the selected insured data
    const selectedInsured = INSUREDS.find(i => i.internalId === internalId);
    if (!selectedInsured) return;
    
    // Update the result with the manual match
    setResultsMap(prev => ({
      ...prev,
      [resultId]: {
        ...prev[resultId],
        matchedId: internalId,
        confidence: 1.0, // Set to 100% for manual matches
      }
    }));
  };

  const processNextInQueue = async () => {
    if (processingQueue.current.length === 0) {
      isProcessing.current = false;
      return;
    }
    
    isProcessing.current = true;
    const { id, file } = processingQueue.current.shift()!;
    
    try {
      // Update status to processing
      setResultsMap(prev => ({
        ...prev,
        [id]: { ...prev[id], status: 'processing' }
      }));

      // Add a delay before parsing to reduce collision likelihood
      await new Promise(resolve => setTimeout(resolve, 300));

      // Parse document
      const parsedDoc = await parseFile(file);
      
      // Find best match
      const match = findBestMatch(parsedDoc.insuredName);
      console.log(`Matching "${parsedDoc.insuredName}" → "${match.name}" (${match.internalId}) with confidence ${match.confidence}`);

      // Update results with success
      setResultsMap(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          extractedName: parsedDoc.insuredName,
          matchedId: match.internalId,
          confidence: match.confidence,
          status: 'done'
        }
      }));
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
      
      // Update results with error
      setResultsMap(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      }));
    }
    
    // Add a small delay before processing the next item
    setTimeout(() => {
      processNextInQueue();
    }, 200);
  };

  const addToQueue = (id: string, file: File) => {
    processingQueue.current.push({ id, file });
    
    // Start processing if not already in progress
    if (!isProcessing.current) {
      processNextInQueue();
    }
  };

  const handleFilesAccepted = (files: File[]) => {
    // Create new result objects with unique IDs
    const newResults: Record<string, Result> = {};
    
    files.forEach(file => {
      const id = generateId();
      newResults[id] = {
        fileName: file.name,
        extractedName: '',
        matchedId: '',
        confidence: 0,
        status: 'uploaded',
        timestamp: Date.now()
      };
      
      // Add to queue instead of calling a non-existent processFile function
      // This uses the queue system you've already set up
      addToQueue(id, file);
    });
    
    // Add new results to state
    setResultsMap(prev => ({
      ...prev,
      ...newResults
    }));
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Insurance Claim Parser</h1>
        <Dropzone onFilesAccepted={handleFilesAccepted} />
        <ResultsTable 
          results={resultsList} 
          onManualMatch={handleManualMatch} 
        />
      </div>
    </main>

  );
}