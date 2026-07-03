import { useState } from "react";
import {
    useExportTransactionsMutation,
    useImportTransactionsMutation,
} from "../services/portfolioApi";
import { Upload, Download, FileText, FileSpreadsheet } from "lucide-react";
import TaxReportModal from "./TaxReportModal";

const ImportExportPanel = () => {
    const [csv, setCsv] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [showTaxModal, setShowTaxModal] = useState(false);
    const [exportTransactions, { isLoading: isExporting }] = useExportTransactionsMutation();
    const [importTransactions, { isLoading: isImporting }] = useImportTransactionsMutation();

    const handleExport = async () => {
        try {
            const content = await exportTransactions().unwrap();
            const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "portfolio-transactions.csv");
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            setMessage("Transactions exported successfully.");
        } catch {
            setMessage("Failed to export transactions.");
        }
    };

    const handleImport = async (previewOnly: boolean) => {
        try {
            const response = await importTransactions({ csv, previewOnly }).unwrap();
            setMessage(previewOnly ? `Preview ready: ${response.count ?? response.preview?.length ?? 0} rows validated.` : `Imported ${response.count ?? 0} transactions successfully.`);
        } catch (err: unknown) {
            const error = err as { data?: { message?: string } };
            setMessage(error?.data?.message || "Import failed. Check your CSV format.");
        }
    };

    return (
        <div className="brutalist-card h-full flex flex-col">
            <p className="text-sm font-black uppercase tracking-tighter mb-4 border-b-4 border-black pb-2">
                DATA MANAGEMENT
            </p>
            <h3 className="font-black text-xl text-black tracking-tight mt-1">
                IMPORT, EXPORT & TAX REPORTS
            </h3>
            <textarea
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
                placeholder="PASTE CSV WITH HEADER: coinId,coinName,coinSymbol,type,quantity,price,fee,timestamp"
                className="w-full min-h-[150px] mt-4 bg-white border-4 border-black text-black font-mono font-bold text-xs p-4 focus:outline-none focus:bg-[#ccff00] transition-colors resize-y placeholder-black uppercase brutalist-shadow-sm"
            />
            <div className="flex flex-wrap gap-3 mt-4">
                <button 
                    type="button" 
                    onClick={() => handleImport(true)} 
                    disabled={!csv || isImporting} 
                    className="brutalist-btn bg-white text-black hover:bg-[#ccff00] disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center"
                >
                    <FileText size={16} strokeWidth={2.5} /> PREVIEW
                </button>
                <button 
                    type="button" 
                    onClick={() => handleImport(false)} 
                    disabled={!csv || isImporting} 
                    className="brutalist-btn bg-black text-white hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center"
                >
                    <Upload size={16} strokeWidth={2.5} /> IMPORT
                </button>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
                <button 
                    type="button" 
                    onClick={handleExport} 
                    disabled={isExporting} 
                    className="brutalist-btn bg-white text-black hover:bg-[#ccff00] disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center"
                >
                    <Download size={16} strokeWidth={2.5} /> BACKUP
                </button>
                <button 
                    type="button" 
                    onClick={() => setShowTaxModal(true)} 
                    className="brutalist-btn bg-[#ccff00] text-black hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center"
                >
                    <FileSpreadsheet size={16} strokeWidth={2.5} /> TAX REPORT
                </button>
            </div>
            {message && (
                <p className={`mt-4 text-xs font-mono font-bold uppercase px-3 py-2 border-2 border-black ${message.includes("failed") ? "bg-[#ff3333] text-white" : "bg-black text-white"}`}>
                    {message}
                </p>
            )}
            
            {showTaxModal && <TaxReportModal onClose={() => setShowTaxModal(false)} />}
        </div>
    );
};

export default ImportExportPanel;
