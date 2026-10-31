/**
 * Cron job to refresh BDC holdings data from SEC EDGAR
 *
 * Schedule: Weekly on Sundays at 2am UTC
 * Vercel cron config in vercel.json
 */

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import * as cheerio from "cheerio";

const USER_AGENT = "Capital Research contact@capital.dev";
const BLOB_PATH = "funds-data/funds.json";

// BDC tickers and their SEC CIK numbers
const BDCS: Record<string, string> = {
  ARCC: "1287750",
  BXSL: "1736035",
  OBDC: "1796209",
  FSK: "1422183",
  ORCC: "1655050",
  BBDC: "1379785",
  BCSF: "1655888",
  PNNT: "1412093",
  TPVG: "1580345",
  HTGC: "1280784",
  MAIN: "1396440",
  OCSL: "1414932",
  NMFC: "1496099",
};

// Verify cron secret to prevent unauthorized access
function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // In development, allow without auth
  if (process.env.NODE_ENV === "development") return true;

  // Vercel cron jobs include this header
  if (authHeader === `Bearer ${cronSecret}`) return true;

  return false;
}

async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
      });
      if (response.status === 429) {
        // Rate limited, wait and retry
        await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error("Max retries exceeded");
}

interface Filing {
  url: string;
  date: string;
}

async function getLatestFiling(cik: string): Promise<Filing | null> {
  const paddedCik = cik.padStart(10, "0");
  const url = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;

  try {
    const data = JSON.parse(await fetchWithRetry(url));
    const filings = data.filings.recent;

    for (let i = 0; i < filings.form.length; i++) {
      if (filings.form[i] === "10-Q" || filings.form[i] === "10-K") {
        const accession = filings.accessionNumber[i].replace(/-/g, "");
        const primary = filings.primaryDocument[i];
        return {
          url: `https://www.sec.gov/Archives/edgar/data/${cik}/${accession}/${primary}`,
          date: filings.filingDate[i],
        };
      }
    }
  } catch (error) {
    console.error(`Failed to get filing for CIK ${cik}:`, error);
  }
  return null;
}

function parseNumber(text: string): number | null {
  const cleaned = text.replace(/[$,\s]/g, "").replace(/\(([^)]+)\)/, "-$1");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function isValidBorrowerName(name: string): boolean {
  const lowerName = name.toLowerCase();
  const invalidPatterns = [
    "total",
    "subtotal",
    "net",
    "less:",
    "balance",
    "accrued",
    "payable",
    "receivable",
    "assets",
    "liabilities",
    "cash",
  ];
  if (invalidPatterns.some((p) => lowerName.includes(p))) return false;
  if (/^(first lien|second lien|senior|subordinated)/i.test(name)) return false;
  return true;
}

// Known GICS-style industry patterns for section header detection
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

