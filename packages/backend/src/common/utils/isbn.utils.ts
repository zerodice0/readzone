/**
 * ISBN parsing and validation utilities
 * Handles Kakao API responses with mixed ISBN formats
 */

export interface ParsedIsbn {
  isbn10?: string;
  isbn13?: string;
  primaryIsbn: string; // For backward compatibility
}

/**
 * Validates ISBN-10 format (10 digits)
 */
export function validateISBN10(isbn: string): boolean {
  return /^\d{10}$/.test(isbn);
}

/**
 * Validates ISBN-13 format (13 digits)
 */
export function validateISBN13(isbn: string): boolean {
  return /^\d{13}$/.test(isbn);
}

/**
 * Cleans ISBN string by removing hyphens and spaces
 */
export function cleanIsbn(isbn: string): string {
  return isbn.replace(/[\s-]/g, '');
}

/**
 * Parses Kakao API ISBN response that can contain:
 * 1. Single ISBN-10: "1234567890"
 * 2. Single ISBN-13: "9781234567890"
 * 3. Multiple ISBNs: "1234567890 9781234567890"
 * 4. Invalid/empty data: ""
 */
export function parseKakaoIsbn(
  isbnString: string | null | undefined,
): ParsedIsbn {
  if (!isbnString || typeof isbnString !== 'string') {
    return { primaryIsbn: '' };
  }

  // Split by whitespace and filter out empty strings
  const isbns = isbnString.trim().split(/\s+/).map(cleanIsbn).filter(Boolean);

  if (isbns.length === 0) {
    return { primaryIsbn: '' };
  }

  // Extract valid ISBN-10 and ISBN-13
  const isbn10 = isbns.find((isbn) => validateISBN10(isbn));
  const isbn13 = isbns.find((isbn) => validateISBN13(isbn));

  // Primary ISBN priority: ISBN-13 > ISBN-10 > first valid ISBN
  const primaryIsbn = isbn13 || isbn10 || isbns[0];

  const result: ParsedIsbn = { primaryIsbn };

  if (isbn10) {
    result.isbn10 = isbn10;
  }

  if (isbn13) {
    result.isbn13 = isbn13;
  }

  return result;
}

/**
 * Finds existing book by either ISBN-10 or ISBN-13
 * Used for duplicate detection
 */
export interface IsbnSearchQuery {
  OR: Array<{
    isbn10?: string;
    isbn13?: string;
  }>;
}

export function buildIsbnSearchQuery(
  parsed: ParsedIsbn,
): IsbnSearchQuery | null {
  const conditions: Array<{ isbn10?: string; isbn13?: string }> = [];

  if (parsed.isbn10) {
    conditions.push({ isbn10: parsed.isbn10 });
  }

  if (parsed.isbn13) {
    conditions.push({ isbn13: parsed.isbn13 });
  }

  if (conditions.length === 0) {
    return null;
  }

  return { OR: conditions };
}

/**
 * Converts separate ISBN fields back to legacy format for backward compatibility
 */
export function toLegacyIsbn(isbn10?: string, isbn13?: string): string {
  return isbn13 || isbn10 || '';
}
