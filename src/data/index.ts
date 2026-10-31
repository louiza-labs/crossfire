// Load and transform fund data from JSON
import fundsData from "./funds.json";

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
}

export interface Borrower {
  id: string;
  name: string;
  industry: string;
}

// Derive manager from fund name (e.g., "Ares Capital Corp" -> "Ares")
function deriveManager(fundName: string): string {
  const firstWord = fundName.split(" ")[0];
  return firstWord || "Unknown";
}

// Industry category names that are sometimes incorrectly parsed as borrower names
// These are section headers in SEC filings, not actual companies
const INDUSTRY_CATEGORY_NAMES = new Set([
  "business services",
  "consumer services",
  "distribution & logistics",
  "financial services",
  "financial services & technology",
  "healthcare",
  "healthcare services",
  "technology",
  "industrials",
  "consumer",
  "energy",
  "media",
  "telecommunications",
  "real estate",
  "utilities",
  "materials",
  "unknown",
]);

// Check if a borrower name is actually an industry category header
function isIndustryCategory(name: string): boolean {
  return INDUSTRY_CATEGORY_NAMES.has(name.toLowerCase().trim());
}

// Transform raw data into app data model
const managerMap = new Map<string, Manager>();
const borrowerMap = new Map<string, Borrower>();
let borrowerIdCounter = 1;

// First pass: calculate total assets per fund from holdings (excluding category headers)
const fundTotals = fundsData.map((fund) => ({
  ...fund,
  totalAssets: fund.holdings
    .filter((h) => !isIndustryCategory(h.borrower))
    .reduce((sum, h) => sum + h.fairValue, 0),
  manager: deriveManager(fund.name),
  type: "BDC",
}));

// Build managers
fundTotals.forEach((fund) => {
  if (!managerMap.has(fund.manager)) {
    managerMap.set(fund.manager, {
      id: `m${managerMap.size + 1}`,
      name: fund.manager,
      aum: 0,
    });
  }
  const manager = managerMap.get(fund.manager)!;
  manager.aum += fund.totalAssets;
});

export const managers: Manager[] = Array.from(managerMap.values());

// Build funds
export const funds: Fund[] = fundTotals.map((fund, idx) => ({
  id: `f${idx + 1}`,
  name: fund.name,
  ticker: fund.ticker,
  cik: fund.cik,
  managerId: managerMap.get(fund.manager)!.id,
  managerName: fund.manager,
  type: fund.type,
  totalAssets: fund.totalAssets,
  filingDate: fund.filingDate,
}));

// Build borrowers and holdings
export const holdings: Holding[] = [];

fundsData.forEach((fundData, fundIdx) => {
  const fundId = `f${fundIdx + 1}`;

  fundData.holdings.forEach((holding, holdingIdx) => {
    // Skip entries where the "borrower" is actually an industry category header
    if (isIndustryCategory(holding.borrower)) {
      return;
    }

    const borrowerKey = holding.borrower.toLowerCase().trim();

    if (!borrowerMap.has(borrowerKey)) {
      borrowerMap.set(borrowerKey, {
        id: `b${borrowerIdCounter++}`,
        name: holding.borrower,
        industry: holding.industry || "Unclassified",
      });
    }

    const borrower = borrowerMap.get(borrowerKey)!;

    // Round values to avoid floating point display issues
    const principal = Math.round(holding.principal * 100) / 100;
    const fairValue = Math.round(holding.fairValue * 100) / 100;

    holdings.push({
      id: `h${fundIdx}_${holdingIdx}`,
      fundId,
      borrowerId: borrower.id,
      borrowerName: borrower.name,
      industry: holding.industry || "Unclassified",
      principal,
      fairValue,
      rate: holding.rate ?? 0,
      maturity: holding.maturity,
    });
  });
});

export const borrowers: Borrower[] = Array.from(borrowerMap.values());

// Helper functions
export function getFundById(id: string): Fund | undefined {
  return funds.find((f) => f.id === id);
}

export function getBorrowerById(id: string): Borrower | undefined {
  return borrowers.find((b) => b.id === id);
}

