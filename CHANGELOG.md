# Capital — Private Credit Intelligence

## Stage 1: Network Visualization & Data Foundation (Complete)

### Features Implemented

#### 1. Network Graph Visualization
- **WebGL-based 3D force graph** using `3d-force-graph` and Three.js
- **22 BDC funds** parsed from SEC EDGAR 10-Q filings
- **3,475 portfolio companies** (borrowers) mapped
- **451 shared positions** identified across funds
- Fund-to-fund interconnection links based on shared borrowers
- Custom node rendering with glow effects for visual hierarchy:
  - Cyan: BDC Funds
  - Dim gray: Single-fund positions
  - Emerald: Shared positions (2-3 funds)
  - Pink: Critical positions (4+ funds)
- Hover tooltips with exposure details
- Camera controls: rotate, zoom, reset
- Search/filter by borrower name

#### 2. Home Page (Network View)
- Full-screen network visualization
- Left sidebar with prominent stats:
  - Total Exposure ($206B)
  - Fund count (22)
  - Portfolio companies (3,475)
  - Shared positions (451) — clickable
  - Critical positions count
- Terminal-style command palette (⌘K)
- Typing animation for command prompts

#### 3. Concentrated Borrowers Panel
- Slide-out panel showing borrowers in multiple funds
- Sorted by fund count (most concentrated first)
- Fund pills for each borrower
- Total concentrated exposure summary
- Click to focus in graph

#### 4. Funds Page
- TanStack Table (v8) with sorting
- Expandable rows showing portfolio holdings
- Columns: Fund, Manager, Type, Assets, Holdings, Avg Rate
- Holdings sub-table with: Company, Industry, Principal, Fair Value, Rate, Maturity

#### 5. Borrowers Page
- TanStack Table (v8) with sorting and filtering
- Expandable rows showing loan details per borrower
- Filters: Search, Industry, Fund, Shared Only
- Columns: Company, Industry, Debt, Fund Count, Creditors
- Loan sub-table with: Fund, Principal, Fair Value, Rate, Maturity

#### 6. SEC EDGAR Parser
- Parses 10-Q filings for BDC holdings schedules
- Handles multiple HTML table formats
- Extracts: borrower, industry, investment type, rate, maturity, principal, fair value
- Currently covers 22 major BDCs (47 total available)

### Technical Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **Tables**: TanStack Table v8
- **3D Graphics**: Three.js, 3d-force-graph
- **Typography**: Inter, JetBrains Mono

### Data Coverage
| Metric | Value |
|--------|-------|
| BDC Funds | 22 |
| Portfolio Companies | 3,475 |
| Total Holdings | ~11,000 |
| Shared Positions | 451 |
| Critical (4+ funds) | ~50 |
| Total Exposure | $206B |

---

## Stage 2: Planned Enhancements

### Data Expansion
- [ ] Parse remaining 25 BDCs from SEC EDGAR
- [ ] Add historical filing data (quarterly trends)
- [ ] Normalize borrower names across funds (entity resolution)
- [ ] Add industry classification taxonomy

### Analytics
- [ ] Industry concentration analysis
- [ ] Rate distribution histograms
- [ ] Maturity timeline/calendar
- [ ] Fund overlap matrix heatmap
- [ ] Risk scoring for concentrated positions

### UI Enhancements
- [ ] Graph filtering by fund selection
- [ ] Time-series animation (quarterly changes)
- [ ] Export to PNG/PDF
- [ ] Mobile responsive layout
- [ ] Dark/light theme toggle

### Data Quality
- [ ] Improved parser for edge case table formats
- [ ] Validation against fund 10-K totals
- [ ] Data freshness indicators
- [ ] Error reporting for failed parses
