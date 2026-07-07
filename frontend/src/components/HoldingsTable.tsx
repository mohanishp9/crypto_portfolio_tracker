import type { HoldingStat, PortfolioStatsResponse } from "../types/portfolio.types";
import { useLivePrices } from "../context/LivePriceContext";
import { TableRowSkeleton } from "./common/Skeleton";

interface HoldingsTableProps {
    statsData?: PortfolioStatsResponse;
    onSelectCoin: (coinId: string) => void;
    isLoading?: boolean;
}

const HoldingsTable = ({ statsData, onSelectCoin, isLoading }: HoldingsTableProps) => {
    const holdings = statsData?.portfolio ?? [];
    const { livePrices } = useLivePrices();

    return (
        <div className="overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm">
            <div className="p-5 border-b border-zinc-800">
                <h3 className="font-semibold text-lg text-zinc-50 tracking-tight">
                    Portfolio Holdings
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                    Allocation, cost basis, and return by coin
                </p>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-900/50">
                            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Coin
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Quantity
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Avg Cost
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Current Price
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Allocation
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Value
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Unrealized PnL
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Realized PnL
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Return
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-zinc-800/50">
                        {isLoading ? (
                            <>
                                <TableRowSkeleton columnsCount={9} />
                                <TableRowSkeleton columnsCount={9} />
                                <TableRowSkeleton columnsCount={9} />
                            </>
                        ) : (
                            <>
                                {holdings.map((holding: HoldingStat) => {
                                    const liveData = livePrices[holding.coinId];
                                    const currentPrice = liveData ? liveData.price : holding.currentPrice;
                                    const priceChange24h = liveData ? liveData.priceChange24h : holding.priceChange24h;
                                    const value = holding.quantity * currentPrice;
                                    const unrealizedProfit = value - holding.totalCost;
                                    const isProfit = unrealizedProfit >= 0;
                                    const isRealizedProfit = (holding.realizedProfit ?? 0) >= 0;
                                    const totalReturn = holding.totalCost > 0 ? (unrealizedProfit / holding.totalCost) * 100 : 0;

                                    return (
                                        <tr
                                            key={holding.coinId}
                                            className="group transition-colors duration-150 hover:bg-zinc-800/40"
                                        >
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectCoin(holding.coinId)}
                                                    className="flex flex-col text-left focus:outline-none"
                                                >
                                                    <span className="font-medium text-sm text-zinc-50 group-hover:text-white transition-colors">
                                                        {holding.coinName}
                                                    </span>
                                                    <span className="text-xs font-mono text-zinc-500 uppercase mt-0.5">
                                                        {holding.coinSymbol}
                                                    </span>
                                                </button>
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right font-mono text-sm text-zinc-300">
                                                {holding.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right font-mono text-sm text-zinc-300">
                                                ${holding.avgBuyPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                            </td>

                                            <td
                                                key={`${holding.coinId}-${liveData?.updateKey ?? 0}`}
                                                className="px-5 py-3 whitespace-nowrap text-right"
                                            >
                                                <div className={`font-mono text-sm text-zinc-50 ${liveData?.direction === "up" ? "flash-up" : liveData?.direction === "down" ? "flash-down" : ""}`}>
                                                    ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                                </div>
                                                <div className={`font-mono text-xs mt-0.5 ${priceChange24h >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                    {priceChange24h >= 0 ? "+" : ""}
                                                    {priceChange24h.toFixed(2)}%
                                                </div>
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right font-mono text-sm text-zinc-400">
                                                {holding.allocationPercent.toFixed(1)}%
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right">
                                                <span className="font-mono text-sm font-medium text-zinc-50">
                                                    ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-medium bg-zinc-950 border ${isProfit ? "text-emerald-400 border-emerald-500/20" : "text-rose-400 border-rose-500/20"}`}>
                                                    {isProfit ? "+" : "-"}${Math.abs(unrealizedProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-medium bg-zinc-950 border ${isRealizedProfit ? "text-emerald-400 border-emerald-500/20" : "text-rose-400 border-rose-500/20"}`}>
                                                    {isRealizedProfit ? "+" : "-"}${Math.abs(holding.realizedProfit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right">
                                                <span className={`font-mono text-sm font-medium ${totalReturn >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                    {totalReturn >= 0 ? "+" : ""}
                                                    {totalReturn.toFixed(2)}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {holdings.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-5 py-16 text-center">
                                            <p className="text-lg font-medium text-zinc-500">
                                                No holdings yet
                                            </p>
                                            <p className="text-sm text-zinc-600 mt-2">
                                                Add a transaction or import your CSV to unlock allocation and performance views
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HoldingsTable;