export function getManagerById(id: string): Manager | undefined {
  return managers.find((m) => m.id === id);
}

export function getHoldingsByFund(fundId: string): (Holding & { borrower: Borrower })[] {
  return holdings
    .filter((h) => h.fundId === fundId)
    .map((h) => ({
      ...h,
      borrower: borrowerMap.get(h.borrowerName.toLowerCase())!,
    }));
}

export function getFundsByBorrower(borrowerId: string): (Holding & { fund: Fund })[] {
  return holdings
    .filter((h) => h.borrowerId === borrowerId)
    .map((h) => ({
      ...h,
      fund: funds.find((f) => f.id === h.fundId)!,
    }));
}

export function getSharedBorrowers(): {
  borrower: Borrower;
  funds: Fund[];
  totalExposure: number;
  holdings: Holding[];
}[] {
  const borrowerFundMap = new Map<
    string,
    { funds: Set<string>; totalExposure: number; holdings: Holding[] }
  >();

  for (const holding of holdings) {
    const current = borrowerFundMap.get(holding.borrowerId) || {
      funds: new Set<string>(),
      totalExposure: 0,
      holdings: [],
    };
    current.funds.add(holding.fundId);
    current.totalExposure += holding.fairValue;
    current.holdings.push(holding);
    borrowerFundMap.set(holding.borrowerId, current);
  }

  return Array.from(borrowerFundMap.entries())
    .filter(([, data]) => data.funds.size > 1)
    .map(([borrowerId, data]) => ({
      borrower: borrowers.find((b) => b.id === borrowerId)!,
      funds: Array.from(data.funds).map((fid) => funds.find((f) => f.id === fid)!),
      totalExposure: data.totalExposure,
      holdings: data.holdings,
    }))
    .sort((a, b) => b.funds.length - a.funds.length);
}

// Statistics
export function getStats() {
  const totalExposure = holdings.reduce((sum, h) => sum + h.fairValue, 0);
  const sharedBorrowers = getSharedBorrowers();
  const avgRate = holdings.reduce((sum, h) => sum + h.rate, 0) / holdings.length;

  return {
    totalFunds: funds.length,
    totalManagers: managers.length,
    totalBorrowers: borrowers.length,
    totalHoldings: holdings.length,
    totalExposure,
    sharedBorrowerCount: sharedBorrowers.length,
    avgRate,
  };
}

// Analytics helper functions

export interface IndustryConcentration {
  industry: string;
  totalExposure: number;
  holdingCount: number;
  borrowerCount: number;
  percentage: number;
  avgRate: number;
}

export function getIndustryConcentration(): IndustryConcentration[] {
  const industryMap = new Map<
    string,
    { exposure: number; holdings: Holding[]; borrowers: Set<string> }
  >();

  for (const holding of holdings) {
    const industry = holding.industry || "Unknown";
    const current = industryMap.get(industry) || {
      exposure: 0,
      holdings: [],
      borrowers: new Set<string>(),
    };
    current.exposure += holding.fairValue;
    current.holdings.push(holding);
    current.borrowers.add(holding.borrowerId);
    industryMap.set(industry, current);
  }

  const totalExposure = holdings.reduce((sum, h) => sum + h.fairValue, 0);

  return Array.from(industryMap.entries())
    .map(([industry, data]) => ({
      industry,
      totalExposure: data.exposure,
      holdingCount: data.holdings.length,
      borrowerCount: data.borrowers.size,
      percentage: totalExposure > 0 ? (data.exposure / totalExposure) * 100 : 0,
      avgRate:
        data.holdings.length > 0
          ? data.holdings.reduce((sum, h) => sum + h.rate, 0) / data.holdings.length
          : 0,
    }))
    .sort((a, b) => b.totalExposure - a.totalExposure);
}

export interface RateBucket {
  range: string;
  min: number;
  max: number;
  count: number;
  totalExposure: number;
  percentage: number;
}

