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
        <div className="brutalist-card p-0 overflow-hidden">
            <div className="p-5 border-b-4 border-black">
                <h3 className="font-black text-2xl text-black tracking-tighter uppercase">
                    Portfolio Holdings
                </h3>
                <p className="mt-1 text-sm font-mono font-bold text-black uppercase">
                    Allocation, cost basis, and return by coin
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b-4 border-black bg-[#f4f4f0]">
                            <th scope="col" className="px-5 py-3 text-left text-sm font-black text-black uppercase tracking-wider border-r-2 border-black">
                                Coin
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-sm font-black text-black uppercase tracking-wider border-r-2 border-black">
                                Quantity
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-sm font-black text-black uppercase tracking-wider border-r-2 border-black">
                                Avg Cost
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-sm font-black text-black uppercase tracking-wider border-r-2 border-black">
                                Current Price
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-sm font-black text-black uppercase tracking-wider border-r-2 border-black">
                                Allocation
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-sm font-black text-black uppercase tracking-wider border-r-2 border-black">
                                Value
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-sm font-black text-black uppercase tracking-wider border-r-2 border-black">
                                Unrealized PnL
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-sm font-black text-black uppercase tracking-wider border-r-2 border-black">
                                Realized PnL
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-sm font-black text-black uppercase tracking-wider">
                                Return
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y-2 divide-black">
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
                                            className="group transition-colors duration-150 hover:bg-[#ccff00] bg-white"
                                        >
                                            <td className="px-5 py-3 whitespace-nowrap border-r-2 border-black">
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectCoin(holding.coinId)}
                                                    className="flex flex-col text-left focus:outline-none"
                                                >
                                                    <span className="font-black text-sm text-black uppercase">
                                                        {holding.coinName}
                                                    </span>
                                                    <span className="text-xs font-mono font-bold text-black bg-[#ccff00] border-2 border-black px-1 mt-1 group-hover:bg-white inline-block">
                                                        {holding.coinSymbol}
                                                    </span>
                                                </button>
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right font-mono font-bold text-sm text-black border-r-2 border-black">
                                                {holding.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right font-mono font-bold text-sm text-black border-r-2 border-black">
                                                ${holding.avgBuyPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                            </td>

                                            <td
                                                key={`${holding.coinId}-${liveData?.updateKey ?? 0}`}
                                                className="px-5 py-3 whitespace-nowrap text-right border-r-2 border-black"
                                            >
                                                <div className={`font-mono font-bold text-sm text-black ${liveData?.direction === "up" ? "flash-up" : liveData?.direction === "down" ? "flash-down" : ""}`}>
                                                    ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                                </div>
                                                <div className={`font-mono font-bold text-xs mt-0.5 ${priceChange24h >= 0 ? "text-blue-700" : "text-red-600"}`}>
                                                    {priceChange24h >= 0 ? "+" : ""}
                                                    {priceChange24h.toFixed(2)}%
                                                </div>
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right font-mono font-bold text-sm text-black border-r-2 border-black">
                                                {holding.allocationPercent.toFixed(1)}%
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right border-r-2 border-black">
                                                <span className="font-mono font-black text-sm text-black">
                                                    ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right border-r-2 border-black">
                                                <span className={`inline-flex items-center px-2 py-0.5 font-mono text-xs font-black border-2 border-black ${isProfit ? "bg-[#ccff00] text-black" : "bg-[#ff3333] text-white"}`}>
                                                    {isProfit ? "+" : "-"}${Math.abs(unrealizedProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right border-r-2 border-black">
                                                <span className={`inline-flex items-center px-2 py-0.5 font-mono text-xs font-black border-2 border-black ${isRealizedProfit ? "bg-[#ccff00] text-black" : "bg-[#ff3333] text-white"}`}>
                                                    {isRealizedProfit ? "+" : "-"}${Math.abs(holding.realizedProfit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right">
                                                <span className={`font-mono text-sm font-black ${totalReturn >= 0 ? "text-blue-700" : "text-red-600"}`}>
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
                                            <p className="text-xl font-black uppercase text-black">
                                                NO HOLDINGS YET
                                            </p>
                                            <p className="text-sm font-mono font-bold text-black mt-2">
                                                ADD A TRANSACTION OR IMPORT YOUR CSV TO UNLOCK ALLOCATION AND PERFORMANCE VIEWS
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
