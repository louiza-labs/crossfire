/**
 * Quick test of parser fix for specific tickers
 * Usage: pnpm tsx scripts/test-parser-fix.ts
 */

import * as cheerio from "cheerio";

const USER_AGENT = "Capital Research contact@capital.dev";

const TEST_FUNDS = [
  { ticker: "BXSL", cik: "1736035" }, // Section header format
  { ticker: "FSK", cik: "1422183" }, // Industry column format
];

interface Holding {
  borrower: string;
  industry: string;
  investmentType: string;
  rate: number | null;
  maturity: string;
  principal: number;
  fairValue: number;
}

async function fetchWithRetry(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function getLatestFiling(cik: string): Promise<{ url: string; date: string } | null> {
  const paddedCik = cik.padStart(10, "0");
  const url = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;

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

// Known GICS-style industry patterns
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

function parseScheduleOfInvestments(html: string): Holding[] {
  const $ = cheerio.load(html);
  const seenBorrowers = new Map<string, Holding>();

  const inThousands = html.toLowerCase().includes("(in thousands)");
  const divisor = inThousands ? 1000 : 1;

  $("table").each((tableIdx, table) => {
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

    // Find Industry column
    rows.each((_, row) => {
      if (industryColumnIndex >= 0) return;
      $(row)
        .find("td, th")
        .each((colIdx, cell) => {
          const text = $(cell).text().toLowerCase().trim();
          if (text === "industry" || text === "industry classification") {
            industryColumnIndex = colIdx;
            console.log(`  Found Industry column at index ${colIdx}`);
            return false;
          }
        });
    });

    let rowNum = 0;
    rows.each((_, row) => {
      rowNum++;
      const cells = $(row).find("td, th");

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

      // Check if this is an industry section header (1-3 non-empty cells, matches industry pattern)
      // This must happen BEFORE the cells.length < 2 check since section headers often have 1 cell
      if (nonEmptyCells.length <= 3 && nonEmptyCells.length >= 1 && firstCell.length > 3) {
        if (isIndustrySectionHeader(firstCell)) {
          const cleanedIndustry = firstCell.replace(/\s*\(continued\)\s*/gi, "").trim();
          sectionIndustry = cleanedIndustry;
          console.log(`  >>> Section header DETECTED: "${sectionIndustry}"`);
          return;
        }
      }

      // Skip rows with too few cells for company data
      if (cells.length < 2) return;

      // Skip table headers
      if (rowText.includes("portfolio company") && rowText.includes("fair value")) return;

      // Find company name
      const companyPatterns = [/,?\s*(inc\.?|llc|corp\.?|ltd\.?|lp|holdings?)$/i];

      for (let i = 0; i < Math.min(3, cellTexts.length); i++) {
        const cellText = cellTexts[i];
        if (cellText.length < 5) continue;

        const looksLikeCompany =
          companyPatterns.some((p) => p.test(cellText)) ||
          (cellText.length > 10 && isValidBorrowerName(cellText) && /[A-Z]/.test(cellText));

        if (looksLikeCompany && isValidBorrowerName(cellText)) {
          currentCompany = cellText
            .replace(/\s*\(\d+\)\s*/g, "")
            .trim()
            .substring(0, 100);

          // Strategy 1: Industry column (FSK-style)
          if (industryColumnIndex >= 0 && industryColumnIndex < cellTexts.length) {
            const colIndustry = cellTexts[industryColumnIndex];
            if (
              colIndustry &&
              colIndustry.length > 2 &&
              !colIndustry.match(/^[\d\.\$\%\,\(\)]+$/)
            ) {
              currentIndustry = colIndustry;
            }
          }

          // Strategy 2: Section header (BXSL-style)
          if (!currentIndustry && sectionIndustry) {
            currentIndustry = sectionIndustry;
          }

          break;
        }
      }

      if (!currentCompany) return;

      // Extract numbers
      const numericValues: number[] = [];
      cellTexts.forEach((text) => {
        if (/^\d{1,2}\/\d{1,2}\/?\d{4}$/.test(text)) return;
        const num = parseNumber(text);
        if (num !== null && num > 0 && num < 100000) {
          numericValues.push(num);
        }
      });

      if (numericValues.length < 2) return;

      const sorted = [...numericValues].sort((a, b) => b - a);
      const principal = sorted[0] / divisor;
      const fairValue = sorted.length >= 2 ? sorted[1] / divisor : principal;

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

async function test() {
  for (const fund of TEST_FUNDS) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Testing ${fund.ticker}`);
    console.log("=".repeat(60));

    const filing = await getLatestFiling(fund.cik);
    if (!filing) {
      console.log("No filing found");
      continue;
    }

    console.log(`Filing: ${filing.date}`);
    const html = await fetchWithRetry(filing.url);
    const holdings = parseScheduleOfInvestments(html);

    const withIndustry = holdings.filter((h) => h.industry !== "Unknown");
    const industries = new Set(holdings.map((h) => h.industry));

    console.log(`\nResults:`);
    console.log(`  Total holdings: ${holdings.length}`);
    console.log(
      `  With industry: ${withIndustry.length} (${((withIndustry.length / holdings.length) * 100).toFixed(1)}%)`
    );
    console.log(`  Unique industries: ${industries.size}`);

    console.log(`\nSample holdings:`);
    holdings.slice(0, 10).forEach((h) => {
      console.log(`  ${h.borrower.substring(0, 40).padEnd(40)} | ${h.industry}`);
    });

    console.log(`\nIndustries found:`);
    [...industries].slice(0, 15).forEach((i) => console.log(`  - ${i}`));
  }
}

test().catch(console.error);