export function getRateDistribution(): RateBucket[] {
  const buckets: RateBucket[] = [
    { range: "0-5%", min: 0, max: 5, count: 0, totalExposure: 0, percentage: 0 },
    { range: "5-7%", min: 5, max: 7, count: 0, totalExposure: 0, percentage: 0 },
    { range: "7-9%", min: 7, max: 9, count: 0, totalExposure: 0, percentage: 0 },
    { range: "9-11%", min: 9, max: 11, count: 0, totalExposure: 0, percentage: 0 },
    { range: "11-13%", min: 11, max: 13, count: 0, totalExposure: 0, percentage: 0 },
    { range: "13%+", min: 13, max: Infinity, count: 0, totalExposure: 0, percentage: 0 },
  ];

  for (const holding of holdings) {
    const rate = holding.rate;
    const bucket = buckets.find((b) => rate >= b.min && rate < b.max);
    if (bucket) {
      bucket.count++;
      bucket.totalExposure += holding.fairValue;
    }
  }

  const totalExposure = holdings.reduce((sum, h) => sum + h.fairValue, 0);
  for (const bucket of buckets) {
    bucket.percentage = totalExposure > 0 ? (bucket.totalExposure / totalExposure) * 100 : 0;
  }

  return buckets;
}

export interface MaturityBucket {
  period: string;
  year: number;
  quarter?: number;
  count: number;
  totalExposure: number;
  holdings: Holding[];
}

export function getMaturitySchedule(): MaturityBucket[] {
  const bucketMap = new Map<string, MaturityBucket>();

  for (const holding of holdings) {
    if (!holding.maturity) continue;

    const maturityDate = new Date(holding.maturity);
    if (isNaN(maturityDate.getTime())) continue;

    const year = maturityDate.getFullYear();
    const quarter = Math.ceil((maturityDate.getMonth() + 1) / 3);
    const key = `${year}-Q${quarter}`;

    const current = bucketMap.get(key) || {
      period: `Q${quarter} ${year}`,
      year,
      quarter,
      count: 0,
      totalExposure: 0,
      holdings: [],
    };
    current.count++;
    current.totalExposure += holding.fairValue;
    current.holdings.push(holding);
    bucketMap.set(key, current);
  }

  return Array.from(bucketMap.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return (a.quarter ?? 0) - (b.quarter ?? 0);
  });
}

export interface FundIndustryCell {
  fundId: string;
  fundTicker: string;
  industry: string;
  exposure: number;
  holdingCount: number;
  percentage: number;
}

export interface FundIndustryMatrix {
  funds: { id: string; ticker: string; name: string }[];
  industries: string[];
  cells: FundIndustryCell[];
  maxExposure: number;
}

export function getFundIndustryMatrix(): FundIndustryMatrix {
  const cellMap = new Map<string, FundIndustryCell>();
  const industries = new Set<string>();
  const fundExposures = new Map<string, number>();

  for (const holding of holdings) {
    const industry = holding.industry || "Unknown";
    industries.add(industry);

    const key = `${holding.fundId}-${industry}`;
    const fund = funds.find((f) => f.id === holding.fundId);
    if (!fund) continue;

    const current = cellMap.get(key) || {
      fundId: holding.fundId,
      fundTicker: fund.ticker,
      industry,
      exposure: 0,
      holdingCount: 0,
      percentage: 0,
    };
    current.exposure += holding.fairValue;
    current.holdingCount++;
    cellMap.set(key, current);

    fundExposures.set(holding.fundId, (fundExposures.get(holding.fundId) || 0) + holding.fairValue);
  }

  const cells = Array.from(cellMap.values());

  // Calculate percentages relative to fund total
  for (const cell of cells) {
    const fundTotal = fundExposures.get(cell.fundId) || 1;
    cell.percentage = (cell.exposure / fundTotal) * 100;
  }

  const maxExposure = Math.max(...cells.map((c) => c.exposure), 0);

  return {
    funds: funds.map((f) => ({ id: f.id, ticker: f.ticker, name: f.name })),
    industries: Array.from(industries).sort(),
    cells,
    maxExposure,
  };
}

