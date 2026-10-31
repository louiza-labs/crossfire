/**
 * Upload normalized funds data to Vercel Blob
 */

import { put } from "@vercel/blob";
import * as fs from "fs";
import * as path from "path";

const BLOB_PATH = "funds-data/funds.json";

async function upload() {
  const dataPath = path.join(process.cwd(), "src", "data", "funds-normalized.json");

  if (!fs.existsSync(dataPath)) {
    console.error("Error: funds-normalized.json not found. Run normalize first.");
    process.exit(1);
  }

  const data = fs.readFileSync(dataPath, "utf-8");

  console.log("Uploading to Vercel Blob...");

  const blob = await put(BLOB_PATH, data, {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });

  console.log(`Uploaded successfully: ${blob.url}`);
  console.log(`Size: ${(data.length / 1024 / 1024).toFixed(2)} MB`);
}

upload().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});
