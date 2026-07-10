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
        <div className="overflow-hidden rounded-sm bg-surface-secondary border border-border-primary">
            <div className="p-5 border-b border-border-primary">
                <h3 className="font-semibold text-lg text-text-primary tracking-tight">
                    Portfolio Holdings
                </h3>
                <p className="mt-1 text-xs text-text-secondary">
                    Allocation, cost basis, and return by coin
                </p>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-border-primary bg-surface-secondary/50">
                            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-text-tertiary">
                                Coin
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-text-secondary">
                                Quantity
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-text-secondary">
                                Avg Cost
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-text-secondary">
                                Current Price
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-text-secondary">
                                Allocation
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-text-secondary">
                                Value
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-text-secondary">
                                Unrealized PnL
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-text-secondary">
                                Realized PnL
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-text-secondary">
                                Return
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-border-primary/50">
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
                                            className="group transition-colors duration-150 hover:bg-surface-tertiary"
                                        >
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectCoin(holding.coinId)}
                                                    className="flex flex-col text-left focus:outline-none"
                                                >
                                                    <span className="font-medium text-sm text-text-primary group-hover:text-white transition-colors">
                                                        {holding.coinName}
                                                    </span>
                                                    <span className="text-xs font-mono text-text-tertiary uppercase mt-0.5">
                                                        {holding.coinSymbol}
                                                    </span>
                                                </button>
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right font-mono text-sm text-text-secondary">
                                                {holding.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right font-mono text-sm text-text-secondary">
                                                ${holding.avgBuyPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                            </td>

                                            <td
                                                key={`${holding.coinId}-${liveData?.updateKey ?? 0}`}
                                                className="px-5 py-3 whitespace-nowrap text-right"
                                            >
                                                <div className={`font-mono text-sm text-text-primary ${liveData?.direction === "up" ? "flash-up" : liveData?.direction === "down" ? "flash-down" : ""}`}>
                                                    ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                                </div>
                                                <div className={`font-mono text-xs mt-0.5 ${priceChange24h >= 0 ? "text-positive" : "text-negative"}`}>
                                                    {priceChange24h >= 0 ? "+" : ""}
                                                    {priceChange24h.toFixed(2)}%
                                                </div>
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right font-mono text-sm text-text-tertiary">
                                                {holding.allocationPercent.toFixed(1)}%
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right">
                                                <span className="font-mono text-sm font-medium text-text-primary">
                                                    ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-medium bg-surface-primary border ${isProfit ? "text-positive border-positive/20" : "text-negative border-negative/20"}`}>
                                                    {isProfit ? "+" : "-"}${Math.abs(unrealizedProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-medium bg-surface-primary border ${isRealizedProfit ? "text-positive border-positive/20" : "text-negative border-negative/20"}`}>
                                                    {isRealizedProfit ? "+" : "-"}${Math.abs(holding.realizedProfit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right">
                                                <span className={`font-mono text-sm font-medium ${totalReturn >= 0 ? "text-positive" : "text-negative"}`}>
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
                                            <p className="text-lg font-medium text-text-tertiary">
                                                No holdings yet
                                            </p>
                                            <p className="text-sm text-text-tertiary mt-2">
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