export interface FilterOptions {
  fundIds?: string[];
  industries?: string[];
  minExposure?: number;
  maxExposure?: number;
  minRate?: number;
  maxRate?: number;
}

export function filterHoldings(options: FilterOptions): Holding[] {
  return holdings.filter((h) => {
    if (options.fundIds && options.fundIds.length > 0 && !options.fundIds.includes(h.fundId)) {
      return false;
    }
    if (
      options.industries &&
      options.industries.length > 0 &&
      !options.industries.includes(h.industry)
    ) {
      return false;
    }
    if (options.minExposure !== undefined && h.fairValue < options.minExposure) {
      return false;
    }
    if (options.maxExposure !== undefined && h.fairValue > options.maxExposure) {
      return false;
    }
    if (options.minRate !== undefined && h.rate < options.minRate) {
      return false;
    }
    if (options.maxRate !== undefined && h.rate > options.maxRate) {
      return false;
    }
    return true;
  });
}

export function getUniqueIndustries(): string[] {
  return Array.from(new Set(holdings.map((h) => h.industry).filter(Boolean))).sort();
}

// ============================================================================
// SYSTEMIC RISK ANALYSIS
// ============================================================================

export interface SystemicBorrower {
  borrower: Borrower;
  fundCount: number;
  totalExposure: number;
  avgExposurePerFund: number;
  maxSingleFundExposure: number;
  systemicScore: number; // Weighted score combining factors
  funds: { fund: Fund; exposure: number; pctOfFundAUM: number }[];
}

/**
 * Get borrowers ranked by systemic importance.
 * Systemic score = (fundCount^2 * totalExposure) / 1e9
 * Borrowers in more funds with larger exposure are more systemically important.
 */
export function getSystemicBorrowers(): SystemicBorrower[] {
  const borrowerData = new Map<
    string,
    {
      borrower: Borrower;
      funds: Map<string, { fund: Fund; exposure: number }>;
      totalExposure: number;
    }
  >();

  for (const holding of holdings) {
    const existing = borrowerData.get(holding.borrowerId) || {
      borrower: borrowers.find((b) => b.id === holding.borrowerId)!,
      funds: new Map(),
      totalExposure: 0,
    };

    const fund = funds.find((f) => f.id === holding.fundId)!;
    const fundEntry = existing.funds.get(holding.fundId) || { fund, exposure: 0 };
    fundEntry.exposure += holding.fairValue;
    existing.funds.set(holding.fundId, fundEntry);
    existing.totalExposure += holding.fairValue;
    borrowerData.set(holding.borrowerId, existing);
  }

  return Array.from(borrowerData.values())
    .filter((d) => d.funds.size > 1) // Only shared borrowers
    .map((d) => {
      const fundCount = d.funds.size;
      const fundsArray = Array.from(d.funds.values()).map((f) => ({
        fund: f.fund,
        exposure: f.exposure,
        pctOfFundAUM: f.fund.totalAssets > 0 ? (f.exposure / f.fund.totalAssets) * 100 : 0,
      }));
      const maxSingleFundExposure = Math.max(...fundsArray.map((f) => f.exposure));
      // Score formula: fundCount^2 * totalExposure (values already in millions)
      // Normalize to readable range (0-100ish for top borrowers)
      const systemicScore = (fundCount ** 2 * d.totalExposure) / 100;

      return {
        borrower: d.borrower,
        fundCount,
        totalExposure: d.totalExposure,
        avgExposurePerFund: d.totalExposure / fundCount,
        maxSingleFundExposure,
        systemicScore,
        funds: fundsArray.sort((a, b) => b.exposure - a.exposure),
      };
    })
    .sort((a, b) => b.systemicScore - a.systemicScore);
}

export interface FundOverlapPair {
  fund1: Fund;
  fund2: Fund;
  sharedBorrowerCount: number;
  sharedExposure: number; // Sum of overlapping exposure
  overlapPct1: number; // % of fund1's AUM in shared borrowers
  overlapPct2: number; // % of fund2's AUM in shared borrowers
  correlationScore: number; // Higher = more correlated risk
}

