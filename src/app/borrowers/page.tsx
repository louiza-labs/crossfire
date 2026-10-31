"use client";

import { useState, useMemo, Fragment, useEffect } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ExpandedState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  borrowers,
  holdings,
  funds,
  getUniqueIndustries,
  Holding,
} from "@/data";
import { ChevronUp, ChevronDown, ChevronRight } from "lucide-react";
import { EChartsBar } from "@/components/charts/EChartsBar";
import { EChartsDonut } from "@/components/charts/EChartsDonut";
import { EChartsHeatmap, buildFundIndustryHeatmap } from "@/components/charts/EChartsHeatmap";
import { formatters, chartColors } from "@/lib/design-tokens";

interface BorrowerRow {
  id: string;
  name: string;
  industry: string;
  holdingCount: number;
  fundCount: number;
  totalDebt: number;
  avgRate: number;
  fundTickers: string[];
  loans: (Holding & { fundTicker: string })[];
}

const columnHelper = createColumnHelper<BorrowerRow>();

const columns = [
  columnHelper.display({
    id: "expander",
    header: () => null,
    cell: ({ row }) => (
      <button
        onClick={() => row.toggleExpanded()}
        className="p-1 hover:bg-zinc-800 rounded transition-colors"
      >
        <ChevronRight
          className={`w-4 h-4 text-zinc-500 transition-transform ${row.getIsExpanded() ? "rotate-90" : ""}`}
        />
      </button>
    ),
  }),
  columnHelper.accessor("name", {
    header: "Company",
    cell: info => (
      <Link
        href={`/borrowers/${info.row.original.id}`}
        className="text-zinc-200 hover:text-cyan-400 transition-colors font-medium"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("industry", {
    header: "Industry",
    cell: info => (
      <span className="text-zinc-500 text-xs line-clamp-1 max-w-[200px]">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("totalDebt", {
    header: () => <span className="text-right block">Total Debt</span>,
    cell: info => (
      <span className="text-right block tabular-nums font-medium text-zinc-200">
        {formatters.currency(info.getValue() * 1e6)}
      </span>
    ),
  }),
  columnHelper.accessor("avgRate", {
    header: () => <span className="text-right block">Avg Rate</span>,
    cell: info => (
      <span className="text-right block tabular-nums text-zinc-400">
        {info.getValue() > 0 ? formatters.percent(info.getValue()) : "—"}
      </span>
    ),
  }),
  columnHelper.accessor("fundCount", {
    header: () => <span className="text-right block">Funds</span>,
    cell: info => {
      const count = info.getValue();
      const colorClass =
        count >= 4
          ? "bg-red-500/20 text-red-400"
          : count >= 2
          ? "bg-emerald-500/20 text-emerald-400"
          : "bg-zinc-800 text-zinc-500";
      return (
        <span className="text-right block">
          <span className={`inline-flex items-center justify-center w-6 h-5 text-[11px] rounded tabular-nums font-medium ${colorClass}`}>
            {count}
          </span>
        </span>
      );
    },
  }),
  columnHelper.accessor("fundTickers", {
    header: "Creditors",
    cell: info => (
      <div className="flex flex-wrap gap-1">
        {info.getValue().slice(0, 4).map((ticker) => (
          <span key={ticker} className="ticker-badge text-[10px]">
            {ticker}
          </span>
        ))}
        {info.getValue().length > 4 && (
          <span className="text-[10px] text-zinc-500">+{info.getValue().length - 4}</span>
        )}
      </div>
    ),
    enableSorting: false,
  }),
];

type ViewMode = "table" | "heatmap";

export default function BorrowersPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "fundCount", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [industryFilter, setIndustryFilter] = useState<string | null>(null);
  const [fundFilter, setFundFilter] = useState<string | null>(null);
  const [sharedOnly, setSharedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const industries = getUniqueIndustries();

  const data = useMemo(() => {
    let result = borrowers.map(borrower => {
      const borrowerHoldings = holdings.filter(h => h.borrowerId === borrower.id);
      const fundIds = [...new Set(borrowerHoldings.map(h => h.fundId))];
      const totalDebt = borrowerHoldings.reduce((sum, h) => sum + h.principal, 0);
      const avgRate = borrowerHoldings.length > 0
        ? borrowerHoldings.reduce((sum, h) => sum + h.rate, 0) / borrowerHoldings.length
        : 0;
      const fundTickers = fundIds.map(fid => funds.find(f => f.id === fid)?.ticker || "").filter(Boolean);

      const loansWithFund = borrowerHoldings.map(h => ({
        ...h,
        fundTicker: funds.find(f => f.id === h.fundId)?.ticker || "—",
      }));

      return {
        id: borrower.id,
        name: borrower.name,
        industry: borrower.industry,
        holdingCount: borrowerHoldings.length,
        fundCount: fundIds.length,
        totalDebt,
        avgRate,
        fundTickers,
        loans: loansWithFund,
      };
    });

    if (industryFilter) {
      result = result.filter(b => b.industry === industryFilter);
    }
    if (fundFilter) {
      result = result.filter(b => b.loans.some(l => l.fundId === fundFilter));
    }
    if (sharedOnly) {
      result = result.filter(b => b.fundCount > 1);
    }

    return result;
  }, [industryFilter, fundFilter, sharedOnly]);

  // Summary stats
  const stats = useMemo(() => {
    const totalDebt = data.reduce((sum, b) => sum + b.totalDebt, 0);
    const sharedCount = data.filter(b => b.fundCount > 1).length;
    const criticalCount = data.filter(b => b.fundCount >= 4).length;
    return { totalDebt, sharedCount, criticalCount, totalBorrowers: data.length };
  }, [data]);

  // Chart data - Top borrowers bar chart
  const topBorrowersData = useMemo(() => {
    return [...data]
      .sort((a, b) => b.totalDebt - a.totalDebt)
      .slice(0, 10)
      .map(b => ({
        label: b.name.length > 20 ? b.name.slice(0, 18) + "…" : b.name,
        value: b.totalDebt * 1e6,
        color: b.fundCount >= 4 ? "#ef4444" : b.fundCount >= 2 ? "#10b981" : "#00d4ff",
      }));
  }, [data]);

  // Fund concentration donut
  const fundCountDistribution = useMemo(() => {
    const counts: Record<number, number> = {};
    data.forEach(b => {
      counts[b.fundCount] = (counts[b.fundCount] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([count, num], i) => ({
        label: count === "1" ? "1 Fund" : `${count} Funds`,
        value: num,
        color: parseInt(count) >= 4 ? "#ef4444" : parseInt(count) >= 2 ? "#10b981" : chartColors[i % chartColors.length],
      }))
      .sort((a, b) => parseInt(a.label) - parseInt(b.label));
  }, [data]);

  // Heatmap data
  const heatmapData = useMemo(() => {
    const exposures = holdings.map(h => ({
      fundId: h.fundId,
      fundTicker: funds.find(f => f.id === h.fundId)?.ticker || "",
      industry: h.industry,
      exposure: h.fairValue,
    }));
    return buildFundIndustryHeatmap(exposures, 12, 10);
  }, []);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, expanded },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
  });

  const displayedRows = table.getRowModel().rows.slice(0, 100);

  return (
    <div className="min-h-screen">
      {/* Page Header with Key Metrics */}
      <div className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-lg font-semibold text-white">Borrowers</h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                {mounted ? table.getFilteredRowModel().rows.length.toLocaleString() : data.length.toLocaleString()} companies across {funds.length} BDC funds
              </p>
            </div>
            <div className="flex items-center gap-8">
              <KeyMetric label="Total Debt" value={formatters.currency(stats.totalDebt * 1e6)} />
              <KeyMetric label="Shared (2+)" value={stats.sharedCount.toString()} highlight="green" />
              <KeyMetric label="Critical (4+)" value={stats.criticalCount.toString()} highlight={stats.criticalCount > 0 ? "red" : undefined} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">Top Borrowers by Debt</h3>
            <EChartsBar
              data={topBorrowersData}
              height={260}
              maxBars={10}
              formatValue={formatters.currency}
            />
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">Fund Concentration</h3>
            <EChartsDonut
              data={fundCountDistribution}
              height={300}
              centerLabel={{
                title: "Total",
                value: stats.totalBorrowers.toLocaleString(),
              }}
              formatValue={(v) => `${v} borrowers`}
            />
          </div>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-44 h-8 text-xs bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
            />
            <select
              value={industryFilter || ""}
              onChange={(e) => setIndustryFilter(e.target.value || null)}
              className="h-8 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            >
              <option value="">All Industries</option>
              {industries.slice(0, 30).map(ind => (
                <option key={ind} value={ind}>{ind.slice(0, 30)}</option>
              ))}
            </select>
            <select
              value={fundFilter || ""}
              onChange={(e) => setFundFilter(e.target.value || null)}
              className="h-8 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            >
              <option value="">All Funds</option>
              {funds.map(f => (
                <option key={f.id} value={f.id}>{f.ticker}</option>
              ))}
            </select>
            <button
              onClick={() => setSharedOnly(!sharedOnly)}
              className={`h-8 text-xs px-3 rounded-md border transition-colors ${
                sharedOnly
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Shared Only
            </button>
          </div>

          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-md p-0.5">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                viewMode === "table" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("heatmap")}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                viewMode === "heatmap" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Heatmap
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === "heatmap" ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">Fund × Industry Exposure</h3>
            <EChartsHeatmap
              data={heatmapData}
              height={450}
              formatValue={(v) => formatters.currency(v * 1e6)}
            />
          </div>
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id} className="border-b border-zinc-800 bg-zinc-900/80">
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          className={`px-4 py-2.5 text-left text-[10px] font-medium text-zinc-500 uppercase tracking-wider ${
                            header.column.getCanSort() ? "cursor-pointer hover:text-zinc-300 transition-colors select-none" : ""
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span className="inline-flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() && (
                              header.column.getIsSorted() === "asc"
                                ? <ChevronUp className="w-3 h-3" />
                                : <ChevronDown className="w-3 h-3" />
                            )}
                          </span>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {displayedRows.map(row => (
                    <Fragment key={row.id}>
                      <tr className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${row.getIsExpanded() ? "bg-zinc-800/40" : ""}`}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="px-4 py-2.5 text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                      {row.getIsExpanded() && (
                        <tr className="bg-zinc-900/90">
                          <td colSpan={columns.length} className="px-4 py-3">
                            <LoansSubTable loans={row.original.loans} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {table.getFilteredRowModel().rows.length > 100 && (
              <div className="px-4 py-2.5 text-xs text-zinc-600 border-t border-zinc-800 bg-zinc-900/50">
                Showing 100 of {table.getFilteredRowModel().rows.length.toLocaleString()} results
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Key metric component for header
function KeyMetric({ label, value, highlight }: { label: string; value: string; highlight?: "green" | "red" }) {
  return (
    <div className="text-right">
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${
        highlight === "green" ? "text-emerald-400" :
        highlight === "red" ? "text-red-400" :
        "text-white"
      }`}>
        {value}
      </div>
    </div>
  );
}

// Loans subtable
interface LoanRow extends Holding {
  fundTicker: string;
}

const loanColumnHelper = createColumnHelper<LoanRow>();

const loanColumns = [
  loanColumnHelper.accessor("fundTicker", {
    header: "Fund",
    cell: info => (
      <Link href={`/funds/${info.row.original.fundId}`}>
        <span className="ticker-badge hover:bg-cyan-500/25 transition-colors">
          {info.getValue()}
        </span>
      </Link>
    ),
  }),
  loanColumnHelper.accessor("principal", {
    header: () => <span className="text-right block">Principal</span>,
    cell: info => (
      <span className="text-right block tabular-nums text-zinc-300">
        {formatters.currency(info.getValue() * 1e6)}
      </span>
    ),
  }),
  loanColumnHelper.accessor("fairValue", {
    header: () => <span className="text-right block">Fair Value</span>,
    cell: info => {
      const fv = info.getValue();
      const principal = info.row.original.principal;
      const diff = fv - principal;
      const colorClass = diff > 0.1 ? "text-emerald-400" : diff < -0.1 ? "text-red-400" : "text-zinc-400";
      return (
        <span className={`text-right block tabular-nums ${colorClass}`}>
          {formatters.currency(fv * 1e6)}
        </span>
      );
    },
  }),
  loanColumnHelper.accessor("rate", {
    header: () => <span className="text-right block">Rate</span>,
    cell: info => (
      <span className="text-right block tabular-nums text-zinc-400">
        {info.getValue() > 0 ? formatters.percent(info.getValue()) : "—"}
      </span>
    ),
  }),
  loanColumnHelper.accessor("maturity", {
    header: "Maturity",
    cell: info => (
      <span className="text-zinc-500 text-sm">
        {info.getValue() ? formatters.dateShort(info.getValue()) : "—"}
      </span>
    ),
  }),
];

function LoansSubTable({ loans }: { loans: LoanRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "fairValue", desc: true }]);

  const table = useReactTable({
    data: loans,
    columns: loanColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const totalValue = loans.reduce((sum, l) => sum + l.fairValue, 0);

  return (
    <div className="pl-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
          Loan Details ({loans.length})
        </span>
        <span className="text-xs text-zinc-500">
          Total: <span className="text-zinc-300 tabular-nums">{formatters.currency(totalValue * 1e6)}</span>
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} className="text-zinc-500 text-[10px] uppercase tracking-wider">
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className={`py-1.5 px-2 first:pl-0 text-left ${
                    header.column.getCanSort() ? "cursor-pointer hover:text-zinc-300 transition-colors" : ""
                  }`}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <span className="inline-flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() && (
                      header.column.getIsSorted() === "asc"
                        ? <ChevronUp className="w-2.5 h-2.5" />
                        : <ChevronDown className="w-2.5 h-2.5" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="border-t border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="py-1.5 px-2 first:pl-0">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
