interface PortfolioStatsProps {
    statsData: any;
}

const PortfolioStats = ({ statsData }: PortfolioStatsProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px mt-8 bg-[#3d4a3e]/20 rounded-sm overflow-hidden">

            {/* Total Value */}
            <div className="bg-[#2e3330] p-6 group hover:bg-[#2a3d2e] transition-colors duration-500">
                <h3 className="text-[10px] tracking-[0.3em] uppercase text-[#6b7c6a] mb-4 flex items-center gap-2">
                    <span className="block w-4 h-px bg-[#6b7c6a]/50" />
                    Total Value
                </h3>

                <p
                    className="font-light text-[#ede8dd] text-2xl tracking-wide"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                    ${statsData?.currentValue?.toFixed(2) ?? "0.00"}
                </p>

                <span className="mt-3 block text-[10px] tracking-[0.2em] text-[#3d4a3e] group-hover:text-[#587560] uppercase">
                    Portfolio worth
                </span>
            </div>

            {/* Total Investment */}
            <div className="bg-[#2e3330] p-6 group hover:bg-[#2a3d2e] transition-colors duration-500">
                <h3 className="text-[10px] tracking-[0.3em] uppercase text-[#6b7c6a] mb-4 flex items-center gap-2">
                    <span className="block w-4 h-px bg-[#6b7c6a]/50" />
                    Total Investment
                </h3>

                <p
                    className="font-light text-[#ede8dd] text-2xl tracking-wide"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                    ${statsData?.investment?.toFixed(2) ?? "0.00"}
                </p>

                <span className="mt-3 block text-[10px] tracking-[0.2em] text-[#3d4a3e] group-hover:text-[#587560] uppercase">
                    Capital deployed
                </span>
            </div>

            {/* Profit / Loss */}
            <div className="bg-[#2e3330] p-6 group hover:bg-[#2a3d2e] transition-colors duration-500">
                <h3 className="text-[10px] tracking-[0.3em] uppercase text-[#6b7c6a] mb-4 flex items-center gap-2">
                    <span className="block w-4 h-px bg-[#6b7c6a]/50" />
                    Profit / Loss
                </h3>

                <p
                    className="font-light text-2xl tracking-wide"
                    style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        color: (statsData?.profitLoss ?? 0) < 0 ? "#8b5e3c" : "#587560",
                    }}
                >
                    {(statsData?.profitLoss ?? 0) >= 0 ? "+" : ""}
                    ${statsData?.profitLoss?.toFixed(2) ?? "0.00"}
                </p>

                <span className="mt-3 block text-[10px] tracking-[0.2em] text-[#3d4a3e] group-hover:text-[#587560] uppercase">
                    {(statsData?.profitLoss ?? 0) >= 0
                        ? "Returning gain"
                        : "Unrealised loss"}
                </span>
            </div>

            {/* Change % */}
            <div className="bg-[#2e3330] p-6 group hover:bg-[#2a3d2e] transition-colors duration-500 relative overflow-hidden">
                <h3 className="text-[10px] tracking-[0.3em] uppercase text-[#6b7c6a] mb-4 flex items-center gap-2">
                    <span className="block w-4 h-px bg-[#6b7c6a]/50" />
                    Change
                </h3>

                <p
                    className="font-light text-2xl tracking-wide"
                    style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        color:
                            (statsData?.profitPercentage ?? 0) < 0 ? "#8b5e3c" : "#587560",
                    }}
                >
                    {(statsData?.profitPercentage ?? 0) >= 0 ? "+" : ""}
                    {statsData?.profitPercentage?.toFixed(2) ?? "0.00"}%
                </p>

                <span className="mt-3 block text-[10px] tracking-[0.2em] text-[#3d4a3e] group-hover:text-[#587560] uppercase">
                    Since inception
                </span>

                <span
                    className="absolute bottom-2 right-4 text-6xl font-light text-[#3d4a3e]/30 pointer-events-none select-none"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                    %
                </span>
            </div>
        </div>
    );
};

export default PortfolioStats;
