import { ImageResponse } from "@vercel/og";

export const alt = "Crossfire — Private Credit Intelligence";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#050506",
        padding: "60px 80px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Background pattern - subtle grid */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "linear-gradient(rgba(224,242,254,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(224,242,254,0.015) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Accent glow */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle at center, rgba(224,242,254,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* Logo - Crosshairs */}
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "14px",
            backgroundColor: "#0a0a0c",
            border: "1px solid rgba(224,242,254,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <g stroke="#e0f2fe" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="18" y2="13" />
              <line x1="18" y1="23" x2="18" y2="30" />
              <line x1="6" y1="18" x2="13" y2="18" />
              <line x1="23" y1="18" x2="30" y2="18" />
              <circle cx="18" cy="18" r="5" fill="none" />
            </g>
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: "30px",
              fontWeight: 600,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            Crossfire
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Intelligence
          </span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
        <h1
          style={{
            fontSize: "68px",
            fontWeight: 600,
            color: "#ffffff",
            lineHeight: 1.05,
            margin: 0,
            marginBottom: "24px",
            letterSpacing: "-0.03em",
          }}
        >
          Private Credit
          <br />
          <span style={{ color: "#e0f2fe" }}>Risk Analysis</span>
        </h1>

        <p
          style={{
            fontSize: "22px",
            color: "rgba(255,255,255,0.45)",
            margin: 0,
            maxWidth: "680px",
            lineHeight: 1.5,
          }}
        >
          Map shared borrowers across BDC funds. Analyze interconnections. Stress test default
          scenarios.
        </p>
      </div>

      {/* Stats bar */}
      <div
        style={{
          display: "flex",
          gap: "64px",
          marginTop: "48px",
          paddingTop: "32px",
          borderTop: "1px solid rgba(224,242,254,0.06)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: "38px",
              fontWeight: 600,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            41
          </span>
          <span
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            BDC Funds
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: "38px",
              fontWeight: 600,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            3,500+
          </span>
          <span
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            Borrowers
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: "38px",
              fontWeight: 600,
              color: "#e0f2fe",
              letterSpacing: "-0.02em",
            }}
          >
            $120B+
          </span>
          <span
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            Total Exposure
          </span>
        </div>
      </div>
    </div>,
    {
      ...size,
    }
  );
}
