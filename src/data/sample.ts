// Sample data matching our graph model
// This will be replaced with real SEC EDGAR data

export interface Manager {
  id: string;
  name: string;
  aum: number; // in billions
}

export interface Fund {
  id: string;
  name: string;
  managerId: string;
  type: "BDC" | "CLO" | "Interval Fund";
  totalAssets: number; // in millions
  ticker?: string;
}

export interface Holding {
  id: string;
  fundId: string;
  borrowerId: string;
  principal: number; // in millions
  rate: number; // percentage
  maturity: string; // date string
  industry: string;
  fairValue: number; // in millions
}

export interface Borrower {
  id: string;
  name: string;
  normalizedName: string;
  industry: string;
}

export interface Investor {
  id: string;
  name: string;
  type: "Pension Fund" | "Insurance" | "Endowment" | "Asset Manager" | "Other";
}

export interface FundInvestor {
  investorId: string;
  fundId: string;
  shares: number;
  percentOwnership: number;
}

// Sample Managers
export const managers: Manager[] = [
  { id: "m1", name: "Ares Management", aum: 428 },
  { id: "m2", name: "Blue Owl Capital", aum: 235 },
  { id: "m3", name: "Blackstone", aum: 1076 },
  { id: "m4", name: "Apollo Global", aum: 651 },
  { id: "m5", name: "Golub Capital", aum: 70 },
];

// Sample Funds (BDCs)
export const funds: Fund[] = [
  { id: "f1", name: "Ares Capital Corporation", managerId: "m1", type: "BDC", totalAssets: 25400, ticker: "ARCC" },
  { id: "f2", name: "Blue Owl Capital Corporation", managerId: "m2", type: "BDC", totalAssets: 13200, ticker: "OBDC" },
  { id: "f3", name: "Blackstone Secured Lending Fund", managerId: "m3", type: "BDC", totalAssets: 11800, ticker: "BXSL" },
  { id: "f4", name: "Apollo Senior Floating Rate Fund", managerId: "m4", type: "Interval Fund", totalAssets: 1200, ticker: "AFT" },
  { id: "f5", name: "Golub Capital BDC", managerId: "m5", type: "BDC", totalAssets: 6100, ticker: "GBDC" },
];

// Sample Borrowers
export const borrowers: Borrower[] = [
  { id: "b1", name: "Avalara Inc", normalizedName: "avalara", industry: "Software" },
  { id: "b2", name: "Mindbody Inc", normalizedName: "mindbody", industry: "Software" },
  { id: "b3", name: "Press Ganey Associates", normalizedName: "press ganey", industry: "Healthcare Services" },
  { id: "b4", name: "Therapy Brands Holdings", normalizedName: "therapy brands", industry: "Healthcare IT" },
  { id: "b5", name: "Cornerstone OnDemand", normalizedName: "cornerstone ondemand", industry: "Software" },
  { id: "b6", name: "Ivanti Software", normalizedName: "ivanti", industry: "Software" },
  { id: "b7", name: "LogMeIn Inc", normalizedName: "logmein", industry: "Software" },
  { id: "b8", name: "Coyote Logistics", normalizedName: "coyote logistics", industry: "Transportation" },
  { id: "b9", name: "Confluent Health", normalizedName: "confluent health", industry: "Healthcare Services" },
  { id: "b10", name: "Datto Inc", normalizedName: "datto", industry: "Software" },
  { id: "b11", name: "Finastra", normalizedName: "finastra", industry: "Financial Software" },
  { id: "b12", name: "Solera Holdings", normalizedName: "solera", industry: "Insurance Tech" },
];

