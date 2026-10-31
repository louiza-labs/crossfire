/**
 * Borrower name normalization and fuzzy matching
 * Handles variations in company names across different SEC filings
 */

// Common suffixes to strip from company names
const SUFFIXES_PATTERN =
  /,?\s*(Inc\.?|LLC|L\.?L\.?C\.?|Corp\.?|Corporation|Ltd\.?|Limited|L\.?P\.?|LP|Holdings?|Holdco|Bidco|Buyer|Borrower|Parent|Intermediate|Topco|Midco|Blocker|Merger\s*Sub|Acquisition\s*Corp|Co\.?|Company|Group|Partners?|Capital|Enterprises?|International|Global|North\s*America|NA|US|USA|UK)$/gi;

// Additional patterns to normalize
const NORMALIZE_PATTERNS: [RegExp, string][] = [
  [/\s+/g, " "], // Multiple spaces to single
  [/\s*[,\-]\s*/g, " "], // Normalize separators
  [/\s*&\s*/g, " and "], // Ampersand to "and"
  [/\(.*?\)/g, ""], // Remove parentheticals
  [/['"]/g, ""], // Remove quotes
  [/\s+/g, " "], // Clean up spaces again
];

/**
 * Normalize a borrower name to a canonical form
 */
export function normalizeBorrowerName(name: string): string {
  let normalized = name.trim();

  // Apply normalization patterns
  for (const [pattern, replacement] of NORMALIZE_PATTERNS) {
    normalized = normalized.replace(pattern, replacement);
  }

  // Strip suffixes (may need multiple passes)
  let prev = "";
  while (prev !== normalized) {
    prev = normalized;
    normalized = normalized.replace(SUFFIXES_PATTERN, "").trim();
  }

  // Final cleanup
  normalized = normalized.trim();

  // Title case for consistency
  normalized = normalized
    .split(" ")
    .map((word) => {
      if (word.length <= 2) return word.toUpperCase(); // Keep acronyms uppercase
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

  return normalized;
}

/**
 * Calculate Jaro-Winkler similarity (0-1, higher = more similar)
 */
function jaroWinklerSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches: boolean[] = new Array(s1.length).fill(false);
  const s2Matches: boolean[] = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;

  // Winkler modification: boost for common prefix
  let prefixLength = 0;
  for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) prefixLength++;
    else break;
  }

  return jaro + prefixLength * 0.1 * (1 - jaro);
}

export interface SimilarityMatch {
  name: string;
  normalizedName: string;
  similarity: number;
  method: "exact" | "normalized" | "fuzzy";
}

/**
 * Find similar borrowers from a list of existing names
 */
export function findSimilarBorrowers(
  name: string,
  existingBorrowers: string[],
  threshold = 0.85
): SimilarityMatch[] {
  const normalizedInput = normalizeBorrowerName(name).toLowerCase();
  const matches: SimilarityMatch[] = [];

  for (const existing of existingBorrowers) {
    const normalizedExisting = normalizeBorrowerName(existing).toLowerCase();

    // Exact match after normalization
    if (normalizedInput === normalizedExisting) {
      matches.push({
        name: existing,
        normalizedName: normalizeBorrowerName(existing),
        similarity: 1,
        method: "normalized",
      });
      continue;
    }

    // Fuzzy match using Jaro-Winkler
    const similarity = jaroWinklerSimilarity(normalizedInput, normalizedExisting);
    if (similarity >= threshold) {
      matches.push({
        name: existing,
        normalizedName: normalizeBorrowerName(existing),
        similarity,
        method: "fuzzy",
      });
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity);
}

export interface BorrowerGroup {
  canonicalName: string;
  aliases: string[];
  count: number;
}

/**
 * Group borrowers by similarity, identifying likely duplicates
 */
export function groupSimilarBorrowers(borrowerNames: string[], threshold = 0.88): BorrowerGroup[] {
  const groups: BorrowerGroup[] = [];
  const assigned = new Set<string>();

  // Sort by name length (longer names often have more info)
  const sorted = [...borrowerNames].sort((a, b) => b.length - a.length);

  for (const name of sorted) {
    if (assigned.has(name)) continue;

    const normalized = normalizeBorrowerName(name);
    const group: BorrowerGroup = {
      canonicalName: normalized,
      aliases: [name],
      count: 1,
    };
    assigned.add(name);

    // Find similar names not yet assigned
    for (const other of sorted) {
      if (assigned.has(other)) continue;

      const otherNormalized = normalizeBorrowerName(other);

      // Check for exact normalized match
      if (normalized.toLowerCase() === otherNormalized.toLowerCase()) {
        group.aliases.push(other);
        group.count++;
        assigned.add(other);
        continue;
      }

      // Check fuzzy similarity
      const similarity = jaroWinklerSimilarity(
        normalized.toLowerCase(),
        otherNormalized.toLowerCase()
      );
      if (similarity >= threshold) {
        group.aliases.push(other);
        group.count++;
        assigned.add(other);
      }
    }

    groups.push(group);
  }

  return groups.filter((g) => g.count > 1).sort((a, b) => b.count - a.count);
}
