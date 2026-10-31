# Capital: Private Credit & Structured Credit Explorer

## Vision

An explorer and visualization tool that maps the web of private credit and structured credit, revealing who owns what and how interconnected the system is. Users can traverse the graph from any entry point—fund, borrower, manager, investor—and see the full network of relationships.

The goal: make an opaque corner of finance legible to the public using only publicly available data.

---

## Scope

**Initial dataset:** Top 20 private credit and structured credit funds (by AUM, 2026) that have public filing requirements:
- Business Development Companies (BDCs) - file 10-K/10-Q with full portfolio holdings
- SEC-registered CLOs - file prospectuses and trustee reports
- Public interval funds / credit funds

**No geographic filter.** Trace holdings wherever they go.

---

## Graph Model

### Nodes

| Node Type | Description | Primary Data Source |
|-----------|-------------|---------------------|
| **Manager** | Firm managing the fund (Ares, Apollo, Blue Owl, Blackstone, etc.) | SEC filings, fund docs |
| **Fund** | The investment vehicle - BDC, CLO, interval fund | SEC EDGAR (10-K, prospectus) |
| **Tranche** | CLO tranches (AAA, AA, A, BBB, BB, Equity) - each a distinct security | CLO prospectus, trustee reports |
| **Holding** | Individual loan or bond held by a fund | 10-K Schedule of Investments, CLO reports |
| **Borrower** | Company receiving financing | Derived from holdings |
| **Investor** | Entity holding fund shares or CLO tranches | 13F filings, fund shareholder reports |

### Edges

| From | To | Relationship | Attributes |
|------|-----|--------------|------------|
| Manager | Fund | `MANAGES` | |
| Fund | Holding | `OWNS` | amount, % of portfolio, fair value |
| Holding | Borrower | `LENT_TO` | principal, rate, maturity, industry |
| Fund | Tranche | `HAS_TRANCHE` | size, rating, coupon |
| Investor | Fund | `HOLDS_SHARES` | shares, % ownership |
| Investor | Tranche | `HOLDS_TRANCHE` | amount, % of tranche |
| Fund | Fund | `HOLDS_SECURITIES_OF` | creates interconnection |

### Key Patterns to Surface

1. **Borrower concentration** - Multiple funds lending to the same company
2. **Fund interconnection** - Fund A holds securities issued by Fund B
3. **Manager consolidation** - Single manager controlling multiple vehicles
4. **Investor overlap** - Same institutions across multiple funds
5. **Syndication patterns** - How a company's debt is distributed across creditors

---

## Core Views

### 1. Fund Explorer
- Entry: Select a fund
- Shows: Manager, all holdings, borrower breakdown, investors, tranches (if CLO)
- Visualization: Radial graph with fund at center

### 2. Borrower View
- Entry: Select or search a company
- Shows: All loans/debt tied to them, which funds hold each piece, % split
- Answers: "Who finances this company and how is it spread out?"

### 3. Manager View
- Entry: Select a manager
- Shows: All funds under management, aggregate holdings, total AUM in private credit
- Reveals: Consolidation in the industry

### 4. Interconnection Map
- Entry: Global view
- Shows: Fund↔Fund links, shared borrowers, cluster analysis
- Visualization: Force-directed graph of the entire network

### 5. Investor View
- Entry: Select an institutional investor
- Shows: Which funds/tranches they hold, exposure breakdown
- Answers: "Where is this pension fund's money actually going?"

---

## Data Sources

### Primary: SEC EDGAR

| Filing Type | What It Contains | Funds That File |
|-------------|------------------|-----------------|
| **10-K / 10-Q** | Schedule of Investments - full holdings with amounts, rates, maturities | BDCs |
| **N-CSR / N-PORT** | Portfolio holdings for registered funds | Interval funds, closed-end funds |
| **424B** (Prospectus) | CLO structure, tranches, initial portfolio | CLOs |
| **8-K** | Material events, portfolio updates | BDCs, some CLOs |
| **13F** | Institutional investor holdings | For investor node data |

### Secondary

| Source | What It Provides |
|--------|------------------|
| **FINRA TRACE** | Bond transaction data |
| **Intex / Bloomberg** (if accessible) | CLO trustee reports (may need to find public alternatives) |
| **Company websites** | Fund fact sheets, investor presentations |

### Data Pipeline

1. **Identify top 20 funds** - BDCs by market cap, largest SEC-registered CLOs
2. **Pull EDGAR filings** - 10-Ks, prospectuses, N-PORT
3. **Parse Schedule of Investments** - Extract holdings, borrowers, amounts
4. **Normalize borrower names** - Deduplicate across funds
5. **Build graph** - Load into graph database
6. **Pull 13F data** - Map institutional holders
7. **Refresh quarterly** - Track changes over time

---

## Tech Stack

