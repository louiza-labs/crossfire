/**
 * API route to serve funds data
 * Fetches from Vercel Blob with fallback to static JSON
 */

import { NextResponse } from "next/server";
import { fetchFundsFromBlob, getLastUpdated } from "@/lib/blob-data";
import fundsData from "@/data/funds.json";

export async function GET() {
  // Try to fetch from blob first
  const blobData = await fetchFundsFromBlob();

  if (blobData) {
    const lastUpdated = await getLastUpdated();
    return NextResponse.json({
      source: "blob",
      lastUpdated: lastUpdated?.toISOString() ?? null,
      funds: blobData,
    });
  }

  // Fall back to static JSON
  return NextResponse.json({
    source: "static",
    lastUpdated: null,
    funds: fundsData,
  });
}
