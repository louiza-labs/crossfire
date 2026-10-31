/**
 * Industry classification using GICS taxonomy
 * Classifies free-text business descriptions into standardized GICS sectors/industries
 */

import { GICS_SECTORS, type GICSSector, type GICSIndustryGroup } from "./gics";
import { applyOverride } from "./industry-overrides";

export interface ClassificationResult {
  sector: string;
  industryGroup: string;
  confidence: "high" | "medium" | "low";
  matchedKeywords: string[];
  score: number;
}

interface SectorScore {
  sector: GICSSector;
  industryGroup: GICSIndustryGroup | null;
  keywords: string[];
  score: number;
}

// Common words to filter out (not useful for classification)
const STOP_WORDS = new Set([
  "provider",
  "of",
  "and",
  "the",
  "a",
  "an",
  "for",
  "to",
  "in",
  "with",
  "that",
  "is",
  "are",
  "based",
  "solutions",
  "services",
  "products",
  "company",
  "business",
  "inc",
  "llc",
  "corp",
  "ltd",
]);

/**
 * Normalize text for matching - lowercase, remove special chars, tokenize
 */
function normalizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Check if a phrase exists in the text (for multi-word keywords)
 */
function containsPhrase(text: string, phrase: string): boolean {
  return text.toLowerCase().includes(phrase.toLowerCase());
}

/**
 * Score a description against a GICS sector
 */
function scoreSector(description: string, sector: GICSSector): SectorScore {
  const normalizedDesc = description.toLowerCase();
  const tokens = normalizeText(description);
  const matchedKeywords: string[] = [];
  let score = 0;

  // Check sector-level keywords
  for (const keyword of sector.keywords) {
    if (keyword.includes(" ")) {
      // Multi-word keyword - check as phrase
      if (containsPhrase(normalizedDesc, keyword)) {
        matchedKeywords.push(keyword);
        score += 2; // Phrase matches are stronger
      }
    } else {
      // Single word - check in tokens
      if (tokens.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
        score += 1;
      }
    }
  }

  // Find best matching industry group
  let bestGroup: GICSIndustryGroup | null = null;
  let bestGroupScore = 0;

  for (const group of sector.industryGroups) {
    let groupScore = 0;

    // Check industry group keywords
    for (const keyword of group.keywords) {
      if (keyword.includes(" ")) {
        if (containsPhrase(normalizedDesc, keyword)) {
          groupScore += 2;
        }
      } else if (tokens.includes(keyword.toLowerCase())) {
        groupScore += 1;
      }
    }

    // Check sub-industry keywords
    for (const subIndustry of group.subIndustries) {
      for (const keyword of subIndustry.keywords) {
        if (keyword.includes(" ")) {
          if (containsPhrase(normalizedDesc, keyword)) {
            groupScore += 1.5;
            if (!matchedKeywords.includes(keyword)) {
              matchedKeywords.push(keyword);
            }
          }
        } else if (tokens.includes(keyword.toLowerCase())) {
          groupScore += 0.75;
          if (!matchedKeywords.includes(keyword)) {
            matchedKeywords.push(keyword);
          }
        }
      }
    }

    if (groupScore > bestGroupScore) {
      bestGroupScore = groupScore;
      bestGroup = group;
    }
  }

  score += bestGroupScore;

  return {
    sector,
    industryGroup: bestGroup,
    keywords: matchedKeywords,
    score,
  };
}

/**
 * Classify a business description into GICS sector/industry
 */
export function classifyIndustry(description: string): ClassificationResult {
  if (!description || description.trim() === "" || description === "Unknown") {
    return {
      sector: "Unclassified",
      industryGroup: "Unknown",
      confidence: "low",
      matchedKeywords: [],
      score: 0,
    };
  }

  // Check manual overrides first
  const override = applyOverride(description);
  if (override) {
    return {
      sector: override.sector,
      industryGroup: override.industryGroup,
      confidence: override.confidence,
      matchedKeywords: ["[manual override]"],
      score: 10,
    };
  }

  // Score against all sectors
  const scores: SectorScore[] = GICS_SECTORS.map((sector) => scoreSector(description, sector));

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  const bestMatch = scores[0];
  const secondBest = scores[1];

  // No matches found
  if (bestMatch.score === 0) {
    return {
      sector: "Unclassified",
      industryGroup: "Unknown",
      confidence: "low",
      matchedKeywords: [],
      score: 0,
    };
  }

  // Determine confidence based on score and margin over second best
  let confidence: "high" | "medium" | "low";
  const margin = secondBest ? bestMatch.score - secondBest.score : bestMatch.score;

  if (bestMatch.score >= 4 && margin >= 2) {
    confidence = "high";
  } else if (bestMatch.score >= 2 || (bestMatch.score >= 1 && margin >= 1)) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  return {
    sector: bestMatch.sector.name,
    industryGroup: bestMatch.industryGroup?.name || "General",
    confidence,
    matchedKeywords: bestMatch.keywords,
    score: bestMatch.score,
  };
}

/**
 * Batch classify multiple descriptions
 */
export function classifyIndustries(descriptions: string[]): Map<string, ClassificationResult> {
  const results = new Map<string, ClassificationResult>();

  for (const desc of descriptions) {
    if (!results.has(desc)) {
      results.set(desc, classifyIndustry(desc));
    }
  }

  return results;
}
