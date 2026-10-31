import { describe, it, expect } from "vitest";
import {
  funds,
  borrowers,
  holdings,
  getSystemicBorrowers,
  getFundOverlap,
  getStressTestImpact,
  getSystemHealthMetrics,
  getSharedBorrowers,
  getHoldingsByFund,
  getFundsByBorrower,
} from "./index";

describe("Data Layer", () => {
  describe("Static Data", () => {
    it("should have funds loaded", () => {
      expect(funds.length).toBeGreaterThan(0);
      expect(funds[0]).toHaveProperty("id");
      expect(funds[0]).toHaveProperty("ticker");
      expect(funds[0]).toHaveProperty("name");
    });

    it("should have borrowers loaded", () => {
      expect(borrowers.length).toBeGreaterThan(0);
      expect(borrowers[0]).toHaveProperty("id");
      expect(borrowers[0]).toHaveProperty("name");
    });

    it("should have holdings loaded", () => {
      expect(holdings.length).toBeGreaterThan(0);
      expect(holdings[0]).toHaveProperty("fundId");
      expect(holdings[0]).toHaveProperty("borrowerId");
      expect(holdings[0]).toHaveProperty("principal");
      expect(holdings[0]).toHaveProperty("fairValue");
    });
  });

  describe("getSharedBorrowers", () => {
    it("should return borrowers with multiple fund exposures", () => {
      const shared = getSharedBorrowers();
      expect(Array.isArray(shared)).toBe(true);

      // All shared borrowers should have 2+ funds
      for (const item of shared) {
        expect(item.funds.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("should be sorted by fund count descending", () => {
      const shared = getSharedBorrowers();
      for (let i = 1; i < shared.length; i++) {
        expect(shared[i - 1].funds.length).toBeGreaterThanOrEqual(shared[i].funds.length);
      }
    });
  });

  describe("getSystemicBorrowers", () => {
    it("should return borrowers with systemic scores", () => {
      const systemic = getSystemicBorrowers();
      expect(Array.isArray(systemic)).toBe(true);

      for (const item of systemic) {
        expect(item).toHaveProperty("borrower");
        expect(item).toHaveProperty("fundCount");
        expect(item).toHaveProperty("totalExposure");
        expect(item).toHaveProperty("systemicScore");
        expect(item.systemicScore).toBeGreaterThan(0);
      }
    });

    it("should be sorted by systemic score descending", () => {
      const systemic = getSystemicBorrowers();
      for (let i = 1; i < systemic.length; i++) {
        expect(systemic[i - 1].systemicScore).toBeGreaterThanOrEqual(systemic[i].systemicScore);
      }
    });
  });

  describe("getFundOverlap", () => {
    it("should return fund pairs with shared borrowers", () => {
      const overlaps = getFundOverlap();
      expect(Array.isArray(overlaps)).toBe(true);

      for (const pair of overlaps) {
        expect(pair).toHaveProperty("fund1");
        expect(pair).toHaveProperty("fund2");
        expect(pair).toHaveProperty("sharedBorrowerCount");
        expect(pair.sharedBorrowerCount).toBeGreaterThan(0);
      }
    });
  });

  describe("getStressTestImpact", () => {
    it("should return null for non-existent borrower", () => {
      const result = getStressTestImpact("non-existent-id", 50);
      expect(result).toBeNull();
    });

    it("should calculate impact for valid borrower", () => {
      const systemic = getSystemicBorrowers();
      if (systemic.length === 0) return;

      const borrowerId = systemic[0].borrower.id;
      const result = getStressTestImpact(borrowerId, 50);

      expect(result).not.toBeNull();
      expect(result!.haircutPercent).toBe(50);
      expect(result!.totalLoss).toBeGreaterThan(0);
      expect(result!.fundImpacts.length).toBeGreaterThan(0);
    });

    it("should scale loss linearly with haircut percentage", () => {
      const systemic = getSystemicBorrowers();
      if (systemic.length === 0) return;

      const borrowerId = systemic[0].borrower.id;
      const result25 = getStressTestImpact(borrowerId, 25);
      const result50 = getStressTestImpact(borrowerId, 50);
      const result100 = getStressTestImpact(borrowerId, 100);

      expect(result50!.totalLoss).toBeCloseTo(result25!.totalLoss * 2, 0);
      expect(result100!.totalLoss).toBeCloseTo(result50!.totalLoss * 2, 0);
    });
  });

  describe("getSystemHealthMetrics", () => {
    it("should return all required metrics", () => {
      const metrics = getSystemHealthMetrics();

      expect(metrics).toHaveProperty("totalSystemAUM");
      expect(metrics).toHaveProperty("totalExposure");
      expect(metrics).toHaveProperty("herfindahlIndex");
      expect(metrics).toHaveProperty("top10BorrowersPct");
      expect(metrics).toHaveProperty("avgFundOverlap");
      expect(metrics).toHaveProperty("maxFundOverlap");
      expect(metrics).toHaveProperty("criticalBorrowers");
      expect(metrics).toHaveProperty("elevatedBorrowers");
    });

    it("should have reasonable metric values", () => {
      const metrics = getSystemHealthMetrics();

      expect(metrics.totalSystemAUM).toBeGreaterThan(0);
      expect(metrics.herfindahlIndex).toBeGreaterThanOrEqual(0);
      expect(metrics.herfindahlIndex).toBeLessThanOrEqual(1);
      expect(metrics.top10BorrowersPct).toBeGreaterThanOrEqual(0);
      expect(metrics.top10BorrowersPct).toBeLessThanOrEqual(100);
    });
  });

  describe("Lookup Functions", () => {
    it("getHoldingsByFund should return holdings for valid fund", () => {
      const fund = funds[0];
      const fundHoldings = getHoldingsByFund(fund.id);

      expect(Array.isArray(fundHoldings)).toBe(true);
      for (const h of fundHoldings) {
        expect(h.fundId).toBe(fund.id);
        expect(h).toHaveProperty("borrower");
      }
    });

    it("getFundsByBorrower should return funds for valid borrower", () => {
      const systemic = getSystemicBorrowers();
      if (systemic.length === 0) return;

      const borrower = systemic[0].borrower;
      const borrowerFunds = getFundsByBorrower(borrower.id);

      expect(Array.isArray(borrowerFunds)).toBe(true);
      expect(borrowerFunds.length).toBeGreaterThanOrEqual(2);
      for (const h of borrowerFunds) {
        expect(h.borrowerId).toBe(borrower.id);
        expect(h).toHaveProperty("fund");
      }
    });
  });
});
