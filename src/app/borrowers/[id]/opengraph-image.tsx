import { ImageResponse } from "@vercel/og";
import { borrowers, getFundsByBorrower } from "@/data";

export const alt = "Crossfire — Borrower Details";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export async function generateImageMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const borrower = borrowers.find((b) => b.id === id);
  return [
    {
      id: "og",
      alt: borrower ? `${borrower.name} — Crossfire` : "Borrower — Crossfire",
      size: { width: 1200, height: 630 },
      contentType: "image/png",
    },
  ];
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const borrower = borrowers.find((b) => b.id === id);

  if (!borrower) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontSize: "48px" }}>Borrower not found</span>
        </div>
      ),
      { ...size }
    );
  }

  const fundHoldings = getFundsByBorrower(borrower.id);
  const totalDebt = fundHoldings.reduce((sum, h) => sum + h.principal, 0);
  const fundCount = fundHoldings.length;
  const avgRate = fundCount > 0 ? fundHoldings.reduce((sum, h) => sum + h.rate, 0) / fundCount : 0;

  const riskLevel = fundCount >= 4 ? "critical" : fundCount >= 2 ? "elevated" : "normal";
  const riskColor = { critical: "#ef4444", elevated: "#f59e0b", normal: "#71717a" }[riskLevel];
  const riskBg = { critical: "rgba(239,68,68,0.15)", elevated: "rgba(245,158,11,0.15)", normal: "rgba(255,255,255,0.05)" }[riskLevel];

  const formatCurrency = (value: number): string => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}B`;
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
          {fundCount >= 2 && (
            <div
              style={{
                padding: "8px 16px",
                background: riskBg,
                borderRadius: "8px",
                border: `1px solid ${riskColor}33`,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: riskColor }} />
              <span style={{ fontSize: "14px", fontWeight: 600, color: riskColor, textTransform: "uppercase" }}>
                {fundCount} Funds Exposed
              </span>
            </div>
          )}
        </div>

        {/* Borrower name */}
        <div style={{ marginTop: "50px", display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "14px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Borrower
          </span>
          <h1 style={{ fontSize: "56px", fontWeight: 700, color: "#ffffff", margin: "8px 0 0 0", lineHeight: 1.1 }}>
            {borrower.name.length > 35 ? borrower.name.slice(0, 35) + "..." : borrower.name}
          </h1>
          <span style={{ fontSize: "18px", color: "#71717a", marginTop: "8px" }}>
            {borrower.industry !== "Unknown" && borrower.industry !== "Unclassified" ? borrower.industry : "Industry not classified"}
          </span>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "32px", marginTop: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Total Debt
            </span>
            <span style={{ fontSize: "40px", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>
              {formatCurrency(totalDebt)}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Creditor Funds
            </span>
            <span style={{ fontSize: "40px", fontWeight: 700, color: riskColor, marginTop: "4px" }}>
              {fundCount}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Avg Rate
            </span>
            <span style={{ fontSize: "40px", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>
              {avgRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Fund tickers */}
        {fundCount > 0 && (
          <div style={{ display: "flex", gap: "12px", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            {fundHoldings.slice(0, 8).map((h, i) => (
              <div
                key={i}
                style={{
                  padding: "8px 16px",
                  background: "rgba(0,212,255,0.1)",
                  borderRadius: "6px",
                  border: "1px solid rgba(0,212,255,0.2)",
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#00d4ff" }}>{h.fund.ticker}</span>
              </div>
            ))}
            {fundCount > 8 && (
              <span style={{ fontSize: "14px", color: "#52525b", alignSelf: "center" }}>+{fundCount - 8} more</span>
            )}
          </div>
        )}
      </div>
    ),
    {
      ...size,
    }
  );
}
