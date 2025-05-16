// src/components/ResultsTable.tsx
import React from 'react';
import { INSUREDS } from '@/lib/mockData'; // Import the mock data

interface Result {
  fileName: string;
  extractedName: string;
  matchedId: string;
  confidence: number;
  status: 'uploaded' | 'processing' | 'done' | 'error';
  error?: string;
}

interface ResultsTableProps {
  results: Result[];
  onManualMatch?: (fileName: string, internalId: string) => void;
}

export default function ResultsTable({ results, onManualMatch }: ResultsTableProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
              File Name
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Status
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Extracted Name
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Matched ID
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Confidence
            </th>
            {onManualMatch && (
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Action
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {results.map((result, index) => (
            <tr key={index}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                {result.fileName}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${result.status === 'done' ? 'bg-green-100 text-green-800' : 
                    result.status === 'error' ? 'bg-red-100 text-red-800' : 
                    result.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                    'bg-gray-100 text-gray-800'}`}>
                  {result.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {result.extractedName || '-'}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {result.matchedId || 'No match'}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {`${(result.confidence * 100).toFixed(1)}%`}
              </td>
              {onManualMatch && (
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {result.status === 'done' && (result.confidence < 0.8 || !result.matchedId) && (
                    <select 
                      className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      onChange={(e) => onManualMatch(result.fileName, e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>Select match...</option>
                      {INSUREDS.map((insured) => (
                        <option key={insured.internalId} value={insured.internalId}>
                          {insured.name} ({insured.internalId})
                        </option>
                      ))}
                    </select>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}