/**
 * Get pairwise fund overlap data.
 * Shows how correlated two funds are based on shared borrowers.
 */
export function getFundOverlap(): FundOverlapPair[] {
  // Build borrower -> funds map
  const borrowerFunds = new Map<string, Set<string>>();
  const fundBorrowerExposure = new Map<string, Map<string, number>>();

  for (const holding of holdings) {
    // Track which funds each borrower is in
    const fundSet = borrowerFunds.get(holding.borrowerId) || new Set();
    fundSet.add(holding.fundId);
    borrowerFunds.set(holding.borrowerId, fundSet);

    // Track exposure per fund-borrower pair
    const fundMap = fundBorrowerExposure.get(holding.fundId) || new Map();
    fundMap.set(holding.borrowerId, (fundMap.get(holding.borrowerId) || 0) + holding.fairValue);
    fundBorrowerExposure.set(holding.fundId, fundMap);
  }

  const pairs: FundOverlapPair[] = [];

  // Compare each pair of funds
  for (let i = 0; i < funds.length; i++) {
    for (let j = i + 1; j < funds.length; j++) {
      const fund1 = funds[i];
      const fund2 = funds[j];

      const fund1Borrowers = fundBorrowerExposure.get(fund1.id) || new Map();
      const fund2Borrowers = fundBorrowerExposure.get(fund2.id) || new Map();

      // Find shared borrowers
      const sharedBorrowers: string[] = [];
      let sharedExposure1 = 0;
      let sharedExposure2 = 0;

      for (const [borrowerId, exposure1] of fund1Borrowers) {
        if (fund2Borrowers.has(borrowerId)) {
          sharedBorrowers.push(borrowerId);
          sharedExposure1 += exposure1;
          sharedExposure2 += fund2Borrowers.get(borrowerId)!;
        }
      }

      if (sharedBorrowers.length === 0) continue;

      const overlapPct1 = fund1.totalAssets > 0 ? (sharedExposure1 / fund1.totalAssets) * 100 : 0;
      const overlapPct2 = fund2.totalAssets > 0 ? (sharedExposure2 / fund2.totalAssets) * 100 : 0;
      const correlationScore = sharedBorrowers.length * ((overlapPct1 + overlapPct2) / 2);

      pairs.push({
        fund1,
        fund2,
        sharedBorrowerCount: sharedBorrowers.length,
        sharedExposure: sharedExposure1 + sharedExposure2,
        overlapPct1,
        overlapPct2,
        correlationScore,
      });
    }
  }

  return pairs.sort((a, b) => b.correlationScore - a.correlationScore);
}

export interface StressTestResult {
  borrower: Borrower;
  haircutPercent: number;
  totalLoss: number;
  fundImpacts: {
    fund: Fund;
    currentExposure: number;
    loss: number;
    pctOfAUM: number;
    remainingAUM: number;
  }[];
  systemWideImpact: {
    totalAffectedFunds: number;
    totalLoss: number;
    avgPctImpact: number;
    maxPctImpact: number;
  };
}

/**
 * Calculate the impact of a borrower defaulting or trading at a discount.
 * @param borrowerId - The borrower to stress test
 * @param haircutPercent - Loss percentage (0-100). 100 = total default
 */
