// src/lib/match.ts
import stringSimilarity from 'string-similarity';
import { INSUREDS } from './mockData';

export interface MatchResult {
  internalId: string;
  name: string;
  confidence: number;
}

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,]/g, '') // Remove periods and commas
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/\b(inc\.?|llc|ltd\.?|corp\.?|co\.?)\b/gi, '') // Remove common corporate suffixes
    .trim();
}

export function findBestMatch(extractedName: string): MatchResult {
  const normalizedExtracted = normalizeName(extractedName);

  if (normalizedExtracted === 'unknown') {
    return { internalId: '', name: 'No match found', confidence: 0 };
  }

  const matches = INSUREDS.map(insured => ({
    internalId: insured.internalId,
    name: insured.name,
    confidence: stringSimilarity.compareTwoStrings(
      normalizedExtracted,
      normalizeName(insured.name)
    ),
  }));

  const bestMatch = matches.reduce((best, current) =>
    current.confidence > best.confidence ? current : best
  );

  return bestMatch.confidence >= 0.8
    ? bestMatch
    : { internalId: '', name: 'No match found', confidence: 0 };
}
