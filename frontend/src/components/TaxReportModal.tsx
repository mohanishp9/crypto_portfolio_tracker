import { useState, useEffect } from "react";
import { X, Download, AlertCircle } from "lucide-react";
import { useExportTaxReportMutation } from "../services/portfolioApi";

export interface TaxEvent {
    asset: string;
    sellDate: string;
    buyDate: string;
    quantity: number;
    proceeds: number;
    costBasis: number;
    realizedGain: number;
    term: "SHORT" | "LONG";
}

export interface TaxReportData {
    events: TaxEvent[];
    summary: {
        totalProceeds: number;
        totalCostBasis: number;
        totalGain: number;
        totalShortTerm: number;
        totalLongTerm: number;
    };
    csv: string;
}

const TaxReportModal = ({ onClose }: { onClose: () => void }) => {
    const [year, setYear] = useState<number | undefined>(undefined);
    const [exportTaxReport, { isLoading, data, error }] = useExportTaxReportMutation();

    useEffect(() => {
        exportTaxReport({ year, format: 'json' });
    }, [year, exportTaxReport]);

    const report: TaxReportData | undefined = data?.report;

    const handleDownloadCsv = () => {
        if (!report?.csv) return;
        const blob = new Blob([report.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `tax-report${year ? '-' + year : '-all'}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white border-4 border-black brutalist-shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b-4 border-black bg-[#ccff00]">
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter text-black">
                            Tax Report
                        </h2>
                        <p className="text-sm font-mono font-bold text-black mt-1">
                            FIFO METHOD (FIRST-IN, FIRST-OUT)
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 border-4 border-black bg-white hover:bg-black hover:text-white transition-colors group"
                    >
                        <X size={24} strokeWidth={3} className="text-black group-hover:text-white" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-[#f4f4f0]">
                    {/* Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b-4 border-black">
                        <div className="flex items-center gap-3">
                            <label className="font-black text-black uppercase tracking-wider text-sm">Tax Year:</label>
                            <select
                                value={year || ""}
                                onChange={(e) => setYear(e.target.value ? Number(e.target.value) : undefined)}
                                className="bg-white border-4 border-black p-2 font-mono font-bold text-black focus:outline-none focus:bg-[#ccff00]"
                            >
                                <option value="">ALL YEARS</option>
                                <option value="2026">2026</option>
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={handleDownloadCsv}
                            disabled={!report?.csv || isLoading}
                            className="brutalist-btn bg-black text-white hover:bg-white hover:text-black disabled:opacity-50 flex items-center gap-2"
                        >
                            <Download size={16} strokeWidth={3} /> DOWNLOAD CSV
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center p-12">
                            <span className="font-mono font-bold uppercase animate-pulse">GENERATING REPORT...</span>
                        </div>
                    ) : error ? (
                        <div className="p-6 bg-[#ff3333] border-4 border-black text-white flex items-center gap-3">
                            <AlertCircle size={24} strokeWidth={3} />
                            <span className="font-mono font-bold uppercase">FAILED TO GENERATE TAX REPORT. PLEASE CHECK YOUR DATA.</span>
                        </div>
                    ) : report ? (
                        <div className="space-y-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white border-4 border-black p-4 brutalist-shadow-sm">
                                    <div className="text-xs font-black uppercase text-black mb-1">TOTAL PROCEEDS</div>
                                    <div className="text-xl font-mono font-black text-black">
                                        ${report.summary.totalProceeds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className="bg-white border-4 border-black p-4 brutalist-shadow-sm">
                                    <div className="text-xs font-black uppercase text-black mb-1">COST BASIS</div>
                                    <div className="text-xl font-mono font-black text-black">
                                        ${report.summary.totalCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className={`border-4 border-black p-4 brutalist-shadow-sm ${report.summary.totalGain >= 0 ? "bg-[#ccff00]" : "bg-[#ff3333] text-white"}`}>
                                    <div className={`text-xs font-black uppercase mb-1 ${report.summary.totalGain >= 0 ? "text-black" : "text-white"}`}>REALIZED GAIN/LOSS</div>
                                    <div className={`text-xl font-mono font-black ${report.summary.totalGain >= 0 ? "text-black" : "text-white"}`}>
                                        ${Math.abs(report.summary.totalGain).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className="bg-white border-4 border-black p-4 brutalist-shadow-sm">
                                    <div className="text-xs font-black uppercase text-black mb-1">SHORT vs LONG TERM</div>
                                    <div className="text-sm font-mono font-bold text-black flex justify-between">
                                        <span>ST: ${report.summary.totalShortTerm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="text-sm font-mono font-bold text-black flex justify-between mt-1 border-t-2 border-black pt-1">
                                        <span>LT: ${report.summary.totalLongTerm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Taxable Events Table */}
                            <div className="bg-white border-4 border-black p-0 overflow-hidden brutalist-shadow">
                                <div className="px-5 py-4 border-b-4 border-black bg-black">
                                    <h3 className="font-black text-xl text-white uppercase tracking-tighter">
                                        TAXABLE EVENTS
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="border-b-4 border-black bg-[#f4f4f0]">
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-black text-black uppercase tracking-wider border-r-2 border-black">Asset</th>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-black text-black uppercase tracking-wider border-r-2 border-black">Sell Date</th>
                                                <th scope="col" className="px-4 py-3 text-right text-xs font-black text-black uppercase tracking-wider border-r-2 border-black">Quantity</th>
                                                <th scope="col" className="px-4 py-3 text-right text-xs font-black text-black uppercase tracking-wider border-r-2 border-black">Proceeds</th>
                                                <th scope="col" className="px-4 py-3 text-right text-xs font-black text-black uppercase tracking-wider border-r-2 border-black">Cost Basis</th>
                                                <th scope="col" className="px-4 py-3 text-right text-xs font-black text-black uppercase tracking-wider border-r-2 border-black">Gain/Loss</th>
                                                <th scope="col" className="px-4 py-3 text-center text-xs font-black text-black uppercase tracking-wider">Term</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y-2 divide-black">
                                            {report.events.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-5 py-12 text-center text-sm font-mono font-bold text-black uppercase">
                                                        NO TAXABLE EVENTS FOUND FOR THIS PERIOD.
                                                    </td>
                                                </tr>
                                            ) : (
                                                report.events.map((event, index) => {
                                                    const isGain = event.realizedGain >= 0;
                                                    return (
                                                        <tr key={index} className="group transition-colors duration-150 hover:bg-[#ccff00] bg-white">
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-black text-black uppercase border-r-2 border-black">
                                                                {event.asset}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-xs font-mono font-bold text-black border-r-2 border-black">
                                                                {new Date(event.sellDate).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-mono font-bold text-black border-r-2 border-black">
                                                                {event.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-mono font-bold text-black border-r-2 border-black">
                                                                ${event.proceeds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-mono font-bold text-black border-r-2 border-black">
                                                                ${event.costBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td>
                                                            <td className={`px-4 py-3 whitespace-nowrap text-right text-sm font-mono font-black border-r-2 border-black ${isGain ? 'text-blue-700' : 'text-red-600'}`}>
                                                                ${event.realizedGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                                <span className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-2 border-black ${event.term === 'LONG' ? 'bg-[#ccff00] text-black' : 'bg-black text-white'}`}>
                                                                    {event.term}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default TaxReportModal;
