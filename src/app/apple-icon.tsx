import { ImageResponse } from "@vercel/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0c",
        borderRadius: "40px",
      }}
    >
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        {/* Crosshairs */}
        <g stroke="#e0f2fe" strokeWidth="4" strokeLinecap="round">
          <line x1="60" y1="20" x2="60" y2="40" />
          <line x1="60" y1="80" x2="60" y2="100" />
          <line x1="20" y1="60" x2="40" y2="60" />
          <line x1="80" y1="60" x2="100" y2="60" />
          {/* Center circle */}
          <circle cx="60" cy="60" r="15" fill="none" />
          {/* Outer ring */}
          <circle cx="60" cy="60" r="35" fill="none" opacity="0.4" />
        </g>
      </svg>
    </div>,
    {
      ...size,
    }
  );
}
