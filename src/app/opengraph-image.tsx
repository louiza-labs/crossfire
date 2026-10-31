import { ImageResponse } from "@vercel/og";

export const runtime = "nodejs";
export const alt = "Crossfire — Private Credit Intelligence";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#000000",
          padding: "60px 80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Background pattern - grid lines */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle at center, rgba(239,68,68,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Logo */}
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <span style={{ fontSize: "32px", fontWeight: 600, color: "#ffffff" }}>
            Crossfire
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <h1
            style={{
              fontSize: "72px",
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.1,
              margin: 0,
              marginBottom: "24px",
            }}
          >
            Private Credit
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Intelligence
            </span>
          </h1>

          <p
            style={{
              fontSize: "24px",
              color: "#71717a",
              margin: 0,
              maxWidth: "700px",
            }}
          >
            Exposing systemic risk across BDC funds. Map shared borrowers, analyze interconnections, stress test defaults.
          </p>
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: "flex",
            gap: "48px",
            marginTop: "48px",
            paddingTop: "32px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "40px", fontWeight: 700, color: "#ffffff" }}>22</span>
            <span style={{ fontSize: "14px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              BDC Funds
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "40px", fontWeight: 700, color: "#ffffff" }}>3,500+</span>
            <span style={{ fontSize: "14px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Borrowers
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "40px", fontWeight: 700, color: "#ef4444" }}>451</span>
            <span style={{ fontSize: "14px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Shared Exposures
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
