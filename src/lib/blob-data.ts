/**
 * Data loading from Vercel Blob storage
 * Falls back to static JSON files in development or if blob fetch fails
 */

import { list, head } from "@vercel/blob";

const BLOB_PREFIX = "funds-data/";
const FUNDS_BLOB_PATH = `${BLOB_PREFIX}funds.json`;

export interface BlobFundsData {
  funds: FundData[];
  lastUpdated: string;
}

export interface FundData {
  name: string;
  ticker: string;
  cik: string;
  filingDate: string;
  holdings: HoldingData[];
}

export interface HoldingData {
  borrower: string;
  industry: string;
  investmentType: string;
  rate: number | null;
  maturity: string;
  principal: number;
  fairValue: number;
  gicsSector?: string;
  gicsIndustryGroup?: string;
  industryConfidence?: "high" | "medium" | "low";
  dataQualityScore?: number;
}

/**
 * Get the URL for the latest funds data blob
 */
export async function getFundsDataUrl(): Promise<string | null> {
  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX });
    const fundsBlob = blobs.find((b) => b.pathname === FUNDS_BLOB_PATH);
    return fundsBlob?.url ?? null;
  } catch (error) {
    console.error("Failed to list blobs:", error);
    return null;
  }
}

/**
 * Fetch funds data from Vercel Blob
 * Returns null if blob doesn't exist or fetch fails
 */
export async function fetchFundsFromBlob(): Promise<FundData[] | null> {
  try {
    const url = await getFundsDataUrl();
    if (!url) {
      console.log("No funds data blob found");
      return null;
    }

    const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.status}`);
    }

    const data = await response.json();
    return data as FundData[];
  } catch (error) {
    console.error("Failed to fetch funds from blob:", error);
    return null;
  }
}

/**
 * Check when the funds data was last updated
 */
export async function getLastUpdated(): Promise<Date | null> {
  try {
    const blob = await head(FUNDS_BLOB_PATH);
    return blob?.uploadedAt ? new Date(blob.uploadedAt) : null;
  } catch {
    return null;
  }
}
