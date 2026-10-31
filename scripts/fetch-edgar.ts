/**
 * SEC EDGAR Data Fetcher
 * Fetches 10-Q/10-K filings and parses Schedule of Investments for BDCs
 * Supports multiple table formats used by different BDCs
 */

import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

const USER_AGENT = "Capital Research contact@capital.dev";

// Comprehensive list of all 47 publicly traded BDCs with corrected CIK numbers
const BDCS = [
  // Tier 1 - Largest BDCs by AUM (>$10B)
  { ticker: "ARCC", cik: "1287750", name: "Ares Capital Corp" },
  { ticker: "BXSL", cik: "1736035", name: "Blackstone Secured Lending Fund" },
  { ticker: "FSK", cik: "1422183", name: "FS KKR Capital Corp" },
  { ticker: "OBDC", cik: "1796209", name: "Blue Owl Capital Corp" },
  { ticker: "MAIN", cik: "1396440", name: "Main Street Capital Corp" },
  { ticker: "GBDC", cik: "1476765", name: "Golub Capital BDC Inc" },
  { ticker: "HTGC", cik: "1280784", name: "Hercules Capital Inc" },
  { ticker: "PSEC", cik: "1287032", name: "Prospect Capital Corp" },

  // Tier 2 - Large BDCs ($5-10B)
  { ticker: "TSLX", cik: "1508655", name: "Sixth Street Specialty Lending" },
  { ticker: "OCSL", cik: "1414932", name: "Oaktree Specialty Lending Corp" },
  { ticker: "NMFC", cik: "1496099", name: "New Mountain Finance Corp" },
  { ticker: "ORCC", cik: "1655050", name: "Owl Rock Capital Corp" },
  { ticker: "GSBD", cik: "1572694", name: "Goldman Sachs BDC Inc" },
  { ticker: "BBDC", cik: "1379785", name: "Barings BDC Inc" },
  { ticker: "BCSF", cik: "1655888", name: "Bain Capital Specialty Finance" },

  // Tier 3 - Mid-size BDCs ($2-5B)
  { ticker: "TRIN", cik: "1786108", name: "Trinity Capital Inc" },
  { ticker: "CSWC", cik: "17313", name: "Capital Southwest Corp" },
  { ticker: "TCPC", cik: "1527166", name: "BlackRock TCP Capital Corp" },
  { ticker: "CGBD", cik: "1655888", name: "Carlyle Secured Lending Inc" },
  { ticker: "PNNT", cik: "1412093", name: "PennantPark Investment Corp" },
  { ticker: "PFLT", cik: "1418076", name: "PennantPark Floating Rate Capital" },
  { ticker: "MFIC", cik: "1467858", name: "MidCap Financial Investment Corp" },
  { ticker: "FDUS", cik: "1487918", name: "Fidus Investment Corp" },
  { ticker: "TPVG", cik: "1580345", name: "TriplePoint Venture Growth BDC" },
  { ticker: "SLRC", cik: "1418091", name: "SLR Investment Corp" },

  // Tier 4 - Smaller BDCs ($1-2B)
  { ticker: "CCAP", cik: "1785173", name: "Crescent Capital BDC Inc" },
  { ticker: "HRZN", cik: "1487428", name: "Horizon Technology Finance" },
  { ticker: "WHF", cik: "1408710", name: "WhiteHorse Finance Inc" },
  { ticker: "GLAD", cik: "1143513", name: "Gladstone Capital Corp" },
  { ticker: "GAIN", cik: "1278752", name: "Gladstone Investment Corp" },
  { ticker: "SCM", cik: "1421517", name: "Stellus Capital Investment Corp" },
  { ticker: "SAR", cik: "1377936", name: "Saratoga Investment Corp" },
  { ticker: "NEWT", cik: "1587987", name: "Newtek Business Services Corp" },
  { ticker: "CION", cik: "1498380", name: "CION Investment Corp" },
  { ticker: "RWAY", cik: "1811414", name: "Runway Growth Finance Corp" },

  // Tier 5 - Smaller/Specialty BDCs (<$1B)
  { ticker: "MRCC", cik: "1512931", name: "Monroe Capital Corp" },
  { ticker: "OXSQ", cik: "1259429", name: "Oxford Square Capital Corp" },
  { ticker: "OFS", cik: "1531152", name: "OFS Capital Corp" },
  { ticker: "GECC", cik: "1651750", name: "Great Elm Capital Corp" },
  { ticker: "PFX", cik: "1457543", name: "PhenixFin Corp" },
  { ticker: "RAND", cik: "844630", name: "Rand Capital Corp" },
  { ticker: "LIEN", cik: "1843162", name: "Chicago Atlantic BDC Inc" },
  { ticker: "KBDC", cik: "1899123", name: "Kayne Anderson BDC Inc" },
  { ticker: "NCDL", cik: "1846017", name: "Nuveen Churchill Direct Lending" },
  { ticker: "MSDL", cik: "1959829", name: "Morgan Stanley Direct Lending Fund" },
  { ticker: "PSBD", cik: "1912582", name: "Palmer Square Capital BDC Inc" },
  { ticker: "ICMB", cik: "1722438", name: "Investcorp Credit Management BDC" },
];

