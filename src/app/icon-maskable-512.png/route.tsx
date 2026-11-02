import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export async function GET() {
  // Maskable icons need a safe zone - content should be within the center 80%
  // The outer 10% on each side may be clipped by different device shapes
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0c",
      }}
    >
      {/* Centered within safe zone (80% of 512 = 410px, so icon ~280px) */}
      <svg width="280" height="280" viewBox="0 0 280 280" fill="none">
        <g stroke="#e0f2fe" strokeWidth="12" strokeLinecap="round">
          <line x1="140" y1="40" x2="140" y2="100" />
          <line x1="140" y1="180" x2="140" y2="240" />
          <line x1="40" y1="140" x2="100" y2="140" />
          <line x1="180" y1="140" x2="240" y2="140" />
          <circle cx="140" cy="140" r="40" fill="none" />
          <circle cx="140" cy="140" r="90" fill="none" opacity="0.3" />
        </g>
      </svg>
    </div>,
    {
      width: 512,
      height: 512,
    }
  );
}
