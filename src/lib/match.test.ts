import { normalizeName, findBestMatch } from './match';

describe('normalizeName', () => {
  it('should normalize company names correctly', () => {
    expect(normalizeName('Acme Corp.')).toBe('acme');
    expect(normalizeName('Acme, Inc.')).toBe('acme');
    expect(normalizeName('Acme LLC')).toBe('acme');
    expect(normalizeName('Acme  Co.')).toBe('acme');
    expect(normalizeName('Acme, Ltd.')).toBe('acme');
  });

  it('should handle spaces and punctuation', () => {
    expect(normalizeName('Acme  Corp.')).toBe('acme');
    expect(normalizeName('Acme, Inc.')).toBe('acme');
    expect(normalizeName('Acme-Corp')).toBe('acme-corp');
  });
});

describe('findBestMatch', () => {
  it('should find exact matches', () => {
    const result = findBestMatch('Riley HealthCare LLC');
    expect(result.internalId).toBe('A1B2');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should find close matches', () => {
    const result = findBestMatch('Riley Healthcare');
    expect(result.internalId).toBe('A1B2');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should return no match for low confidence', () => {
    const result = findBestMatch('Completely Different Company');
    expect(result.internalId).toBe('');
    expect(result.name).toBe('No match found');
    expect(result.confidence).toBe(0);
  });

  it('should handle unknown input', () => {
    const result = findBestMatch('UNKNOWN');
    expect(result.internalId).toBe('');
    expect(result.name).toBe('No match found');
    expect(result.confidence).toBe(0);
  });
}); 