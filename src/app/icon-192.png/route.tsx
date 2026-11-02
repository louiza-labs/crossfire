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
      <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
        <g stroke="#e0f2fe" strokeWidth="6" strokeLinecap="round">
          <line x1="70" y1="20" x2="70" y2="50" />
          <line x1="70" y1="90" x2="70" y2="120" />
          <line x1="20" y1="70" x2="50" y2="70" />
          <line x1="90" y1="70" x2="120" y2="70" />
          <circle cx="70" cy="70" r="20" fill="none" />
          <circle cx="70" cy="70" r="45" fill="none" opacity="0.3" />
        </g>
      </svg>
    </div>,
    {
      width: 192,
      height: 192,
    }
  );
}
