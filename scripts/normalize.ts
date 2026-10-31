/**
 * ETL Normalization Pipeline
 * Enriches raw EDGAR data with:
 * - GICS industry classification
 * - Normalized borrower names
 * - Data quality scores
 */

import * as fs from "fs";
import * as path from "path";
import { classifyIndustry, type ClassificationResult } from "./lib/classify-industry";
import {
  normalizeBorrowerName,
  groupSimilarBorrowers,
  type BorrowerGroup,
} from "./lib/normalize-borrower";

// Invalid borrower names to filter out (security types, balance sheet items, etc.)
const INVALID_BORROWER_PATTERNS = new Set([
  "unsecured debt",
  "secured loan",
  "secured debt",
  "unsecured loan",
  "derivative instrument",
  "derivative instruments",
  "derivatives designated as hedges",
  "derivatives not designated as hedges",
  "equipment financing",
  "asset based finance",
  "other assets",
  "other liabilities",
  "deferred tax liabilities",
  "accounts payable",
  "business services",
  "consumer services",
  "financial services",
  "healthcare services",
  "company",
  "united states",
  "united kingdom",
  "unknown",
]);

const INVALID_BORROWER_REGEX = [
  /^\d+\.\d+%\s+(unsecured|secured)/i, // "7.75% Unsecured Notes"
  /^(1st|2nd|first|second)\s+lien/i, // Investment type headers
  /funding facility$/i, // "BNP Funding Facility"
  /^(net|total|sub-?total)\s/i, // Totals
  /\s(in|out)\s+of\s+level/i, // Fair value hierarchy
  /^transfers\s+(in|out)/i, // Transfer rows
  /assets?\s+\(\$\s+in/i, // "Assets ($ in millions)"
  /^(short|long)[\s-]term\s+unsecured/i, // "Short-term unsecured debt"
  /unitranche\s+secured\s+loans/i, // Security type
  /^unsecured\s+(debt|loan|notes)/i, // Security types
];

function isInvalidBorrower(name: string): boolean {
  const lowerName = name.toLowerCase().trim();
  if (INVALID_BORROWER_PATTERNS.has(lowerName)) return true;
  if (INVALID_BORROWER_REGEX.some((pattern) => pattern.test(name))) return true;
  return false;
}

// Input/output types
interface RawHolding {
  borrower: string;
  industry: string;
  investmentType: string;
  rate: number | null;
  maturity: string;
  principal: number;
  fairValue: number;
}

interface RawFund {
  ticker: string;
  cik: string;
  name: string;
  filingDate: string;
  holdings: RawHolding[];
  totalFairValue: number;
  totalPrincipal: number;
}

interface DataQuality {
  hasIndustry: boolean;
  hasRate: boolean;
  hasMaturity: boolean;
  hasValidPrincipal: boolean;
  hasValidFairValue: boolean;
  overallScore: number;
}

interface EnrichedHolding extends RawHolding {
  // Enriched fields
  normalizedBorrower: string;
  gicsSector: string;
  gicsIndustryGroup: string;
  industryConfidence: "high" | "medium" | "low";
  industryMatchedKeywords: string[];
  dataQuality: DataQuality;
}

interface FundDataQuality {
  totalHoldings: number;
  validHoldings: number;
  industryClassified: number;
  industryHighConfidence: number;
  industryMediumConfidence: number;
  industryLowConfidence: number;
  withRates: number;
  withMaturities: number;
  overallScore: number;
}

interface EnrichedFund extends Omit<RawFund, "holdings"> {
  holdings: EnrichedHolding[];
  dataQuality: FundDataQuality;
}

interface NormalizationReport {
  timestamp: string;
  inputFile: string;
  outputFile: string;
  totalFunds: number;
  totalHoldingsRaw: number;
  totalHoldingsEnriched: number;
  industryClassification: {
    classified: number;
    unclassified: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    topSectors: { sector: string; count: number }[];
  };
  borrowerNormalization: {
    uniqueRaw: number;
    uniqueNormalized: number;
    potentialDuplicates: number;
    duplicateGroups: BorrowerGroup[];
  };
  perFundQuality: { ticker: string; score: number; holdings: number }[];
}

/**
 * Calculate data quality score for a holding
 */
function calculateHoldingQuality(holding: RawHolding): DataQuality {
  const hasIndustry =
    !!holding.industry && holding.industry !== "Unknown" && holding.industry.trim() !== "";

  const hasRate = holding.rate !== null && holding.rate > 0;

  const hasMaturity =
    !!holding.maturity && holding.maturity !== "N/A" && holding.maturity.trim() !== "";

  const hasValidPrincipal = holding.principal > 0;
  const hasValidFairValue = holding.fairValue > 0;

  // Weight: industry (30%), rate (25%), maturity (20%), principal (15%), fairValue (10%)
  const score =
    (hasIndustry ? 30 : 0) +
    (hasRate ? 25 : 0) +
    (hasMaturity ? 20 : 0) +
    (hasValidPrincipal ? 15 : 0) +
    (hasValidFairValue ? 10 : 0);

  return {
    hasIndustry,
    hasRate,
    hasMaturity,
    hasValidPrincipal,
    hasValidFairValue,
    overallScore: score,
  };
}

/**
 * Calculate aggregate data quality for a fund
 */
function calculateFundQuality(holdings: EnrichedHolding[]): FundDataQuality {
  const validHoldings = holdings.filter(
    (h) => h.dataQuality.hasValidPrincipal && h.dataQuality.hasValidFairValue
  );

  const industryClassified = holdings.filter((h) => h.gicsSector !== "Unclassified").length;

  const industryHighConfidence = holdings.filter((h) => h.industryConfidence === "high").length;

  const industryMediumConfidence = holdings.filter((h) => h.industryConfidence === "medium").length;

  const industryLowConfidence = holdings.filter((h) => h.industryConfidence === "low").length;

  const withRates = holdings.filter((h) => h.dataQuality.hasRate).length;
  const withMaturities = holdings.filter((h) => h.dataQuality.hasMaturity).length;

  // Calculate overall fund quality score
  const totalHoldings = holdings.length;
  const avgHoldingScore =
    totalHoldings > 0
      ? holdings.reduce((sum, h) => sum + h.dataQuality.overallScore, 0) / totalHoldings
      : 0;

  const classificationRate = totalHoldings > 0 ? industryClassified / totalHoldings : 0;

  // Overall score: 50% avg holding score + 50% classification rate
  const overallScore = Math.round(avgHoldingScore * 0.5 + classificationRate * 50);

  return {
    totalHoldings,
    validHoldings: validHoldings.length,
    industryClassified,
    industryHighConfidence,
    industryMediumConfidence,
    industryLowConfidence,
    withRates,
    withMaturities,
    overallScore,
  };
}

/**
 * Enrich a single holding with classification and normalization
 */
function enrichHolding(
  holding: RawHolding,
  classificationCache: Map<string, ClassificationResult>
): EnrichedHolding {
  // Get or compute classification
  let classification = classificationCache.get(holding.industry);
  if (!classification) {
    classification = classifyIndustry(holding.industry);
    classificationCache.set(holding.industry, classification);
  }

  // Normalize borrower name
  const normalizedBorrower = normalizeBorrowerName(holding.borrower);

  // Calculate data quality
  const dataQuality = calculateHoldingQuality(holding);

  return {
    ...holding,
    normalizedBorrower,
    gicsSector: classification.sector,
    gicsIndustryGroup: classification.industryGroup,
    industryConfidence: classification.confidence,
    industryMatchedKeywords: classification.matchedKeywords,
    dataQuality,
  };
}

/**
 * Main normalization function
 */
async function normalize(): Promise<void> {
  const inputPath = path.join(process.cwd(), "src", "data", "edgar-data.json");
  const outputPath = path.join(process.cwd(), "src", "data", "funds-normalized.json");
  const reportPath = path.join(process.cwd(), "src", "data", "normalization-report.json");

  console.log("Loading raw EDGAR data...");
  const rawData: RawFund[] = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  console.log(
    `Found ${rawData.length} funds with ${rawData.reduce((sum, f) => sum + f.holdings.length, 0)} total holdings\n`
  );

  // Classification cache for deduplication
  const classificationCache = new Map<string, ClassificationResult>();

  // Track all borrower names for duplicate detection
  const allBorrowerNames: string[] = [];

  // Track filtered holdings for reporting
  let filteredCount = 0;

  // Enrich each fund
  const enrichedFunds: EnrichedFund[] = rawData.map((fund) => {
    console.log(`Processing ${fund.ticker}...`);

    // Filter out invalid borrower names (security types, balance sheet items, etc.)
    const validHoldings = fund.holdings.filter((h) => {
      if (isInvalidBorrower(h.borrower)) {
        filteredCount++;
        return false;
      }
      return true;
    });

    const enrichedHoldings = validHoldings.map((h) => {
      allBorrowerNames.push(h.borrower);
      return enrichHolding(h, classificationCache);
    });

    const dataQuality = calculateFundQuality(enrichedHoldings);

    console.log(
      `  ${fund.ticker}: ${enrichedHoldings.length} holdings (${fund.holdings.length - enrichedHoldings.length} filtered)`
    );

    return {
      ...fund,
      holdings: enrichedHoldings,
      dataQuality,
    };
  });

  console.log(`\nFiltered out ${filteredCount} invalid borrower entries total.`);

  // Detect potential duplicate borrowers
  console.log("\nAnalyzing borrower name variations...");
  const uniqueRawNames = [...new Set(allBorrowerNames)];
  const uniqueNormalizedNames = [...new Set(uniqueRawNames.map(normalizeBorrowerName))];
  const duplicateGroups = groupSimilarBorrowers(uniqueRawNames, 0.88);

  // Generate report
  const sectorCounts = new Map<string, number>();
  let totalClassified = 0;
  let totalUnclassified = 0;
  let highConfidence = 0;
  let mediumConfidence = 0;
  let lowConfidence = 0;

  for (const fund of enrichedFunds) {
    for (const holding of fund.holdings) {
      if (holding.gicsSector === "Unclassified") {
        totalUnclassified++;
      } else {
        totalClassified++;
        sectorCounts.set(holding.gicsSector, (sectorCounts.get(holding.gicsSector) || 0) + 1);
      }

      switch (holding.industryConfidence) {
        case "high":
          highConfidence++;
          break;
        case "medium":
          mediumConfidence++;
          break;
        case "low":
          lowConfidence++;
          break;
      }
    }
  }

  const topSectors = [...sectorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([sector, count]) => ({ sector, count }));

  const report: NormalizationReport = {
    timestamp: new Date().toISOString(),
    inputFile: inputPath,
    outputFile: outputPath,
    totalFunds: enrichedFunds.length,
    totalHoldingsRaw: allBorrowerNames.length,
    totalHoldingsEnriched: enrichedFunds.reduce((sum, f) => sum + f.holdings.length, 0),
    industryClassification: {
      classified: totalClassified,
      unclassified: totalUnclassified,
      highConfidence,
      mediumConfidence,
      lowConfidence,
      topSectors,
    },
    borrowerNormalization: {
      uniqueRaw: uniqueRawNames.length,
      uniqueNormalized: uniqueNormalizedNames.length,
      potentialDuplicates: duplicateGroups.length,
      duplicateGroups: duplicateGroups.slice(0, 20), // Top 20 groups
    },
    perFundQuality: enrichedFunds.map((f) => ({
      ticker: f.ticker,
      score: f.dataQuality.overallScore,
      holdings: f.holdings.length,
    })),
  };

  // Save outputs
  console.log("\nSaving normalized data...");
  fs.writeFileSync(outputPath, JSON.stringify(enrichedFunds, null, 2));
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("NORMALIZATION REPORT");
  console.log("=".repeat(60));

  console.log("\nINDUSTRY CLASSIFICATION:");
  console.log(
    `  Classified:   ${totalClassified} (${((totalClassified / (totalClassified + totalUnclassified)) * 100).toFixed(1)}%)`
  );
  console.log(`  Unclassified: ${totalUnclassified}`);
  console.log(`  High confidence:   ${highConfidence}`);
  console.log(`  Medium confidence: ${mediumConfidence}`);
  console.log(`  Low confidence:    ${lowConfidence}`);

  console.log("\nTOP SECTORS:");
  topSectors.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.sector}: ${s.count}`);
  });

  console.log("\nBORROWER NORMALIZATION:");
  console.log(`  Unique raw names:        ${uniqueRawNames.length}`);
  console.log(`  Unique normalized names: ${uniqueNormalizedNames.length}`);
  console.log(
    `  Reduction:               ${uniqueRawNames.length - uniqueNormalizedNames.length} (${(((uniqueRawNames.length - uniqueNormalizedNames.length) / uniqueRawNames.length) * 100).toFixed(1)}%)`
  );
  console.log(`  Potential duplicate groups: ${duplicateGroups.length}`);

  if (duplicateGroups.length > 0) {
    console.log("\n  Sample duplicate groups:");
    duplicateGroups.slice(0, 5).forEach((g) => {
      console.log(`    "${g.canonicalName}" (${g.count} variations)`);
      g.aliases.slice(0, 3).forEach((a) => console.log(`      - ${a}`));
    });
  }

  console.log("\nPER-FUND DATA QUALITY:");
  report.perFundQuality
    .sort((a, b) => b.score - a.score)
    .forEach((f) => {
      const bar = "█".repeat(Math.floor(f.score / 5)) + "░".repeat(20 - Math.floor(f.score / 5));
      console.log(`  ${f.ticker.padEnd(6)} [${bar}] ${f.score}% (${f.holdings} holdings)`);
    });

  console.log("\n" + "=".repeat(60));
  console.log(`Output: ${outputPath}`);
  console.log(`Report: ${reportPath}`);
}

normalize().catch(console.error);
