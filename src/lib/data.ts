/**
 * Unified data loading from Vercel Blob
 * This is the single source of truth for fund data
 */

import { unstable_cache } from "next/cache";
import { fetchFundsFromBlob, type FundData, type HoldingData } from "./blob-data";

// Re-export types
export type { FundData, HoldingData };

export interface Manager {
  id: string;
  name: string;
  aum: number;
}

export interface Fund {
  id: string;
  name: string;
  ticker: string;
  cik: string;
  managerId: string;
  managerName: string;
  type: string;
  totalAssets: number;
  filingDate: string;
}

export interface Holding {
  id: string;
  fundId: string;
  borrowerId: string;
  borrowerName: string;
  industry: string;
  principal: number;
  fairValue: number;
  rate: number;
  maturity: string;
  gicsSector?: string;
  gicsIndustryGroup?: string;
  industryConfidence?: "high" | "medium" | "low";
  dataQualityScore?: number;
}

export interface Borrower {
  id: string;
  name: string;
  industry: string;
  gicsSector?: string;
  gicsIndustryGroup?: string;
}

// Invalid borrower patterns to filter
const INDUSTRY_CATEGORY_NAMES = new Set([
  // Generic categories
  "business services",
  "consumer services",
  "financial services",
  "healthcare",
  "health care",
  "technology",
  "industrials",
  "energy",
  "materials",
  "financials",
  "real estate",
  "utilities",
  "information technology",
  "consumer",
  "consumer discretionary",
  "consumer staples",
  "unknown",
  // Security types
  "unsecured debt",
  "secured loan",
  "secured debt",
  "unsecured loan",
  "derivative instrument",
  "derivative instruments",
  "investment type",
  // Financial instruments
  "foreign currency forward contracts",
  "foreign currency forwards",
  "interest rate swaps",
  "interest rate caps",
  "credit default swaps",
  "total return swaps",
  "currency hedges",
  "forward contracts",
  // Balance sheet
  "other assets",
  "other liabilities",
  "liabilities",
  "assets",
  // Column headers
  "company",
  "unknown",
  "portfolio company",
  "borrower",
  "issuer",
  // GICS industries (full names)
  "air freight & logistics",
  "construction & engineering",
  "construction & building",
  "it services",
  "professional services",
  "commercial services",
  "commercial services & supplies",
  "capital goods",
  "electrical equipment",
  "machinery",
  "building products",
  "trading companies",
  "trading companies & distributors",
  "semiconductors",
  "software",
  "software & services",
  "tech hardware",
  "communications equipment",
  "electronic equipment",
  "electronic equipment, instruments & components",
  "hotels, restaurants & leisure",
  "household durables",
  "household products",
  "textiles, apparel",
  "textiles, apparel & luxury goods",
  "leisure products",
  "auto components",
  "automobiles",
  "distributors",
  "internet & direct retail",
  "internet & direct marketing retail",
  "multiline retail",
  "specialty retail",
  "food & staples",
  "beverages",
  "food products",
  "pharmaceuticals",
  "biotechnology",
  "life sciences",
  "life sciences tools & services",
  "health care equipment & supplies",
  "health care providers & services",
  "diversified reits",
  "equity reits",
  "electric utilities",
  "gas utilities",
  "water utilities",
  "oil, gas & consumable",
  "oil, gas & consumable fuels",
  "metals & mining",
  "paper & forest",
  "paper & forest products",
  "chemicals",
  "construction materials",
  "media",
  "entertainment",
  "interactive media",
  "diversified telecommunication",
  "wireless telecommunication",
  "cable & satellite",
  // Asset categories / Multi-sector
  "multi-sector holdings",
  "multi-sector",
  "diversified holdings",
  "other holdings",
  "miscellaneous",
  // Countries/regions
  "netherlands",
  "united states",
  "united kingdom",
  "canada",
  "europe",
  "germany",
  "france",
  "ireland",
  "luxembourg",
  "switzerland",
  "australia",
  "japan",
  "mid-atlantic",
  "northeast",
  "southeast",
  "midwest",
  "southwest",
  "west",
  "pacific",
  // More industries
  "marine",
  "airlines",
  "road & rail",
  "containers & packaging",
  "aerospace & defense",
  "diversified financial services",
  "insurance",
  "banks",
  "consumer finance",
  "real estate management & development",
  "independent power and renewable electricity producers",
  "personal products",
  "tobacco",
  "diversified consumer services",
  "internet software & services",
  "technology hardware, storage & peripherals",
]);