function isIndustrySectionHeader(text: string): boolean {
  const cleaned = text
    .toLowerCase()
    .replace(/\s*\(continued\)\s*/gi, "")
    .replace(/\s*-\s*non-controlled.*$/i, "")
    .replace(/\s*-\s*controlled.*$/i, "")
    .trim();

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

  return knownIndustryPatterns.some((pattern) => cleaned.includes(pattern));
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

function parseScheduleOfInvestments(html: string): Holding[] {
  const $ = cheerio.load(html);
  const seenBorrowers = new Map<string, Holding>();

  const inThousands = html.toLowerCase().includes("(in thousands)");
  const divisor = inThousands ? 1000 : 1;

  $("table").each((_, table) => {
    const tableText = $(table).text().toLowerCase();

    const hasLoanIndicators =
      tableText.includes("sofr") ||
      tableText.includes("first lien") ||
      tableText.includes("maturity") ||
      tableText.includes("fair value");

    if (!hasLoanIndicators) return;

    const rows = $(table).find("tr");
    let currentCompany = "";
    let currentIndustry = "";
    let sectionIndustry = "";
    let industryColumnIndex = -1;

    // First pass: find Industry column
    rows.each((_, row) => {
      if (industryColumnIndex >= 0) return;
      $(row)
        .find("td, th")
        .each((colIdx, cell) => {
          const text = $(cell).text().toLowerCase().trim();
          if (text === "industry" || text === "industry classification") {
            industryColumnIndex = colIdx;
            return false;
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
        return;
      }

      // Check if this is an industry section header
      if (nonEmptyCells.length <= 3 && nonEmptyCells.length >= 1 && firstCell.length > 3) {
        if (isIndustrySectionHeader(firstCell)) {
          const cleanedIndustry = firstCell.replace(/\s*\(continued\)\s*/gi, "").trim();
          sectionIndustry = cleanedIndustry;
          return;
        }
      }

      // Skip rows with too few cells for company data
      if (cells.length < 2) return;

      // Skip obvious header rows
      if (rowText.includes("portfolio company") && rowText.includes("fair value")) return;

      // Try to identify company name
      const companyPatterns = [
        /,?\s*(inc\.?|llc|l\.l\.c\.?|corp\.?|corporation|ltd\.?|l\.?p\.?|lp|holdings?|partners?|group|co\.?|company)$/i,
        /\s(software|technologies?|solutions?|services?|systems?|capital|health|medical|financial|media|digital|wireless|pharma|bio|tech)$/i,
      ];

      for (let i = 0; i < Math.min(3, cellTexts.length); i++) {
        const cellText = cellTexts[i];
        if (cellText.length < 5) continue;

        const looksLikeCompany =
          companyPatterns.some((p) => p.test(cellText)) ||
          (cellText.length > 10 && isValidBorrowerName(cellText) && /[A-Z]/.test(cellText));

        if (looksLikeCompany && isValidBorrowerName(cellText)) {
          const cleaned = cellText
            .replace(/\s*\(\d+\)\s*/g, "")
            .replace(/\s*\([\d,]+\)\s*/g, "")
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

      // Extract numeric values
      const numericValues: number[] = [];
      cellTexts.forEach((text) => {
        if (text === "$" || text === "" || text.includes("%")) return;
        if (/^\d{1,2}\/\d{1,2}\/?\d{4}$/.test(text)) return;
        if (text.includes("SOFR") || text.includes("+")) return;
        const num = parseNumber(text);
        if (num !== null && num > 0 && num < 100000) {
          numericValues.push(num);
        }
      });

      // Need at least 2 numbers for principal and fair value
      if (numericValues.length < 2) return;

      const sorted = [...numericValues].sort((a, b) => b - a);
      const principal = sorted[0] / divisor;
      const fairValue = sorted.length >= 2 ? sorted[1] / divisor : principal;

      // Filter out unreasonably small or large values
      if (fairValue < 0.1 || fairValue > 600) return;

      const borrowerKey = currentCompany.toLowerCase().substring(0, 40);
      if (!seenBorrowers.has(borrowerKey)) {
        seenBorrowers.set(borrowerKey, {
          borrower: currentCompany,
          industry: currentIndustry || "Unknown",
          investmentType: "First Lien Senior Secured",
          rate: null,
          maturity: "N/A",
          principal,
          fairValue,
        });
      }
    });
  });

  return Array.from(seenBorrowers.values());
}

interface FundData {
  name: string;
  ticker: string;
  cik: string;
  filingDate: string;
  holdings: Holding[];
}

const FUND_NAMES: Record<string, string> = {
  ARCC: "Ares Capital Corp",
  BXSL: "Blackstone Secured Lending Fund",
  OBDC: "Blue Owl Capital Corp",
  FSK: "FS KKR Capital Corp",
  ORCC: "Owl Rock Capital Corp",
  BBDC: "Barings BDC, Inc.",
  BCSF: "Bain Capital Specialty Finance",
  PNNT: "PennantPark Floating Rate Capital",
  TPVG: "TriplePoint Venture Growth",
  HTGC: "Hercules Capital, Inc.",
  MAIN: "Main Street Capital Corp",
  OCSL: "Oaktree Specialty Lending Corp",
  NMFC: "New Mountain Finance Corp",
};

export async function GET(request: Request) {
  // Verify authorization
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const results: FundData[] = [];
  const errors: string[] = [];

  console.log("Starting SEC EDGAR data refresh...");

  for (const [ticker, cik] of Object.entries(BDCS)) {
    try {
      console.log(`Processing ${ticker}...`);

      // Rate limit: 10 requests per second max for SEC
      await new Promise((r) => setTimeout(r, 150));

      const filing = await getLatestFiling(cik);
      if (!filing) {
        errors.push(`${ticker}: No filing found`);
        continue;
      }

      const html = await fetchWithRetry(filing.url);
      const holdings = parseScheduleOfInvestments(html);

      results.push({
        name: FUND_NAMES[ticker] || ticker,
        ticker,
        cik,
        filingDate: filing.date,
        holdings,
      });

      console.log(`${ticker}: ${holdings.length} holdings parsed`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${ticker}: ${message}`);
      console.error(`Failed to process ${ticker}:`, error);
    }
  }

  // Upload to Vercel Blob
  try {
    const blob = await put(BLOB_PATH, JSON.stringify(results, null, 2), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`Data refresh complete in ${duration}s`);
    console.log(`Blob URL: ${blob.url}`);

    return NextResponse.json({
      success: true,
      fundsProcessed: results.length,
      totalHoldings: results.reduce((sum, f) => sum + f.holdings.length, 0),
      errors: errors.length > 0 ? errors : undefined,
      blobUrl: blob.url,
      duration: `${duration}s`,
    });
  } catch (error) {
    console.error("Failed to upload to blob:", error);
    return NextResponse.json(
      { error: "Failed to upload data", details: String(error) },
      { status: 500 }
    );
  }
}
