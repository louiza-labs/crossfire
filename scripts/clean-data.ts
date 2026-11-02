/**
 * Clean and filter EDGAR data to only include actual portfolio company holdings
 */

import * as fs from "fs";
import * as path from "path";

interface DataQuality {
  hasIndustry: boolean;
  hasRate: boolean;
  hasMaturity: boolean;
  hasValidPrincipal: boolean;
  hasValidFairValue: boolean;
  overallScore: number;
}

interface RawHolding {
  borrower: string;
  industry: string;
  investmentType: string;
  rate: number | null;
  maturity: string;
  principal: number;
  fairValue: number;
  // Enriched fields from normalize.ts
  normalizedBorrower?: string;
  gicsSector?: string;
  gicsIndustryGroup?: string;
  industryConfidence?: "high" | "medium" | "low";
  industryMatchedKeywords?: string[];
  dataQuality?: DataQuality;
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

// Patterns that indicate this is NOT a real company holding
const NON_COMPANY_PATTERNS = [
  /^net\s/i,
  /^total\s/i,
  /^sub-?total/i,
  /^grade\s?\d/i,
  /^equity$/i,
  /^cash\s/i,
  /^cash$/i,
  /^other\s/i,
  /^interest\s/i,
  /^restricted\s/i,
  /^accrued\s/i,
  /^preferred\s/i,
  /^first\slien/i,
  /^second\slien/i,
  /^third\s(out\s)?/i,
  /^super\spriority/i,
  /^incremental\s/i,
  /^senior\s/i,
  /^subordinated/i,
  /term\sloan\s*(a|b|to)/i, // "Term Loan A to...", "Term Loan B"
  /^number\sof/i,
  /^investment\scommitment/i,
  /^unfunded/i,
  /^deferred/i,
  /^prepaid/i,
  /^receivable/i,
  /^payable/i,
  /^assets$/i,
  /^liabilities$/i,
  /^\(\d+\)/, // Footnote references
  /^note\s/i,
  /^see\s/i,
  /^the\scompany/i,
  /^weighted\saverage/i,
  /^fair\svalue/i,
  /^cost$/i,
  /^amortized/i,
  /^par\svalue/i,
  /^percentage/i,
  /^as\sof/i,
  /^for\sthe/i,
  /^\d+\.?\d*%?$/, // Just numbers
  /^[\$\-\,\.\(\)]+$/, // Just currency symbols
  // Balance sheet line items
  /cash\s*(and\s*)?cash\s*equivalents/i,
  /accounts\s*(payable|receivable)/i,
  /accumulated\s/i,
  /undistributed\s/i,
  /earnings/i,
  /liabilities$/i,
  /^debt$/i,
  /^due\s(to|from)/i,
  /stockholders/i,
  /shareholders/i,
  /common\sstock/i,
  /additional\spaid/i,
  /retained\s/i,
  /treasury\s/i,
  /^distributions/i,
  /dividend/i,
  // Industry names that got misidentified as companies
  /^software$/i,
  /^healthcare$/i,
  /^technology$/i,
  /^biotechnology$/i,
  /^financials?$/i,
  /^industrials?$/i,
  /^materials?$/i,
  /^energy$/i,
  /^utilities$/i,
  /^real\sestate$/i,
  /^consumer$/i,
  /^communication/i,
  /^luxembourg$/i,
  /^united\s(states|kingdom)/i,
  /^ireland$/i,
  /^netherlands$/i,
  /^cayman\sislands/i,
  // Financial instruments and derivatives
  /^(foreign\s+)?currency\s+(forward|swap|hedge)/i,
  /^interest\s+rate\s+(swap|cap|floor|collar)/i,
  /^credit\s+(default\s+)?swap/i,
  /^(total\s+)?return\s+swap/i,
  /forward\s+contract/i,
  /^derivative/i,
  // Industry subcategory formats with colons
  /^transportation:\s/i,
  /^technology:\s/i,
  /^healthcare:\s/i,
  /^energy:\s/i,
  /^consumer:\s/i,
  /^industrials:\s/i,
  /^financials:\s/i,
  /^materials:\s/i,
  /^utilities:\s/i,
  /^real\s+estate:\s/i,
  /^communication\s+services:\s/i,
  /^media:\s/i,
  // Asset categories / Multi-sector
  /^multi-?sector/i,
  /^diversified\s+(holdings|investments)/i,
  /^(other|miscellaneous)\s+(holdings|investments|assets)/i,
  // GICS industry names (full)
  /^trading\s+companies\s*(&|and)?\s*distributors$/i,
  /^textiles,?\s+apparel\s*(&|and)?\s*luxury\s*goods$/i,
  /^life\s+sciences\s+tools\s*(&|and)?\s*services$/i,
  /^health\s+care\s+(equipment|providers)\s*(&|and)?\s*(supplies|services)$/i,
  /^air\s+freight\s*&?\s*logistics$/i,
  /^construction\s*&?\s*(engineering|building|materials)$/i,
  /^(road\s*&?\s*rail|marine|airlines)$/i,
  /^(containers\s*&?\s*packaging)$/i,
  /^(aerospace\s*&?\s*defense)$/i,
  /^(leisure\s+products)$/i,
  /^(personal\s+products)$/i,
  /^(household\s+(durables|products))$/i,
  /^(building\s+products)$/i,
  /^(electrical\s+equipment)$/i,
  /^(electronic\s+equipment)/i,
  /^(commercial\s+services)/i,
  /^(professional\s+services)$/i,
  /^(capital\s+goods)$/i,
  /^(trading\s+companies)/i,
  /^(food\s+(&|and)\s+staples)/i,
  /^(auto\s+components)$/i,
  /^(hotels,?\s+restaurants)/i,
  /^(specialty\s+retail)$/i,
  /^(multiline\s+retail)$/i,
  /^(consumer\s+finance)$/i,
  /^(diversified\s+financial)/i,
  /^(real\s+estate\s+management)/i,
  /^(oil,?\s+gas)/i,
  /^(metals\s*&?\s*mining)$/i,
  /^(paper\s*&?\s*forest)/i,
  /^(independent\s+power)/i,
  /^(software\s*&?\s*services)$/i,
  /^it\s+services$/i,
  /^internet\s+(software|&|and)/i,
];

// Patterns that strongly indicate this IS a real company
const COMPANY_PATTERNS = [
  /,?\s*(inc\.?|llc|corp\.?|ltd\.?|lp|holdings?|partners?|group|co\.?)$/i,
  /\s(software|technologies?|solutions?|services?|systems?|capital|health|medical|financial|media|digital)$/i,
];

function isLikelyCompany(name: string): boolean {
  const trimmed = name.trim();

  // Check non-company patterns first
  for (const pattern of NON_COMPANY_PATTERNS) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }

  // Check company patterns
  for (const pattern of COMPANY_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }

  // If name is long enough and contains mostly letters, probably a company
  if (trimmed.length >= 10 && /^[A-Za-z][A-Za-z\s\.\,\-\&\(\)\']+$/.test(trimmed)) {
    return true;
  }

  return false;
}

function cleanIndustry(industry: string): string {
  // Remove dollar signs, numbers-only values
  if (/^[\$\d\,\.\-\(\)]+$/.test(industry)) {
    return "Unknown";
  }
  return industry.trim() || "Unknown";
}

function main() {
  // Use normalized data if available, fallback to raw edgar data
  const normalizedPath = path.join(process.cwd(), "src", "data", "funds-normalized.json");
  const rawPath = path.join(process.cwd(), "src", "data", "edgar-data.json");
  const inputPath = fs.existsSync(normalizedPath) ? normalizedPath : rawPath;
  const outputPath = path.join(process.cwd(), "src", "data", "funds.json");

  console.log(`Using input: ${inputPath}`);

  const rawData: RawFund[] = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  const cleanedFunds = rawData
    .filter((fund) => fund.totalFairValue > 0) // Filter funds with negative fair values
    .map((fund) => {
      const cleanedHoldings = fund.holdings
        .filter((h) => isLikelyCompany(h.borrower))
        .filter((h) => h.fairValue > 0 && h.fairValue < 5000) // Reasonable range: $0-5B per holding
        .filter((h) => h.principal > 0)
        // Rate is nice to have but not required - many equity positions don't have rates
        .map((h) => ({
          ...h,
          // Use GICS sector if available, otherwise clean raw industry
          industry:
            h.gicsSector && h.gicsSector !== "Unclassified"
              ? h.gicsSector
              : cleanIndustry(h.industry),
          // Use normalized borrower if available, otherwise do basic cleanup
          borrower:
            h.normalizedBorrower ||
            h.borrower
              .replace(/\s+/g, " ")
              .trim()
              .replace(/,?\s*(Inc\.?|LLC|Corp\.?|Ltd\.?|L\.?P\.?)$/i, "")
              .trim(),
          // Preserve enriched fields
          gicsSector: h.gicsSector,
          gicsIndustryGroup: h.gicsIndustryGroup,
          industryConfidence: h.industryConfidence,
          dataQualityScore: h.dataQuality?.overallScore,
        }));

      // Deduplicate by normalized borrower name
      const uniqueHoldings = Array.from(
        new Map(cleanedHoldings.map((h) => [h.borrower.toLowerCase(), h])).values()
      );

      return {
        ...fund,
        holdings: uniqueHoldings,
        totalFairValue: uniqueHoldings.reduce((sum, h) => sum + h.fairValue, 0),
        totalPrincipal: uniqueHoldings.reduce((sum, h) => sum + h.principal, 0),
      };
    })
    .filter((fund) => fund.holdings.length >= 5); // Require at least 5 holdings (more lenient to capture more funds)

  fs.writeFileSync(outputPath, JSON.stringify(cleanedFunds, null, 2));

  console.log("Cleaned Data Summary:");
  console.log("=====================");

  for (const fund of cleanedFunds) {
    console.log(`\n${fund.ticker} (${fund.name}):`);
    console.log(`  Holdings: ${fund.holdings.length}`);
    console.log(`  Fair Value: $${fund.totalFairValue.toFixed(0)}M`);
    console.log(`  Sample holdings:`);
    fund.holdings.slice(0, 5).forEach((h) => {
      console.log(`    - ${h.borrower} ($${h.fairValue}M)`);
    });
  }

  // Find shared borrowers
  const borrowerFundMap = new Map<string, { funds: string[]; totalExposure: number }>();

  for (const fund of cleanedFunds) {
    for (const holding of fund.holdings) {
      const key = holding.borrower.toLowerCase();
      const current = borrowerFundMap.get(key) || { funds: [], totalExposure: 0 };
      if (!current.funds.includes(fund.ticker)) {
        current.funds.push(fund.ticker);
      }
      current.totalExposure += holding.fairValue;
      borrowerFundMap.set(key, current);
    }
  }

  const sharedBorrowers = Array.from(borrowerFundMap.entries())
    .filter(([_, data]) => data.funds.length > 1)
    .sort((a, b) => b[1].funds.length - a[1].funds.length);

  console.log(`\n\nShared Borrowers (${sharedBorrowers.length}):`);
  console.log("===================");
  sharedBorrowers.slice(0, 15).forEach(([borrower, data]) => {
    console.log(`  ${borrower}: ${data.funds.join(", ")} ($${data.totalExposure.toFixed(0)}M)`);
  });
}

main();