// Sample Holdings - creates interconnection (multiple funds lending to same borrowers)
export const holdings: Holding[] = [
  // Ares Capital holdings
  { id: "h1", fundId: "f1", borrowerId: "b1", principal: 245, rate: 11.5, maturity: "2028-06-15", industry: "Software", fairValue: 242 },
  { id: "h2", fundId: "f1", borrowerId: "b2", principal: 180, rate: 10.75, maturity: "2027-09-30", industry: "Software", fairValue: 178 },
  { id: "h3", fundId: "f1", borrowerId: "b3", principal: 320, rate: 12.0, maturity: "2029-03-15", industry: "Healthcare Services", fairValue: 318 },
  { id: "h4", fundId: "f1", borrowerId: "b6", principal: 150, rate: 11.25, maturity: "2028-12-01", industry: "Software", fairValue: 148 },
  { id: "h5", fundId: "f1", borrowerId: "b11", principal: 275, rate: 11.0, maturity: "2029-06-30", industry: "Financial Software", fairValue: 270 },

  // Blue Owl holdings - note overlap with Ares on some borrowers
  { id: "h6", fundId: "f2", borrowerId: "b1", principal: 185, rate: 11.5, maturity: "2028-06-15", industry: "Software", fairValue: 183 },
  { id: "h7", fundId: "f2", borrowerId: "b4", principal: 220, rate: 12.25, maturity: "2027-12-15", industry: "Healthcare IT", fairValue: 215 },
  { id: "h8", fundId: "f2", borrowerId: "b5", principal: 195, rate: 11.0, maturity: "2028-09-01", industry: "Software", fairValue: 193 },
  { id: "h9", fundId: "f2", borrowerId: "b7", principal: 310, rate: 10.5, maturity: "2027-06-30", industry: "Software", fairValue: 305 },
  { id: "h10", fundId: "f2", borrowerId: "b11", principal: 165, rate: 11.0, maturity: "2029-06-30", industry: "Financial Software", fairValue: 162 },

  // Blackstone holdings - more overlap
  { id: "h11", fundId: "f3", borrowerId: "b3", principal: 280, rate: 12.0, maturity: "2029-03-15", industry: "Healthcare Services", fairValue: 278 },
  { id: "h12", fundId: "f3", borrowerId: "b6", principal: 225, rate: 11.25, maturity: "2028-12-01", industry: "Software", fairValue: 222 },
  { id: "h13", fundId: "f3", borrowerId: "b8", principal: 175, rate: 10.25, maturity: "2027-03-15", industry: "Transportation", fairValue: 173 },
  { id: "h14", fundId: "f3", borrowerId: "b9", principal: 145, rate: 11.75, maturity: "2028-06-01", industry: "Healthcare Services", fairValue: 143 },
  { id: "h15", fundId: "f3", borrowerId: "b12", principal: 340, rate: 11.5, maturity: "2029-09-30", industry: "Insurance Tech", fairValue: 335 },

  // Apollo holdings
  { id: "h16", fundId: "f4", borrowerId: "b5", principal: 95, rate: 11.0, maturity: "2028-09-01", industry: "Software", fairValue: 94 },
  { id: "h17", fundId: "f4", borrowerId: "b10", principal: 125, rate: 10.75, maturity: "2028-03-15", industry: "Software", fairValue: 123 },
  { id: "h18", fundId: "f4", borrowerId: "b12", principal: 180, rate: 11.5, maturity: "2029-09-30", industry: "Insurance Tech", fairValue: 177 },

  // Golub holdings
  { id: "h19", fundId: "f5", borrowerId: "b2", principal: 135, rate: 10.75, maturity: "2027-09-30", industry: "Software", fairValue: 133 },
  { id: "h20", fundId: "f5", borrowerId: "b4", principal: 165, rate: 12.25, maturity: "2027-12-15", industry: "Healthcare IT", fairValue: 162 },
  { id: "h21", fundId: "f5", borrowerId: "b7", principal: 200, rate: 10.5, maturity: "2027-06-30", industry: "Software", fairValue: 197 },
  { id: "h22", fundId: "f5", borrowerId: "b9", principal: 110, rate: 11.75, maturity: "2028-06-01", industry: "Healthcare Services", fairValue: 108 },
];