### Recommended

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | Next.js (App Router) | SSR for SEO, React ecosystem |
| **Database** | PostgreSQL + graph extension (Apache AGE) or Neo4j | Native graph queries |
| **ORM** | Prisma (relational) or direct Cypher (graph) | Depends on DB choice |
| **Data ingestion** | Python scripts (SEC EDGAR API) | Better libraries for EDGAR parsing |
| **Visualization** | D3.js or vis-network | Force-directed graphs, interactive |
| **Styling** | Tailwind + shadcn/ui | Fast iteration |
| **Hosting** | Vercel | Easy deploy, good DX |

### Alternative: Lighter Stack
- SQLite + JSON for MVP (skip graph DB complexity)
- Precompute graph relationships as materialized views

---

## MVP Scope

### Phase 1: Data Foundation
- [ ] Identify top 10 BDCs by AUM
- [ ] Build SEC EDGAR scraper for 10-K Schedule of Investments
- [ ] Parse and normalize holdings data
- [ ] Store in database with graph relationships
- [ ] Basic borrower deduplication

### Phase 2: Core UI
- [ ] Fund list view - browse all funds
- [ ] Fund detail page - holdings table + basic stats
- [ ] Borrower search - find a company, see which funds hold their debt
- [ ] Simple network visualization (fund → borrowers)

### Phase 3: Interconnection
- [ ] Identify shared borrowers across funds
- [ ] Fund↔Fund relationship detection
- [ ] Global interconnection map
- [ ] Investor data (13F integration)

### Phase 4: Polish
- [ ] Manager view
- [ ] Investor view
- [ ] Time-series (track changes quarter over quarter)
- [ ] Export/embed visualizations

---

## Technical Decisions

### 1. Database: PostgreSQL + Apache AGE

**Decision:** Use PostgreSQL with the Apache AGE extension for graph queries.

**Rationale:**
- Single database simplifies ops vs. running Postgres + Neo4j
- AGE provides native Cypher query support for relationship traversal
- Can migrate to dedicated graph DB later if performance requires
- PostgreSQL handles the structured data (filings, amounts, dates) natively

### 2. Entity Resolution: Multi-Stage Pipeline

**Decision:** Build a normalization + weighted fuzzy matching pipeline.

**Pipeline:**
1. **Normalize** - Lowercase, fold diacritics, expand "&" → "and", strip punctuation
2. **Remove legal suffixes** - Inc, Ltd, LLC, Corp, Corporation, LP, GmbH, etc.
3. **Tokenize and weight** - Use IDF weights so common tokens ("Holdings", "Capital", "Partners") don't dominate
4. **Jaro-Winkler similarity** - Score candidate matches, threshold at 0.85
5. **Manual review queue** - Flag matches between 0.75-0.85 for human verification
6. **LLM verification** (Phase 2) - Use LLM to confirm ambiguous matches

**Rationale:** Rule-based approach is explainable and auditable. LLM fallback handles edge cases without blocking MVP.

### 3. CLO Data: SEC EDGAR Is Sufficient

**Decision:** Use SEC EDGAR exclusively for CLO data. No need for Intex/Bloomberg.

**Available on EDGAR:**
- CLO indentures (trust structure, tranches)
- N-CSR filings (shareholder reports with holdings)
- CLO ETF filings (VanEck, Janus, etc. - full portfolio data)
- 424B prospectuses (initial portfolio, terms)

**Rationale:** SEC-registered CLOs and CLO ETFs provide enough data for MVP. Private/offshore CLOs are out of scope anyway.

### 4. Refresh Cadence: Daily Polling + Event-Driven

**Decision:**
- **Daily polling** - Check SEC EDGAR for new filings from tracked entities
- **SEC RSS feed** - Subscribe for real-time new filing alerts
- **Quarterly full refresh** - Re-ingest all data when 10-Ks/10-Qs drop
- **Cache with Redis** - Reduce API load, store parsed filings

**Rationale:** BDCs file quarterly but 8-Ks can drop anytime. Daily polling ensures we catch material updates within 24 hours.

### 5. Historical Data: Start with Current Snapshot

**Decision:** MVP shows current state only. Add historical tracking in Phase 4.

**Rationale:**
- Reduces initial data ingestion scope
- Graph visualization is cleaner without time dimension
- Can backfill historical data later from EDGAR archives

---

## Resolved Questions Summary

| Question | Decision |
|----------|----------|
| Graph DB vs relational | PostgreSQL + Apache AGE |
| Entity resolution | Multi-stage: normalize → weighted fuzzy match → manual review |
| CLO data source | SEC EDGAR only (sufficient for registered CLOs) |
| Refresh cadence | Daily polling + RSS events, quarterly full refresh |
| Historical data | Current snapshot for MVP, add time-series in Phase 4 |

---

## Success Criteria

1. User can select any of the top 20 funds and see all holdings
2. User can search a borrower and see which funds hold their debt + percentage breakdown
3. User can view global interconnection map showing fund↔fund and shared borrower relationships
4. All data is sourced from public filings with citations
5. Visualization makes the complexity legible to non-finance users

---

## Non-Goals (for MVP)

- Real-time data (quarterly refresh is fine)
- Trading/investment recommendations
- Private fund data (only SEC-registered vehicles)
- Mobile-optimized UI (desktop-first)
- User accounts / saved views
