import { ImageResponse } from "@vercel/og";
import { getSystemHealthMetrics, getSystemicBorrowers, funds } from "@/data";

export const runtime = "nodejs";
export const alt = "Crossfire Dashboard — Credit Exposure Monitor";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const metrics = getSystemHealthMetrics();
  const topBorrowers = getSystemicBorrowers().slice(0, 3);

  const formatCurrency = (value: number): string => {
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}B`;
    if (value >= 1) return `$${value.toFixed(0)}M`;
    return `$${(value * 1000).toFixed(0)}K`;
  };

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#000000",
          padding: "50px 60px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Background */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <span style={{ fontSize: "24px", fontWeight: 600, color: "#ffffff" }}>Crossfire</span>
          </div>
          <span style={{ fontSize: "14px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.15em" }}>
            Credit Exposure Monitor
          </span>
        </div>

        {/* Main metrics */}
        <div style={{ display: "flex", gap: "24px", marginTop: "40px" }}>
          <div
            style={{
              flex: 1,
              padding: "24px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span style={{ fontSize: "12px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              System AUM
            </span>
            <span style={{ fontSize: "36px", fontWeight: 700, color: "#ffffff", marginTop: "8px" }}>
              {formatCurrency(metrics.totalSystemAUM)}
            </span>
          </div>
          <div
            style={{
              flex: 1,
              padding: "24px",
              background: "rgba(239,68,68,0.1)",
              borderRadius: "12px",
              border: "1px solid rgba(239,68,68,0.2)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span style={{ fontSize: "12px", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Critical Borrowers
            </span>
            <span style={{ fontSize: "36px", fontWeight: 700, color: "#ef4444", marginTop: "8px" }}>
              {metrics.criticalBorrowers}
            </span>
            <span style={{ fontSize: "12px", color: "#71717a", marginTop: "4px" }}>4+ funds exposed</span>
          </div>
          <div
            style={{
              flex: 1,
              padding: "24px",
              background: "rgba(245,158,11,0.1)",
              borderRadius: "12px",
              border: "1px solid rgba(245,158,11,0.2)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span style={{ fontSize: "12px", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Elevated Risk
            </span>
            <span style={{ fontSize: "36px", fontWeight: 700, color: "#f59e0b", marginTop: "8px" }}>
              {metrics.elevatedBorrowers}
            </span>
            <span style={{ fontSize: "12px", color: "#71717a", marginTop: "4px" }}>2-3 funds exposed</span>
          </div>
          <div
            style={{
              flex: 1,
              padding: "24px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span style={{ fontSize: "12px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              BDC Funds
            </span>
            <span style={{ fontSize: "36px", fontWeight: 700, color: "#ffffff", marginTop: "8px" }}>
              {funds.length}
            </span>
          </div>
        </div>

        {/* Top systemic borrowers */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "12px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
            Top Systemic Borrowers
          </span>
          <div style={{ display: "flex", gap: "16px" }}>
            {topBorrowers.map((b, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  padding: "16px 20px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff" }}>
                    {b.borrower.name.length > 20 ? b.borrower.name.slice(0, 20) + "..." : b.borrower.name}
                  </span>
                  <span style={{ fontSize: "12px", color: "#71717a" }}>{formatCurrency(b.totalExposure)} exposure</span>
                </div>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    background: b.fundCount >= 4 ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: b.fundCount >= 4 ? "#ef4444" : "#f59e0b",
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  {b.fundCount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
