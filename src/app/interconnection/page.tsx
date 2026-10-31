"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { funds, borrowers, holdings, getSharedBorrowers } from "@/data";
import { NetworkGraph, generateGraphData } from "@/components/NetworkGraph";

export default function InterconnectionPage() {
  const router = useRouter();
  const sharedBorrowers = getSharedBorrowers();

  // Build fund-to-fund connection matrix based on shared borrowers
  const fundConnections: Record<string, Set<string>> = {};
  for (const fund of funds) {
    fundConnections[fund.id] = new Set();
  }

  for (const { funds: borrowerFunds } of sharedBorrowers) {
    for (let i = 0; i < borrowerFunds.length; i++) {
      for (let j = i + 1; j < borrowerFunds.length; j++) {
        fundConnections[borrowerFunds[i].id].add(borrowerFunds[j].id);
        fundConnections[borrowerFunds[j].id].add(borrowerFunds[i].id);
      }
    }
  }

  // Calculate fund connection stats
  const fundStats = funds
    .map((fund) => {
      const connectedFundIds = fundConnections[fund.id];
      const fundHoldings = holdings.filter((h) => h.fundId === fund.id);
      const sharedBorrowerCount = sharedBorrowers.filter((sb) =>
        sb.funds.some((f) => f.id === fund.id)
      ).length;

      return {
        fund,
        connectedFunds: Array.from(connectedFundIds).map(
          (fid) => funds.find((f) => f.id === fid)!
        ),
        sharedBorrowerCount,
        holdingCount: fundHoldings.length,
      };
    })
    .sort((a, b) => b.connectedFunds.length - a.connectedFunds.length);

  // Generate graph data
  const graphData = generateGraphData(funds, borrowers, holdings);

  const handleNodeClick = (node: { id: string; type: string }) => {
    if (node.type === "fund") {
      router.push(`/funds/${node.id}`);
    } else {
      router.push(`/borrowers/${node.id}`);
    }
  };

  const totalConnections =
    Object.values(fundConnections).reduce((sum, set) => sum + set.size, 0) / 2;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Interconnection Map
        </h1>
        <p className="text-zinc-400">
          Visualize how funds are connected through shared borrowers.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-zinc-500">Total Funds</CardDescription>
            <CardTitle className="text-2xl text-white">{funds.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-zinc-500">Shared Borrowers</CardDescription>
            <CardTitle className="text-2xl text-white">{sharedBorrowers.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">Companies financed by 2+ funds</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-zinc-500">Fund Connections</CardDescription>
            <CardTitle className="text-2xl text-white">{totalConnections}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">Fund pairs with shared exposure</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-zinc-500">Network Density</CardDescription>
            <CardTitle className="text-2xl text-white">
              {((sharedBorrowers.length / borrowers.length) * 100).toFixed(0)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">Borrowers with multiple creditors</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="graph" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger
            value="graph"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
          >
            Network Graph
          </TabsTrigger>
          <TabsTrigger
            value="connections"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
          >
            Fund Connections
          </TabsTrigger>
          <TabsTrigger
            value="borrowers"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
          >
            Shared Borrowers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="graph">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Private Credit Network</CardTitle>
              <CardDescription className="text-zinc-400">
                Interactive visualization of fund-borrower relationships. Larger nodes = more
                exposure. Brighter borrower nodes = more fund connections.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <NetworkGraph data={graphData} onNodeClick={handleNodeClick} height={700} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Fund Connections</CardTitle>
              <CardDescription className="text-zinc-400">
                Which funds are connected through shared borrowers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {fundStats.map(({ fund, connectedFunds, sharedBorrowerCount }) => (
                  <div key={fund.id} className="border-b border-zinc-800 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <Link
                        href={`/funds/${fund.id}`}
                        className="font-medium text-white hover:underline"
                      >
                        {fund.ticker} — {fund.name}
                      </Link>
                      <span className="text-sm text-zinc-400">
                        {sharedBorrowerCount} shared borrowers
                      </span>
                    </div>
                    {connectedFunds.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {connectedFunds.map((cf) => (
                          <Link key={cf.id} href={`/funds/${cf.id}`}>
                            <Badge
                              variant="outline"
                              className="border-zinc-700 text-zinc-300 hover:border-zinc-500 cursor-pointer"
                            >
                              {cf.ticker}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-zinc-500">No connections</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="borrowers">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Shared Borrowers</CardTitle>
              <CardDescription className="text-zinc-400">
                Companies creating fund interconnections — sorted by number of creditors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sharedBorrowers.map(({ borrower, funds: borrowerFunds, totalExposure }) => (
                  <div key={borrower.id} className="border-b border-zinc-800 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <Link
                          href={`/borrowers/${borrower.id}`}
                          className="font-medium text-white hover:underline"
                        >
                          {borrower.name}
                        </Link>
                        <span className="text-xs text-zinc-500 ml-2">{borrower.industry}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-white">
                          {borrowerFunds.length} funds
                        </span>
                        <span className="text-sm text-zinc-400 ml-2">${totalExposure}M</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">Financed by:</span>
                      <div className="flex flex-wrap gap-1">
                        {borrowerFunds.map((f) => (
                          <Link key={f.id} href={`/funds/${f.id}`}>
                            <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded hover:bg-zinc-700">
                              {f.ticker}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
