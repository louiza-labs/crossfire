/**
 * Debug script to inspect raw SEC filing HTML
 * Usage: pnpm tsx scripts/debug-filing.ts TICKER
 *
 * This downloads the latest 10-Q for a fund and saves the Schedule of Investments
 * section to a file you can inspect.
 */

import * as cheerio from "cheerio";
import * as fs from "fs";

const USER_AGENT = "Capital Research contact@capital.dev";

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

async function main() {
  const ticker = process.argv[2]?.toUpperCase();

  if (!ticker || !BDCS[ticker]) {
    console.log("Usage: pnpm tsx scripts/debug-filing.ts TICKER");
    console.log("\nAvailable tickers:", Object.keys(BDCS).join(", "));
    process.exit(1);
  }

  const cik = BDCS[ticker];
  console.log(`Fetching latest 10-Q for ${ticker} (CIK: ${cik})...`);

  const filing = await getLatestFiling(cik);
  if (!filing) {
    console.log("No filing found");
    process.exit(1);
  }

  console.log(`Filing date: ${filing.date}`);
  console.log(`URL: ${filing.url}`);
  console.log("\nDownloading...");

  const html = await fetchWithRetry(filing.url);
  const $ = cheerio.load(html);

  // Find Schedule of Investments
  let scheduleHtml = "";
  let foundSchedule = false;

  $("table").each((_, table) => {
    const tableText = $(table).text().toLowerCase();
    if (
      tableText.includes("schedule of investments") ||
      tableText.includes("consolidated schedule") ||
      (tableText.includes("fair value") && tableText.includes("principal"))
    ) {
      if (!foundSchedule) {
        foundSchedule = true;
        // Get surrounding context
        const parent = $(table).parent();
        scheduleHtml = $.html(parent);
      }
    }
  });

  if (!scheduleHtml) {
    // Just grab first large table
    $("table").each((i, table) => {
      if (i < 3) {
        scheduleHtml += `\n\n=== TABLE ${i} ===\n`;
        scheduleHtml += $.html(table);
      }
    });
  }

  // Find tables that look like investment schedules
  console.log("\n=== SEARCHING FOR INVESTMENT TABLES ===\n");

  const investmentTables: { index: number; preview: string; html: string }[] = [];

  $("table").each((tableIdx, table) => {
    const tableText = $(table).text().toLowerCase();

    // Look for investment-related tables
    const hasInvestmentKeywords =
      (tableText.includes("first lien") ||
        tableText.includes("senior secured") ||
        tableText.includes("fair value") ||
        tableText.includes("principal")) &&
      (tableText.includes("sofr") ||
        tableText.includes("maturity") ||
        /\d{1,2}\/\d{1,2}\/\d{4}/.test(tableText));

    if (hasInvestmentKeywords) {
      const rows: string[] = [];
      $(table)
        .find("tr")
        .slice(0, 15)
        .each((_, row) => {
          const cells: string[] = [];
          $(row)
            .find("td, th")
            .each((_, cell) => {
              const text = $(cell).text().trim().replace(/\s+/g, " ").substring(0, 60);
              if (text) cells.push(text);
            });
          if (cells.length > 0) {
            rows.push(cells.join(" | "));
          }
        });

      investmentTables.push({
        index: tableIdx,
        preview: rows.join("\n"),
        html: $.html(table),
      });
    }
  });

  console.log(`Found ${investmentTables.length} investment-related tables\n`);

  investmentTables.slice(0, 3).forEach((t, i) => {
    console.log(`\n=== TABLE ${t.index} (Investment Table #${i + 1}) ===`);
    console.log(t.preview.split("\n").slice(0, 15).join("\n"));
  });

  // Save first investment table HTML
  if (investmentTables.length > 0) {
    scheduleHtml = investmentTables.map((t) => t.html).join("\n\n<hr>\n\n");
  }

  // Save full HTML
  const outFile = `scripts/debug-${ticker.toLowerCase()}-filing.html`;
  fs.writeFileSync(outFile, scheduleHtml || html.substring(0, 500000));
  console.log(`\nFull HTML saved to: ${outFile}`);
  console.log("Open this file in a browser to inspect the table structure.");
}

main().catch(console.error);
