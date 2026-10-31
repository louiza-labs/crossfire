import { ImageResponse } from "@vercel/og";
import { funds, getHoldingsByFund } from "@/data";

export const alt = "Crossfire — Fund Details";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export async function generateImageMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fund = funds.find((f) => f.id === id);
  return [
    {
      id: "og",
      alt: fund ? `${fund.ticker} — ${fund.name} — Crossfire` : "Fund — Crossfire",
      size: { width: 1200, height: 630 },
      contentType: "image/png",
    },
  ];
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fund = funds.find((f) => f.id === id);

  if (!fund) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontSize: "48px" }}>Fund not found</span>
        </div>
      ),
      { ...size }
    );
  }

  const holdings = getHoldingsByFund(fund.id);
  const totalFairValue = holdings.reduce((sum, h) => sum + h.fairValue, 0);
  const avgRate = holdings.length > 0 ? holdings.reduce((sum, h) => sum + h.rate, 0) / holdings.length : 0;

  // Get top industries
  const industryMap = new Map<string, number>();
  for (const h of holdings) {
    if (h.industry && h.industry !== "Unknown" && h.industry !== "Unclassified") {
      industryMap.set(h.industry, (industryMap.get(h.industry) || 0) + h.fairValue);
    }
  }
  const topIndustries = Array.from(industryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

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

        {/* Gradient accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle at center, rgba(0,212,255,0.1) 0%, transparent 70%)",
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
          <span style={{ fontSize: "14px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {fund.type}
          </span>
        </div>

        {/* Fund info */}
        <div style={{ marginTop: "50px", display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              padding: "12px 24px",
              background: "rgba(0,212,255,0.1)",
              borderRadius: "8px",
              border: "1px solid rgba(0,212,255,0.3)",
            }}
          >
            <span style={{ fontSize: "32px", fontWeight: 700, color: "#00d4ff" }}>{fund.ticker}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1 style={{ fontSize: "40px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
              {fund.name.length > 30 ? fund.name.slice(0, 30) + "..." : fund.name}
            </h1>
            <span style={{ fontSize: "16px", color: "#71717a", marginTop: "4px" }}>
              Managed by {fund.managerName}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "40px", marginTop: "48px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Total Assets
            </span>
            <span style={{ fontSize: "40px", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>
              {formatCurrency(fund.totalAssets)}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Holdings
            </span>
            <span style={{ fontSize: "40px", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>
              {holdings.length}
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
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Fair Value
            </span>
            <span style={{ fontSize: "40px", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>
              {formatCurrency(totalFairValue)}
            </span>
          </div>
        </div>

        {/* Top industries */}
        {topIndustries.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
            <span style={{ fontSize: "12px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
              Top Industries
            </span>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {topIndustries.map(([industry, _], i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 16px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#a1a1aa" }}>
                    {industry.length > 30 ? industry.slice(0, 30) + "..." : industry}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ),
    {
      ...size,
    }
  );
}