interface Filing {
  accessionNumber: string;
  filingDate: string;
  form: string;
  primaryDocument: string;
  documents: { type: string; document: string }[];
}

interface Holding {
  borrower: string;
  industry: string;
  investmentType: string;
  rate: number | null;
  maturity: string;
  principal: number;
  fairValue: number;
}

interface FundData {
  ticker: string;
  cik: string;
  name: string;
  filingDate: string;
  holdings: Holding[];
  totalFairValue: number;
  totalPrincipal: number;
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
      });
      if (response.ok) return response;
      if (response.status === 429) {
        await sleep(2000 * (i + 1));
        continue;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(1000);
    }
  }
  throw new Error("Max retries exceeded");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getLatestFiling(
  cik: string,
  formTypes: string[] = ["10-Q", "10-K"]
): Promise<Filing | null> {
  const paddedCik = cik.padStart(10, "0");
  const url = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;

  console.log(`  Fetching submissions for CIK ${cik}...`);
  const response = await fetchWithRetry(url);
  const data = await response.json();

  const filings = data.filings?.recent;
  if (!filings) return null;

  for (let i = 0; i < filings.form.length; i++) {
    if (formTypes.includes(filings.form[i])) {
      return {
        accessionNumber: filings.accessionNumber[i],
        filingDate: filings.filingDate[i],
        form: filings.form[i],
        primaryDocument: filings.primaryDocument[i],
        documents: [],
      };
    }
  }

  return null;
}

async function getFilingIndex(cik: string, filing: Filing): Promise<string[]> {
  const accessionFormatted = filing.accessionNumber.replace(/-/g, "");
  const url = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionFormatted}/index.json`;

  const response = await fetchWithRetry(url);
  const data = await response.json();

  return data.directory.item
    .filter((item: { name: string }) => item.name.endsWith(".htm") || item.name.endsWith(".html"))
    .map((item: { name: string }) => item.name);
}

async function fetchDocument(cik: string, filing: Filing, docName: string): Promise<string> {
  const accessionFormatted = filing.accessionNumber.replace(/-/g, "");
  const url = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionFormatted}/${docName}`;

  const response = await fetchWithRetry(url);
  return response.text();
}