const INVALID_PATTERNS = [
  /^\d+\.\d+%\s+(unsecured|secured)/i,
  /^(1st|2nd|first|second)\s+lien/i,
  /funding facility$/i,
  /^(net|total|sub-?total)\s/i,
  /^transfers\s+(between|in|out)/i,
  /^(carrying|fair)\s+value$/i,
  /^media:\s/i, // Media sub-industries like "Media: Advertising, Printing & Publishing"
  /^(aerospace|telecommunications|road\s*&?\s*rail|containers\s*&?\s*packaging)$/i,
  // Explicit GICS industries that slip through
  /^air\s+freight\s*&?\s*logistics$/i,
  /^construction\s*&?\s*(engineering|building|materials)$/i,
  /^it\s+services$/i,
  /^investment\s+type$/i,
  /^(netherlands|united\s+states|united\s+kingdom|germany|france|canada|europe|ireland|luxembourg|switzerland|australia|japan)$/i,
  // Industry subcategory formats with colons
  /^transportation:\s/i, // "Transportation: Cargo", "Transportation: Infrastructure"
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
  // Financial instruments and derivatives
  /^(foreign\s+)?currency\s+(forward|swap|hedge)/i,
  /^interest\s+rate\s+(swap|cap|floor|collar)/i,
  /^credit\s+(default\s+)?swap/i,
  /^(total\s+)?return\s+swap/i,
  /forward\s+contract/i,
  /^derivative/i,
  // Asset categories
  /^multi-?sector/i,
  /^diversified\s+(holdings|investments)/i,
  /^(other|miscellaneous)\s+(holdings|investments|assets)/i,
  // More GICS patterns
  /^(road\s*&?\s*rail|marine|airlines|air\s+freight)$/i,
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
  /^(health\s+care\s+(equipment|providers|services))/i,
  /^(life\s+sciences\s+tools)/i,
  /^(internet\s+(software|&|and))/i,
  /^(software\s*&?\s*services)$/i,
  /^(capital\s+goods)$/i,
  /^(construction\s+(&|and)\s+(engineering|materials))$/i,
  /^(trading\s+companies)/i,
  /^(food\s+(&|and)\s+staples)/i,
  /^(textiles,?\s+apparel)/i,
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
  // Date patterns - sometimes dates appear as borrower names or industries
  /^(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d/i,
  /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/i,
  /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/i,
  /^(q[1-4]|fy)\s*\d{2,4}/i,
  /^\d{4}$/i,
  /^(fiscal\s+)?(year|quarter)\s+\d/i,
  /^as\s+of\s+/i,
  /^\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i,
];

function isInvalidBorrower(name: string): boolean {
  const lower = name.toLowerCase().trim();
  if (INDUSTRY_CATEGORY_NAMES.has(lower)) return true;
  return INVALID_PATTERNS.some((p) => p.test(lower));
}

// Date patterns that should not be valid industries
const DATE_PATTERNS = [
  /^(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d/i,
  /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/i,
  /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/i,
  /^(q[1-4]|fy)\s*\d{2,4}/i,
  /^\d{4}$/i,
  /^(fiscal\s+)?(year|quarter)\s+\d/i,
  /^as\s+of\s+/i,
  /^\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i,
];

// Check if a holding has a valid industry classification
function hasValidIndustry(industry: string | undefined): boolean {
  if (!industry) return false;
  const lower = industry.toLowerCase().trim();
  // Filter out entries with Unknown/Unclassified industry - these are likely not real borrowers
  if (lower === "unknown" || lower === "unclassified" || lower === "") return false;
  // Filter out date-like values
  if (DATE_PATTERNS.some((pattern) => pattern.test(industry))) return false;
  return true;
}

function deriveManager(fundName: string): string {
  return fundName.split(" ")[0] || "Unknown";
}

interface ProcessedData {
  funds: Fund[];
  holdings: Holding[];
  borrowers: Borrower[];
  managers: Manager[];
}

function processRawData(rawFunds: FundData[]): ProcessedData {
  const managerMap = new Map<string, Manager>();
  const borrowerMap = new Map<string, Borrower>();
  const holdings: Holding[] = [];
  let borrowerIdCounter = 1;

  // Process each fund
  const funds: Fund[] = rawFunds.map((fund, fundIdx) => {
    const fundId = `f${fundIdx + 1}`;
    const managerName = deriveManager(fund.name);

    // Build manager
    if (!managerMap.has(managerName)) {
      managerMap.set(managerName, {
        id: `m${managerMap.size + 1}`,
        name: managerName,
        aum: 0,
      });
    }

    // Filter and process holdings
    const validHoldings = fund.holdings.filter((h) => {
      if (isInvalidBorrower(h.borrower)) return false;
      // Filter out entries with Unknown/Unclassified industry
      const industry =
        h.gicsSector && h.gicsSector !== "Unclassified" ? h.gicsSector : h.industry || "Unknown";
      if (!hasValidIndustry(industry)) return false;
      return true;
    });
    const totalAssets = validHoldings.reduce((sum, h) => sum + h.fairValue, 0);

    // Update manager AUM
    const manager = managerMap.get(managerName)!;
    manager.aum += totalAssets;

    // Build holdings and borrowers
    validHoldings.forEach((holding, holdingIdx) => {
      const borrowerKey = holding.borrower.toLowerCase().trim();

      if (!borrowerMap.has(borrowerKey)) {
        const industry =
          holding.gicsSector && holding.gicsSector !== "Unclassified"
            ? holding.gicsSector
            : holding.industry || "Unclassified";

        borrowerMap.set(borrowerKey, {
          id: `b${borrowerIdCounter++}`,
          name: holding.borrower,
          industry,
          gicsSector: holding.gicsSector,
          gicsIndustryGroup: holding.gicsIndustryGroup,
        });
      }

      const borrower = borrowerMap.get(borrowerKey)!;
      const industry =
        holding.gicsSector && holding.gicsSector !== "Unclassified"
          ? holding.gicsSector
          : holding.industry || "Unclassified";

      holdings.push({
        id: `h${fundIdx}_${holdingIdx}`,
        fundId,
        borrowerId: borrower.id,
        borrowerName: borrower.name,
        industry,
        principal: Math.round(holding.principal * 100) / 100,
        fairValue: Math.round(holding.fairValue * 100) / 100,
        rate: holding.rate ?? 0,
        maturity: holding.maturity,
        gicsSector: holding.gicsSector,
        gicsIndustryGroup: holding.gicsIndustryGroup,
        industryConfidence: holding.industryConfidence,
        dataQualityScore: holding.dataQualityScore,
      });
    });

    return {
      id: fundId,
      name: fund.name,
      ticker: fund.ticker,
      cik: fund.cik,
      managerId: managerMap.get(managerName)!.id,
      managerName,
      type: "BDC",
      totalAssets,
      filingDate: fund.filingDate,
    };
  });

  return {
    funds,
    holdings,
    borrowers: Array.from(borrowerMap.values()),
    managers: Array.from(managerMap.values()),
  };
}

// Cache the processed data for 1 hour
const getCachedData = unstable_cache(
  async (): Promise<ProcessedData> => {
    const rawFunds = await fetchFundsFromBlob();

    if (!rawFunds || rawFunds.length === 0) {
      console.warn("No data from Blob, returning empty dataset");
      return { funds: [], holdings: [], borrowers: [], managers: [] };
    }

    return processRawData(rawFunds);
  },
  ["funds-data"],
  { revalidate: 3600 } // 1 hour
);

// Public API
export async function getData(): Promise<ProcessedData> {
  return getCachedData();
}

export async function getFunds(): Promise<Fund[]> {
  const data = await getData();
  return data.funds;
}

export async function getHoldings(): Promise<Holding[]> {
  const data = await getData();
  return data.holdings;
}

export async function getBorrowers(): Promise<Borrower[]> {
  const data = await getData();
  return data.borrowers;
}

export async function getManagers(): Promise<Manager[]> {
  const data = await getData();
  return data.managers;
}

export async function getFundById(id: string): Promise<Fund | undefined> {
  const data = await getData();
  return data.funds.find((f) => f.id === id);
}

export async function getBorrowerById(id: string): Promise<Borrower | undefined> {
  const data = await getData();
  return data.borrowers.find((b) => b.id === id);
}

export async function getHoldingsByFund(
  fundId: string
): Promise<(Holding & { borrower: Borrower })[]> {
  const data = await getData();
  const borrowerMap = new Map(data.borrowers.map((b) => [b.id, b]));

  return data.holdings
    .filter((h) => h.fundId === fundId)
    .map((h) => ({
      ...h,
      borrower: borrowerMap.get(h.borrowerId)!,
    }))
    .filter((h) => h.borrower);
}

export async function getFundsByBorrower(
  borrowerId: string
): Promise<(Holding & { fund: Fund })[]> {
  const data = await getData();
  const fundMap = new Map(data.funds.map((f) => [f.id, f]));

  return data.holdings
    .filter((h) => h.borrowerId === borrowerId)
    .map((h) => ({
      ...h,
      fund: fundMap.get(h.fundId)!,
    }))
    .filter((h) => h.fund);
}

export async function getStats() {
  const data = await getData();
  const totalExposure = data.holdings.reduce((sum, h) => sum + h.fairValue, 0);

  // Count shared borrowers
  const borrowerFundCount = new Map<string, Set<string>>();
  for (const h of data.holdings) {
    if (!borrowerFundCount.has(h.borrowerId)) {
      borrowerFundCount.set(h.borrowerId, new Set());
    }
    borrowerFundCount.get(h.borrowerId)!.add(h.fundId);
  }
  const sharedBorrowerCount = Array.from(borrowerFundCount.values()).filter(
    (funds) => funds.size > 1
  ).length;

  const avgRate =
    data.holdings.length > 0
      ? data.holdings.reduce((sum, h) => sum + h.rate, 0) / data.holdings.length
      : 0;

  return {
    totalFunds: data.funds.length,
    totalManagers: data.managers.length,
    totalBorrowers: data.borrowers.length,
    totalHoldings: data.holdings.length,
    totalExposure,
    sharedBorrowerCount,
    avgRate,
  };
}
