"use client";

import { useState, useMemo, Fragment } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ExpandedState,
} from "@tanstack/react-table";
import { funds, holdings, borrowers, Holding, getStats, getIndustryConcentration } from "@/data";
import { ChevronUp, ChevronDown, ChevronRight } from "lucide-react";
import { EChartsBar } from "@/components/charts/EChartsBar";
import { EChartsDonut } from "@/components/charts/EChartsDonut";
import { formatters, chartColors } from "@/lib/design-tokens";

interface FundRow {
  id: string;
  name: string;
  ticker: string;
  managerName: string;
  type: string;
  totalAssets: number;
  holdingCount: number;
  avgRate: number;
  topIndustry: string;
  holdings: (Holding & { borrowerName: string })[];
}

const columnHelper = createColumnHelper<FundRow>();

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
  columnHelper.accessor("ticker", {
    header: "Fund",
    cell: info => (
      <Link href={`/funds/${info.row.original.id}`} className="group">
        <span className="ticker-badge group-hover:bg-cyan-500/25 transition-colors">
          {info.getValue()}
        </span>
      </Link>
    ),
  }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: info => (
      <span className="text-zinc-400 text-sm truncate max-w-[200px] block">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("managerName", {
    header: "Manager",
    cell: info => <span className="text-zinc-500 text-sm">{info.getValue()}</span>,
  }),
  columnHelper.accessor("type", {
    header: "Type",
    cell: info => (
      <span className="text-[10px] bg-zinc-800/80 text-zinc-400 px-1.5 py-0.5 rounded font-medium">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("totalAssets", {
    header: () => <span className="text-right block">Total Assets</span>,
    cell: info => (
      <span className="text-right block tabular-nums font-medium text-zinc-200">
        {formatters.currency(info.getValue() * 1e6)}
      </span>
    ),
    sortingFn: "basic",
  }),
  columnHelper.accessor("holdingCount", {
    header: () => <span className="text-right block">Positions</span>,
    cell: info => (
      <span className="text-right block tabular-nums text-zinc-400">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("avgRate", {
    header: () => <span className="text-right block">Avg Rate</span>,
    cell: info => (
      <span className="text-right block tabular-nums text-zinc-400">
        {formatters.percent(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor("topIndustry", {
    header: "Top Industry",
    cell: info => (
      <span className="text-zinc-500 text-xs truncate max-w-[140px] block">
        {info.getValue()}
      </span>
    ),
  }),
];

export default function FundsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "totalAssets", desc: true }]);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const stats = useMemo(() => getStats(), []);

  const data = useMemo(() => {
    return funds.map(fund => {
      const fundHoldings = holdings.filter(h => h.fundId === fund.id);
      const avgRate = fundHoldings.length > 0
        ? fundHoldings.reduce((sum, h) => sum + h.rate, 0) / fundHoldings.length
        : 0;

      // Calculate top industry
      const industryMap = new Map<string, number>();
      fundHoldings.forEach(h => {
        industryMap.set(h.industry, (industryMap.get(h.industry) || 0) + h.fairValue);
      });
      const topIndustry = [...industryMap.entries()]
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

      const holdingsWithBorrower = fundHoldings.map(h => ({
        ...h,
        borrowerName: borrowers.find(b => b.id === h.borrowerId)?.name || "Unknown",
      }));

      return {
        id: fund.id,
        name: fund.name,
        ticker: fund.ticker,
        managerName: fund.managerName,
        type: fund.type,
        totalAssets: fund.totalAssets,
        holdingCount: fundHoldings.length,
        avgRate,
        topIndustry,
        holdings: holdingsWithBorrower,
      };
    });
  }, []);

  // Chart data - Fund assets bar chart
  const fundAssetChartData = useMemo(() => {
    return [...data]
      .sort((a, b) => b.totalAssets - a.totalAssets)
      .slice(0, 10)
      .map(f => ({
        label: f.ticker,
        value: f.totalAssets * 1e6,
      }));
  }, [data]);

  // Industry concentration donut
  const industryChartData = useMemo(() => {
    const industries = getIndustryConcentration().slice(0, 8);
    const otherTotal = getIndustryConcentration()
      .slice(8)
      .reduce((sum, i) => sum + i.totalExposure, 0);

    const result = industries.map((ind, i) => ({
      label: ind.industry,
      value: ind.totalExposure * 1e6,
      color: chartColors[i % chartColors.length],
    }));

    if (otherTotal > 0) {
      result.push({
        label: "Other",
        value: otherTotal * 1e6,
        color: "#52525b",
      });
    }

    return result;
  }, []);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, expanded },
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
  });

  return (
    <div className="min-h-screen">
      {/* Page Header with Key Metrics */}
      <div className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-lg font-semibold text-white">BDC Funds</h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                {funds.length} funds tracked · {stats.totalManagers} managers
              </p>
            </div>
            <div className="flex items-center gap-8">
              <KeyMetric label="Total AUM" value={formatters.currency(stats.totalExposure * 1e6)} />
              <KeyMetric label="Positions" value={stats.totalHoldings.toLocaleString()} />
              <KeyMetric label="Avg Rate" value={formatters.percent(stats.avgRate)} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">Top 10 Funds by Assets</h3>
            <EChartsBar
              data={fundAssetChartData}
              height={260}
              maxBars={10}
              formatValue={formatters.currency}
            />
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">Industry Concentration</h3>
            <EChartsDonut
              data={industryChartData}
              height={300}
              formatValue={formatters.currency}
            />
          </div>
        </div>

        {/* Funds Table */}
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
                {table.getRowModel().rows.map(row => (
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
                          <HoldingsSubTable holdings={row.original.holdings} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Key metric component
function KeyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</div>
      <div className="text-lg font-semibold tabular-nums text-white">{value}</div>
    </div>
  );
}

// Holdings subtable
interface HoldingRow extends Holding {
  borrowerName: string;
}

const holdingColumnHelper = createColumnHelper<HoldingRow>();

const holdingColumns = [
  holdingColumnHelper.accessor("borrowerName", {
    header: "Company",
    cell: info => (
      <Link
        href={`/borrowers/${info.row.original.borrowerId}`}
        className="text-zinc-200 hover:text-cyan-400 transition-colors"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  holdingColumnHelper.accessor("industry", {
    header: "Industry",
    cell: info => (
      <span className="text-zinc-500 text-xs max-w-48 truncate block">
        {info.getValue()}
      </span>
    ),
  }),
  holdingColumnHelper.accessor("principal", {
    header: () => <span className="text-right block">Principal</span>,
    cell: info => (
      <span className="text-right block tabular-nums text-zinc-300">
        {formatters.currency(info.getValue() * 1e6)}
      </span>
    ),
  }),
  holdingColumnHelper.accessor("fairValue", {
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
  holdingColumnHelper.accessor("rate", {
    header: () => <span className="text-right block">Rate</span>,
    cell: info => (
      <span className="text-right block tabular-nums text-zinc-400">
        {info.getValue() > 0 ? formatters.percent(info.getValue()) : "—"}
      </span>
    ),
  }),
  holdingColumnHelper.accessor("maturity", {
    header: "Maturity",
    cell: info => (
      <span className="text-zinc-500 text-sm">
        {info.getValue() ? formatters.dateShort(info.getValue()) : "—"}
      </span>
    ),
  }),
];

function HoldingsSubTable({ holdings }: { holdings: HoldingRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "fairValue", desc: true }]);
  const [showAll, setShowAll] = useState(false);

  const displayData = showAll ? holdings : holdings.slice(0, 10);

  const table = useReactTable({
    data: displayData,
    columns: holdingColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const totalValue = holdings.reduce((sum, h) => sum + h.fairValue, 0);

  return (
    <div className="pl-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
          Holdings ({holdings.length})
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
      {holdings.length > 10 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2 text-xs text-cyan-400/80 hover:text-cyan-400 transition-colors"
        >
          {showAll ? "Show less" : `Show all ${holdings.length} positions →`}
        </button>
      )}
    </div>
  );
}