function parseNumber(text: string): number | null {
  let cleaned = text.replace(/[$,\s]/g, "");
  const isNegative = cleaned.includes("(") && cleaned.includes(")");
  cleaned = cleaned.replace(/[()]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return isNegative ? -num : num;
}

function isValidBorrowerName(name: string): boolean {
  const lowerName = name.toLowerCase().trim();

  // Must be at least 5 chars with letters
  if (name.length < 5 || !/[a-zA-Z]{3,}/.test(name)) return false;

  // Must not be just numbers
  if (/^[\d.,%$()]+$/.test(name)) return false;

  // Filter out common non-borrower rows
  const invalidPatterns = [
    "total",
    "subtotal",
    "sub-total",
    "net assets",
    "fair value",
    "cost",
    "principal",
    "amortized",
    "portfolio",
    "investments at fair",
    "dollar amounts",
    "footnote",
    "see accompanying",
    "continued",
    "schedule of",
    "consolidated",
    "as of",
    "year ended",
    "industry",
    "interest rate",
    "maturity",
    "the following",
    "expense",
    "fee",
    "management",
    "incentive",
    "accrued",
    "return",
    "note ",
    "notes to",
    "weighted-average",
    "weighted average",
    "contingent",
    "basis spread",
    "variable rate",
    "affiliate",
    "non-affiliate",
    "non-control",
    "control investments",
    "components of",
    "applicable to",
    "payment receivable",
    "earn out",
    "earnout",
    "fair value of",
    "december",
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "shares",
    "stockholders",
    "shareholders",
    "par value",
    "issued and outstanding",
  ];

  if (invalidPatterns.some((p) => lowerName.includes(p))) return false;

  // Skip if starts with investment type descriptors
  if (
    /^(first lien|second lien|senior|junior|subordinated|revolving|delayed draw|term loan|revolver|delayed)/i.test(
      name
    )
  ) {
    return false;
  }

  // Skip footnote references
  if (/^\(\d+\)/.test(name)) return false;

  return true;
}

// Multi-strategy parser that tries different table formats
function parseScheduleOfInvestments(html: string, ticker: string): Holding[] {
  const $ = cheerio.load(html);
  const seenBorrowers = new Map<string, Holding>();

  // Detect if values are in thousands
  const inThousands =
    html.toLowerCase().includes("(in thousands)") || html.toLowerCase().includes("in thousands");
  const divisor = inThousands ? 1000 : 1;

  // Strategy 1: Look for tables with company names and loan indicators
  $("table").each((tableIdx, table) => {
    const tableText = $(table).text().toLowerCase();

    // Skip balance sheet / summary tables
    if (
      tableText.includes("stockholders' equity") ||
      tableText.includes("shareholders' equity") ||
      tableText.includes("total investments, beginning") ||
      tableText.includes("statements of operations") ||
      tableText.includes("statements of changes")
    ) {
      return;
    }

    // Must have some loan indicators to be Schedule of Investments
    const hasLoanIndicators =
      tableText.includes("sofr") ||
      tableText.includes("libor") ||
      tableText.includes("first lien") ||
      tableText.includes("senior secured") ||
      tableText.includes("maturity date") ||
      tableText.includes("fair value") ||
      (tableText.includes("principal") && tableText.includes("cost"));

    if (!hasLoanIndicators) return;

    const rows = $(table).find("tr");
    let currentCompany = "";
    let currentIndustry = "";
    let sectionIndustry = ""; // For BXSL-style section headers
    let industryColumnIndex = -1; // For FSK-style dedicated Industry column

    // Known GICS-style industry names (for section header detection)
    const knownIndustryPatterns = [
      "aerospace",
      "defense",
      "air freight",
      "logistics",
      "automobiles",
      "auto",
      "biotechnology",
      "biotech",
      "building products",
      "capital goods",
      "capital markets",
      "chemicals",
      "commercial services",
      "professional services",
      "communications equipment",
      "construction",
      "engineering",
      "consumer discretionary",
      "consumer durables",
      "apparel",
      "consumer finance",
      "consumer services",
      "consumer staples",
      "containers",
      "packaging",
      "diversified",
      "electric utilities",
      "electrical equipment",
      "electronic equipment",
      "energy",
      "entertainment",
      "financial services",
      "financials",
      "food",
      "beverage",
      "tobacco",
      "ground transportation",
      "health care",
      "healthcare",
      "hotels",
      "restaurants",
      "leisure",
      "household",
      "personal products",
      "human resource",
      "employment",
      "industrial",
      "information technology",
      "insurance",
      "interactive media",
      "internet",
      "it services",
      "life sciences",
      "tools & services",
      "machinery",
      "marine",
      "materials",
      "media",
      "metals",
      "mining",
      "multi-utilities",
      "oil",
      "gas",
      "consumable fuels",
      "paper",
      "forest products",
      "passenger airlines",
      "pharmaceuticals",
      "real estate",
      "retailing",
      "retail",
      "semiconductors",
      "software",
      "specialty retail",
      "technology hardware",
      "storage",
      "peripherals",
      "telecommunication",
      "telecom",
      "textiles",
      "luxury",
      "trading companies",
      "distributors",
      "transportation",
      "utilities",
      "water utilities",
      "wireless",
    ];

    // Check if a string looks like an industry section header
    function isIndustrySectionHeader(text: string): boolean {
      // Remove "(continued)" suffix and clean up
      const cleaned = text
        .toLowerCase()
        .replace(/\s*\(continued\)\s*/gi, "")
        .replace(/\s*-\s*non-controlled.*$/i, "")
        .replace(/\s*-\s*controlled.*$/i, "")
        .trim();

      // Skip debt type headers
      if (
        cleaned.includes("first lien") ||
        cleaned.includes("second lien") ||
        cleaned.includes("subordinated") ||
        cleaned.includes("equity investments") ||
        cleaned.includes("total ") ||
        cleaned.includes("subtotal")
      ) {
        return false;
      }

      // Check if it matches any industry pattern
      return knownIndustryPatterns.some((pattern) => cleaned.includes(pattern));
    }

    // First pass: find header row to detect Industry column index
    rows.each((rowIdx, row) => {
      if (industryColumnIndex >= 0) return; // Already found

      const cells = $(row).find("td, th");
      cells.each((colIdx, cell) => {
        const text = $(cell).text().toLowerCase().trim();
        if (text === "industry" || text === "industry classification") {
          industryColumnIndex = colIdx;
          return false; // Break inner loop
        }
      });
    });

    rows.each((_, row) => {
      const cells = $(row).find("td, th");

      // Collect all cell texts first (needed for section header detection)
      const cellTexts: string[] = [];
      cells.each((_, cell) => {
        cellTexts.push($(cell).text().replace(/\s+/g, " ").trim());
      });

      const rowText = cellTexts.join(" ").toLowerCase();
      const nonEmptyCells = cellTexts.filter((t) => t.length > 0);
      const firstCell = cellTexts[0]?.trim() || "";
      const firstCellLower = firstCell.toLowerCase();

      // Skip debt type headers first
      if (
        firstCellLower.includes("first lien") ||
        firstCellLower.includes("second lien") ||
        firstCellLower.includes("subordinated") ||
        firstCellLower.includes("equity investments") ||
        firstCellLower.startsWith("total ")
      ) {
        return; // Skip this row
      }

      // Check if this is an industry section header (1-3 non-empty cells, matches industry pattern)
      // This must happen BEFORE the cells.length < 2 check since section headers often have 1 cell
      if (nonEmptyCells.length <= 3 && nonEmptyCells.length >= 1 && firstCell.length > 3) {
        if (isIndustrySectionHeader(firstCell)) {
          const cleanedIndustry = firstCell.replace(/\s*\(continued\)\s*/gi, "").trim();
          sectionIndustry = cleanedIndustry;
          return; // Skip this row, it's not a company
        }
      }

      // Skip rows with too few cells for company data
      if (cells.length < 2) return;

      // Skip obvious header rows
      if (rowText.includes("portfolio company") && rowText.includes("fair value")) return;
      if (
        rowText.includes("investments") &&
        rowText.includes("footnotes") &&
        rowText.includes("reference rate")
      )
        return;

      // Try to identify company name - usually in first or second cell
      // Company names often end with Inc., LLC, Corp., LP, Holdings, etc.
      const companyPatterns = [
        /,?\s*(inc\.?|llc|l\.l\.c\.?|corp\.?|corporation|ltd\.?|l\.?p\.?|lp|holdings?|partners?|group|co\.?|company)$/i,
        /\s(software|technologies?|solutions?|services?|systems?|capital|health|medical|financial|media|digital|wireless|pharma|bio|tech)$/i,
      ];

      // Look for company name in first few cells
      for (let i = 0; i < Math.min(3, cellTexts.length); i++) {
        const cellText = cellTexts[i];
        if (cellText.length < 5) continue;

        const looksLikeCompany =
          companyPatterns.some((p) => p.test(cellText)) ||
          (cellText.length > 10 &&
            isValidBorrowerName(cellText) &&
            // Contains capital letters (company names are capitalized)
            /[A-Z]/.test(cellText));

        if (looksLikeCompany && isValidBorrowerName(cellText)) {
          // Clean up company name
          const cleaned = cellText
            .replace(/\s*\(\d+\)\s*/g, "") // Remove footnotes like (1)
            .replace(/\s*\([\d,]+\)\s*/g, "") // Remove numbers in parens
            .trim();

          if (cleaned.length >= 5) {
            currentCompany = cleaned.substring(0, 100);

            // Strategy 1: FSK-style - use Industry column if detected
            if (industryColumnIndex >= 0 && industryColumnIndex < cellTexts.length) {
              const colIndustry = cellTexts[industryColumnIndex];
              if (
                colIndustry &&
                colIndustry.length > 2 &&
                !colIndustry.match(/^[\d\.\$\%\,\(\)]+$/)
              ) {
                currentIndustry = colIndustry.substring(0, 100);
              }
            }

            // Strategy 2: BXSL-style - use section header industry
            if (!currentIndustry && sectionIndustry) {
              currentIndustry = sectionIndustry;
            }

            // Strategy 3: ARCC-style - look for description in adjacent cells
            if (!currentIndustry) {
              for (let j = i + 1; j < Math.min(i + 3, cellTexts.length); j++) {
                const maybeIndustry = cellTexts[j];
                const industryKeywords = [
                  "provider",
                  "software",
                  "services",
                  "solutions",
                  "manufacturer",
                  "operator",
                  "developer",
                  "healthcare",
                  "technology",
                  "platform",
                  "producer",
                  "supplier",
                  "company that",
                  "offers",
                  "develops",
                ];
                if (
                  maybeIndustry.length > 15 &&
                  industryKeywords.some((kw) => maybeIndustry.toLowerCase().includes(kw))
                ) {
                  currentIndustry = maybeIndustry.substring(0, 100);
                  break;
                }
              }
            }
            break;
          }
        }
      }

      if (!currentCompany) return;

      // Check if this row has investment data
      const hasInvestmentType =
        rowText.includes("first lien") ||
        rowText.includes("second lien") ||
        rowText.includes("senior secured") ||
        rowText.includes("subordinated") ||
        rowText.includes("preferred") ||
        rowText.includes("common") ||
        rowText.includes("warrant") ||
        rowText.includes("revolving") ||
        rowText.includes("delayed draw") ||
        rowText.includes("term loan") ||
        rowText.includes("sofr") ||
        rowText.includes("libor") ||
        rowText.includes("equity") ||
        rowText.includes("units");

      // Also check for date patterns (maturity dates) and numeric values
      const hasMaturityDate =
        /\d{1,2}\/\d{1,2}\/\d{4}/.test(rowText) || /\d{1,2}\/\d{4}/.test(rowText);

      // Extract numeric values
      const numericValues: number[] = [];
      cellTexts.forEach((text) => {
        if (text === "$" || text === "" || text.includes("%")) return;
        if (/^\d{1,2}\/\d{1,2}\/?\d{4}$/.test(text)) return; // Skip dates
        if (text.includes("SOFR") || text.includes("+")) return;
        const num = parseNumber(text);
        if (num !== null && num > 0 && num < 100000) {
          // Reasonable range
          numericValues.push(num);
        }
      });

      // Need at least 2 numbers and some investment indicator to be a data row
      if (numericValues.length < 2) return;
      if (!hasInvestmentType && !hasMaturityDate && numericValues.length < 3) return;

      // Extract rate
      let rate: number | null = null;
      cellTexts.forEach((text) => {
        if (rate) return;
        const rateMatch = text.match(/^(\d{1,2}\.\d{1,2})%$/);
        if (rateMatch) {
          const r = parseFloat(rateMatch[1]);
          if (r >= 4 && r <= 20) rate = r;
        }
      });

      // Extract maturity
      let maturity = "";
      cellTexts.forEach((text) => {
        if (maturity) return;
        const match = text.match(/(\d{1,2})\/(\d{1,2}\/)?(\d{4})/);
        if (match) {
          const year = parseInt(match[3]);
          if (year >= 2024 && year <= 2040) {
            maturity = `${match[1].padStart(2, "0")}/01/${match[3]}`;
          }
        }
      });

      // Get values - sort and use largest as principal, next as fair value
      const sorted = [...numericValues].sort((a, b) => b - a);
      const principal = sorted[0] / divisor;
      let fairValue = sorted.length >= 2 ? sorted[1] / divisor : principal;

      // Sometimes the order is Principal, Cost, Fair Value (take 1st and 3rd)
      if (sorted.length >= 3 && Math.abs(sorted[1] - sorted[2]) < sorted[1] * 0.1) {
        fairValue = sorted[2] / divisor;
      }

      // Reasonable per-investment range: $0.1M to $600M
      if (fairValue < 0.1 || fairValue > 600) return;
      if (principal < 0.1 || principal > 600) return;

      // Determine investment type
      let investmentType = "First Lien Senior Secured";
      if (rowText.includes("second lien")) investmentType = "Second Lien";
      else if (rowText.includes("subordinated")) investmentType = "Subordinated";
      else if (rowText.includes("preferred")) investmentType = "Preferred Equity";
      else if (
        rowText.includes("common") ||
        rowText.includes("class a") ||
        rowText.includes("limited partner") ||
        rowText.includes("units")
      )
        investmentType = "Equity";
      else if (rowText.includes("warrant")) investmentType = "Warrant";

      // Aggregate by company
      const borrowerKey = currentCompany.toLowerCase().substring(0, 40);
      const existing = seenBorrowers.get(borrowerKey);

      if (existing) {
        existing.principal += principal;
        existing.fairValue += fairValue;
        if (rate && (!existing.rate || rate > existing.rate)) {
          existing.rate = rate;
        }
      } else {
        seenBorrowers.set(borrowerKey, {
          borrower: currentCompany,
          industry: currentIndustry || "Unknown",
          investmentType,
          rate,
          maturity: maturity || "N/A",
          principal,
          fairValue,
        });
      }
    });
  });

  return Array.from(seenBorrowers.values());
}

async function processBDC(bdc: (typeof BDCS)[0]): Promise<FundData | null> {
  console.log(`\nProcessing ${bdc.ticker} (${bdc.name})...`);

  try {
    const filing = await getLatestFiling(bdc.cik, ["10-Q", "10-K"]);
    if (!filing) {
      console.log(`  No 10-Q/10-K found for ${bdc.ticker}`);
      return null;
    }

    console.log(`  Found ${filing.form} dated ${filing.filingDate}`);

    const docs = await getFilingIndex(bdc.cik, filing);
    console.log(`  Found ${docs.length} documents`);

    let allHoldings: Holding[] = [];

    // Try each document to find Schedule of Investments
    // Priority: look for files with ticker name or schedule-related names
    const priorityDocs = docs.filter(
      (d) =>
        d.toLowerCase().includes(bdc.ticker.toLowerCase()) ||
        d.toLowerCase().includes("schedule") ||
        d.toLowerCase().includes("exhibit")
    );
    const otherDocs = docs.filter((d) => !priorityDocs.includes(d));
    const orderedDocs = [...priorityDocs, ...otherDocs].slice(0, 15);

    for (const docName of orderedDocs) {
      await sleep(400);
      const html = await fetchDocument(bdc.cik, filing, docName);

      if (html.includes("Undeclared Automated Tool") || html.includes("Request Originates from")) {
        console.log(`  Rate limited on ${docName}, waiting...`);
        await sleep(5000);
        continue;
      }

      const holdings = parseScheduleOfInvestments(html, bdc.ticker);

      if (holdings.length > allHoldings.length) {
        allHoldings = holdings;
        console.log(`  Found ${holdings.length} holdings in ${docName}`);
      }
    }

    // Deduplicate by normalized borrower name
    const uniqueHoldings = Array.from(
      new Map(allHoldings.map((h) => [h.borrower.toLowerCase().substring(0, 30), h])).values()
    );

    const totalFairValue = uniqueHoldings.reduce((sum, h) => sum + h.fairValue, 0);
    const totalPrincipal = uniqueHoldings.reduce((sum, h) => sum + h.principal, 0);

    console.log(
      `  Final: ${uniqueHoldings.length} unique holdings, $${totalFairValue.toFixed(0)}M fair value`
    );

    return {
      ticker: bdc.ticker,
      cik: bdc.cik,
      name: bdc.name,
      filingDate: filing.filingDate,
      holdings: uniqueHoldings,
      totalFairValue,
      totalPrincipal,
    };
  } catch (err) {
    console.error(`  Error processing ${bdc.ticker}:`, err);
    return null;
  }
}

async function main() {
  console.log("SEC EDGAR BDC Data Fetcher");
  console.log("==========================\n");

  const results: FundData[] = [];

  // Process all BDCs concurrently in batches of 3 to speed up while respecting rate limits
  const batchSize = 3;
  for (let i = 0; i < BDCS.length; i += batchSize) {
    const batch = BDCS.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((bdc) => processBDC(bdc)));

    for (const data of batchResults) {
      if (data && data.holdings.length > 0) {
        results.push(data);
      }
    }

    if (i + batchSize < BDCS.length) {
      await sleep(3000); // 3 second delay between batches
    }
  }

  // Save results
  const outputDir = path.join(process.cwd(), "src", "data");
  const outputPath = path.join(outputDir, "edgar-data.json");

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\n\nSaved ${results.length} funds to ${outputPath}`);

  console.log("\nSummary:");
  for (const fund of results) {
    console.log(
      `  ${fund.ticker}: ${fund.holdings.length} holdings, $${fund.totalFairValue.toFixed(0)}M fair value`
    );
  }

  // Find shared borrowers
  const borrowerFundMap = new Map<string, string[]>();
  for (const fund of results) {
    for (const holding of fund.holdings) {
      const key = holding.borrower.toLowerCase().substring(0, 25);
      const funds = borrowerFundMap.get(key) || [];
      if (!funds.includes(fund.ticker)) {
        funds.push(fund.ticker);
        borrowerFundMap.set(key, funds);
      }
    }
  }

  const sharedBorrowers = Array.from(borrowerFundMap.entries())
    .filter(([_, funds]) => funds.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  console.log(`\nShared Borrowers (${sharedBorrowers.length} total):`);
  sharedBorrowers.slice(0, 15).forEach(([borrower, funds]) => {
    console.log(`  ${borrower}: ${funds.join(", ")}`);
  });
}

main().catch(console.error);