// Sample Investors
export const investors: Investor[] = [
  { id: "i1", name: "CalPERS", type: "Pension Fund" },
  { id: "i2", name: "New York State Common Retirement Fund", type: "Pension Fund" },
  { id: "i3", name: "MetLife Investment Management", type: "Insurance" },
  { id: "i4", name: "Harvard Management Company", type: "Endowment" },
  { id: "i5", name: "BlackRock", type: "Asset Manager" },
  { id: "i6", name: "Vanguard", type: "Asset Manager" },
];

// Sample Fund-Investor relationships
export const fundInvestors: FundInvestor[] = [
  { investorId: "i1", fundId: "f1", shares: 15000000, percentOwnership: 2.8 },
  { investorId: "i2", fundId: "f1", shares: 12500000, percentOwnership: 2.3 },
  { investorId: "i5", fundId: "f1", shares: 45000000, percentOwnership: 8.4 },
  { investorId: "i6", fundId: "f1", shares: 52000000, percentOwnership: 9.7 },

  { investorId: "i1", fundId: "f2", shares: 8500000, percentOwnership: 3.2 },
  { investorId: "i3", fundId: "f2", shares: 11000000, percentOwnership: 4.1 },
  { investorId: "i5", fundId: "f2", shares: 28000000, percentOwnership: 10.5 },

  { investorId: "i2", fundId: "f3", shares: 9200000, percentOwnership: 2.9 },
  { investorId: "i4", fundId: "f3", shares: 5500000, percentOwnership: 1.7 },
  { investorId: "i6", fundId: "f3", shares: 38000000, percentOwnership: 12.0 },

  { investorId: "i3", fundId: "f5", shares: 4200000, percentOwnership: 3.5 },
  { investorId: "i5", fundId: "f5", shares: 15000000, percentOwnership: 12.5 },
];

// Helper functions
export function getFundsByManager(managerId: string): Fund[] {
  return funds.filter(f => f.managerId === managerId);
}

export function getHoldingsByFund(fundId: string): (Holding & { borrower: Borrower })[] {
  return holdings
    .filter(h => h.fundId === fundId)
    .map(h => ({
      ...h,
      borrower: borrowers.find(b => b.id === h.borrowerId)!
    }));
}

export function getFundsByBorrower(borrowerId: string): (Holding & { fund: Fund })[] {
  return holdings
    .filter(h => h.borrowerId === borrowerId)
    .map(h => ({
      ...h,
      fund: funds.find(f => f.id === h.fundId)!
    }));
}

export function getSharedBorrowers(): { borrower: Borrower; funds: Fund[]; totalExposure: number }[] {
  const borrowerFundMap = new Map<string, { funds: Set<string>; totalExposure: number }>();

  for (const holding of holdings) {
    const current = borrowerFundMap.get(holding.borrowerId) || { funds: new Set(), totalExposure: 0 };
    current.funds.add(holding.fundId);
    current.totalExposure += holding.principal;
    borrowerFundMap.set(holding.borrowerId, current);
  }

  return Array.from(borrowerFundMap.entries())
    .filter(([_, data]) => data.funds.size > 1)
    .map(([borrowerId, data]) => ({
      borrower: borrowers.find(b => b.id === borrowerId)!,
      funds: Array.from(data.funds).map(fid => funds.find(f => f.id === fid)!),
      totalExposure: data.totalExposure
    }))
    .sort((a, b) => b.funds.length - a.funds.length);
}

export function getInvestorsByFund(fundId: string): (FundInvestor & { investor: Investor })[] {
  return fundInvestors
    .filter(fi => fi.fundId === fundId)
    .map(fi => ({
      ...fi,
      investor: investors.find(i => i.id === fi.investorId)!
    }))
    .sort((a, b) => b.percentOwnership - a.percentOwnership);
}

export function getFundsByInvestor(investorId: string): (FundInvestor & { fund: Fund })[] {
  return fundInvestors
    .filter(fi => fi.investorId === investorId)
    .map(fi => ({
      ...fi,
      fund: funds.find(f => f.id === fi.fundId)!
    }));
}