export function getStressTestImpact(
  borrowerId: string,
  haircutPercent: number
): StressTestResult | null {
  const borrower = borrowers.find((b) => b.id === borrowerId);
  if (!borrower) return null;

  const borrowerHoldings = holdings.filter((h) => h.borrowerId === borrowerId);
  if (borrowerHoldings.length === 0) return null;

  const haircut = Math.min(Math.max(haircutPercent, 0), 100) / 100;

  const fundImpacts = new Map<string, { fund: Fund; exposure: number }>();

  for (const holding of borrowerHoldings) {
    const fund = funds.find((f) => f.id === holding.fundId)!;
    const existing = fundImpacts.get(holding.fundId) || { fund, exposure: 0 };
    existing.exposure += holding.fairValue;
    fundImpacts.set(holding.fundId, existing);
  }

  const impacts = Array.from(fundImpacts.values()).map((f) => {
    const loss = f.exposure * haircut;
    const pctOfAUM = f.fund.totalAssets > 0 ? (loss / f.fund.totalAssets) * 100 : 0;
    return {
      fund: f.fund,
      currentExposure: f.exposure,
      loss,
      pctOfAUM,
      remainingAUM: f.fund.totalAssets - loss,
    };
  });

  const totalLoss = impacts.reduce((sum, i) => sum + i.loss, 0);
  const pctImpacts = impacts.map((i) => i.pctOfAUM);

  return {
    borrower,
    haircutPercent,
    totalLoss,
    fundImpacts: impacts.sort((a, b) => b.loss - a.loss),
    systemWideImpact: {
      totalAffectedFunds: impacts.length,
      totalLoss,
      avgPctImpact:
        pctImpacts.length > 0 ? pctImpacts.reduce((a, b) => a + b, 0) / pctImpacts.length : 0,
      maxPctImpact: Math.max(...pctImpacts, 0),
    },
  };
}

export interface SystemHealthMetrics {
  // Overall exposure
  totalSystemAUM: number;
  totalExposure: number;

  // Concentration risk
  herfindahlIndex: number; // 0-1, higher = more concentrated
  top10BorrowersPct: number;

  // Interconnection risk
  avgFundOverlap: number; // Avg % of AUM in shared borrowers
  maxFundOverlap: number;
  sharedBorrowerRatio: number; // % of borrowers shared by 2+ funds

  // Systemic borrowers
  criticalBorrowers: number; // 4+ funds
  elevatedBorrowers: number; // 2-3 funds
}

/**
 * Calculate system-wide health metrics for the dashboard.
 */
export function getSystemHealthMetrics(): SystemHealthMetrics {
  const totalSystemAUM = funds.reduce((sum, f) => sum + f.totalAssets, 0);
  const totalExposure = holdings.reduce((sum, h) => sum + h.fairValue, 0);

  // Herfindahl index for borrower concentration
  const borrowerExposures = new Map<string, number>();
  for (const h of holdings) {
    borrowerExposures.set(h.borrowerId, (borrowerExposures.get(h.borrowerId) || 0) + h.fairValue);
  }
  const exposureShares = Array.from(borrowerExposures.values()).map((e) =>
    totalExposure > 0 ? e / totalExposure : 0
  );
  const herfindahlIndex = exposureShares.reduce((sum, s) => sum + s * s, 0);

  // Top 10 borrowers concentration
  const sortedExposures = Array.from(borrowerExposures.values()).sort((a, b) => b - a);
  const top10Exposure = sortedExposures.slice(0, 10).reduce((sum, e) => sum + e, 0);
  const top10BorrowersPct = totalExposure > 0 ? (top10Exposure / totalExposure) * 100 : 0;

  // Fund overlap stats
  const overlaps = getFundOverlap();
  const overlapPcts = overlaps.flatMap((o) => [o.overlapPct1, o.overlapPct2]);
  const avgFundOverlap =
    overlapPcts.length > 0 ? overlapPcts.reduce((a, b) => a + b, 0) / overlapPcts.length : 0;
  const maxFundOverlap = Math.max(...overlapPcts, 0);

  // Shared borrower ratio
  const sharedBorrowers = getSharedBorrowers();
  const sharedBorrowerRatio =
    borrowers.length > 0 ? (sharedBorrowers.length / borrowers.length) * 100 : 0;

  // Critical/elevated counts
  const criticalBorrowers = sharedBorrowers.filter((b) => b.funds.length >= 4).length;
  const elevatedBorrowers = sharedBorrowers.filter(
    (b) => b.funds.length >= 2 && b.funds.length < 4
  ).length;

  return {
    totalSystemAUM,
    totalExposure,
    herfindahlIndex,
    top10BorrowersPct,
    avgFundOverlap,
    maxFundOverlap,
    sharedBorrowerRatio,
    criticalBorrowers,
    elevatedBorrowers,
  };
}
