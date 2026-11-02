import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export async function GET() {
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
      <svg width="360" height="360" viewBox="0 0 360 360" fill="none">
        <g stroke="#e0f2fe" strokeWidth="14" strokeLinecap="round">
          <line x1="180" y1="50" x2="180" y2="130" />
          <line x1="180" y1="230" x2="180" y2="310" />
          <line x1="50" y1="180" x2="130" y2="180" />
          <line x1="230" y1="180" x2="310" y2="180" />
          <circle cx="180" cy="180" r="50" fill="none" />
          <circle cx="180" cy="180" r="115" fill="none" opacity="0.3" />
        </g>
      </svg>
    </div>,
    {
      width: 512,
      height: 512,
    }
  );
}
