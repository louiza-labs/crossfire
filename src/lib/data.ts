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
  "business services",
  "consumer services",
  "financial services",
  "healthcare",
  "technology",
  "industrials",
  "energy",
  "materials",
  "unsecured debt",
  "secured loan",
  "derivative instrument",
  "other assets",
  "other liabilities",
  "company",
  "unknown",
]);

const INVALID_PATTERNS = [
  /^\d+\.\d+%\s+(unsecured|secured)/i,
  /^(1st|2nd|first|second)\s+lien/i,
  /funding facility$/i,
  /^(net|total|sub-?total)\s/i,
  /^transfers\s+(between|in|out)/i,
  /^(carrying|fair)\s+value$/i,
];

function isInvalidBorrower(name: string): boolean {
  const lower = name.toLowerCase().trim();
  if (INDUSTRY_CATEGORY_NAMES.has(lower)) return true;
  return INVALID_PATTERNS.some((p) => p.test(name));
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
    const validHoldings = fund.holdings.filter((h) => !isInvalidBorrower(h.borrower));
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
