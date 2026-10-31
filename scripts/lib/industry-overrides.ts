/**
 * Manual industry classification overrides
 *
 * Edit this file to manually classify industries that the keyword matcher misses.
 * These take precedence over the automatic classification.
 *
 * Format:
 *   "description pattern": { sector: "GICS Sector", industryGroup: "Industry Group" }
 *
 * The pattern is matched case-insensitively and can be:
 *   - Exact match: "Business Services"
 *   - Partial match: descriptions containing the pattern will match
 */

export interface IndustryOverride {
  sector: string;
  industryGroup: string;
  confidence: "high" | "medium";
}

// Exact description overrides (case-insensitive)
export const EXACT_OVERRIDES: Record<string, IndustryOverride> = {
  // Business/Professional Services
  "business services": {
    sector: "Industrials",
    industryGroup: "Commercial & Professional Services",
    confidence: "high",
  },
  "diversified support services": {
    sector: "Industrials",
    industryGroup: "Commercial & Professional Services",
    confidence: "high",
  },
  "human resource & employment services": {
    sector: "Industrials",
    industryGroup: "Commercial & Professional Services",
    confidence: "high",
  },
  "executive search services": {
    sector: "Industrials",
    industryGroup: "Commercial & Professional Services",
    confidence: "high",
  },
  "office services & supplies": {
    sector: "Industrials",
    industryGroup: "Commercial & Professional Services",
    confidence: "medium",
  },
  "security & alarm services": {
    sector: "Industrials",
    industryGroup: "Commercial & Professional Services",
    confidence: "high",
  },

  // Technology/IT Services
  "computer systems design services": {
    sector: "Information Technology",
    industryGroup: "Software & Services",
    confidence: "high",
  },
  "data processing & outsourced services": {
    sector: "Information Technology",
    industryGroup: "Software & Services",
    confidence: "high",
  },
  "data processing, hosting, and related services": {
    sector: "Information Technology",
    industryGroup: "Software & Services",
    confidence: "high",
  },
  "data processing, hosting, andrelated services": {
    sector: "Information Technology",
    industryGroup: "Software & Services",
    confidence: "high",
  },

  // Telecom
  "diversified telecommunication services": {
    sector: "Communication Services",
    industryGroup: "Telecommunication Services",
    confidence: "high",
  },

  // Healthcare
  "services for the elderly and persons with disabilities": {
    sector: "Health Care",
    industryGroup: "Health Care Equipment & Services",
    confidence: "high",
  },
  "biotechnology company": {
    sector: "Health Care",
    industryGroup: "Pharmaceuticals & Biotechnology",
    confidence: "high",
  },

  // Consumer
  "swim lessons provider": {
    sector: "Consumer Discretionary",
    industryGroup: "Consumer Services",
    confidence: "medium",
  },
  "charter airline services": {
    sector: "Industrials",
    industryGroup: "Transportation",
    confidence: "high",
  },

  // Manufacturing
  "flashlights manufacturer": {
    sector: "Industrials",
    industryGroup: "Capital Goods",
    confidence: "medium",
  },
  "automobile manufacturers": {
    sector: "Consumer Discretionary",
    industryGroup: "Consumer Durables & Apparel",
    confidence: "high",
  },

  // Real Estate
  "architectural services": {
    sector: "Industrials",
    industryGroup: "Capital Goods",
    confidence: "medium",
  },
};

// Keyword-based overrides (if description contains this keyword)
export const KEYWORD_OVERRIDES: Record<string, IndustryOverride> = {
  // Wealth/Financial
  "wealth management": {
    sector: "Financials",
    industryGroup: "Financial Services",
    confidence: "high",
  },
  "revenue cycle management": {
    sector: "Health Care",
    industryGroup: "Health Care Equipment & Services",
    confidence: "high",
  },
  cybersecurity: {
    sector: "Information Technology",
    industryGroup: "Software & Services",
    confidence: "high",
  },
  ecommerce: {
    sector: "Consumer Discretionary",
    industryGroup: "Retailing",
    confidence: "high",
  },
  "e-commerce": {
    sector: "Consumer Discretionary",
    industryGroup: "Retailing",
    confidence: "high",
  },
  "fire safety": {
    sector: "Industrials",
    industryGroup: "Commercial & Professional Services",
    confidence: "medium",
  },
  "life safety": {
    sector: "Industrials",
    industryGroup: "Commercial & Professional Services",
    confidence: "medium",
  },
  vending: {
    sector: "Consumer Discretionary",
    industryGroup: "Consumer Services",
    confidence: "medium",
  },
  "micro market": {
    sector: "Consumer Discretionary",
    industryGroup: "Consumer Services",
    confidence: "medium",
  },
  "internet managed service": {
    sector: "Communication Services",
    industryGroup: "Telecommunication Services",
    confidence: "high",
  },
  "fuel provider": {
    sector: "Energy",
    industryGroup: "Energy",
    confidence: "high",
  },
  "material handling": {
    sector: "Industrials",
    industryGroup: "Capital Goods",
    confidence: "high",
  },
  tableware: {
    sector: "Consumer Discretionary",
    industryGroup: "Consumer Durables & Apparel",
    confidence: "medium",
  },
};

/**
 * Apply manual overrides to an industry description
 * Returns null if no override matches
 */
export function applyOverride(description: string): IndustryOverride | null {
  if (!description || description === "Unknown") {
    return null;
  }

  const normalized = description.toLowerCase().trim();

  // Check exact matches first
  if (EXACT_OVERRIDES[normalized]) {
    return EXACT_OVERRIDES[normalized];
  }

  // Check keyword matches
  for (const [keyword, override] of Object.entries(KEYWORD_OVERRIDES)) {
    if (normalized.includes(keyword.toLowerCase())) {
      return override;
    }
  }

  return null;
}
