import { useState } from "react";
import {
    useExportTransactionsMutation,
    useImportTransactionsMutation,
    useExportTaxReportMutation,
} from "../services/portfolioApi";
import { Upload, Download, FileText, FileSpreadsheet } from "lucide-react";

const ImportExportPanel = () => {
    const [csv, setCsv] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [exportTransactions, { isLoading: isExporting }] = useExportTransactionsMutation();
    const [exportTaxReport, { isLoading: isExportingTax }] = useExportTaxReportMutation();
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

    const handleTaxExport = async () => {
        try {
            const content = await exportTaxReport({}).unwrap();
            const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `tax-report-all-years.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            setMessage(`Tax report exported successfully.`);
        } catch {
            setMessage("Failed to export tax report.");
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
        <div className="p-6 bg-surface-secondary border border-border-primary rounded-sm shadow-sm">
            <p className="text-xs font-medium text-text-tertiary">
                Data Management
            </p>
            <h3 className="font-semibold text-lg text-text-primary tracking-tight mt-2 flex items-center gap-2">
                Import, Export & Tax Reports
            </h3>
            <textarea
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
                placeholder="Paste CSV with header: coinId,coinName,coinSymbol,type,quantity,price,fee,timestamp"
                className="w-full min-h-[150px] mt-4 bg-surface-primary border border-border-primary rounded-sm text-text-primary font-mono text-xs p-4 focus:outline-none focus:border-accent transition-colors resize-y placeholder-text-tertiary"
            />
            <div className="flex flex-wrap gap-3 mt-4">
                <button 
                    type="button" 
                    onClick={() => handleImport(true)} 
                    disabled={!csv || isImporting} 
                    className="flex items-center gap-2 px-4 py-2 bg-surface-tertiary hover:bg-surface-tertiary border border-border-secondary text-text-secondary hover:text-text-primary rounded-sm text-xs font-semibold  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileText size={14} /> Preview CSV
                </button>
                <button 
                    type="button" 
                    onClick={() => handleImport(false)} 
                    disabled={!csv || isImporting} 
                    className="flex items-center gap-2 px-4 py-2 bg-accent-subtle hover:bg-accent-subtle border border-accent/30 text-accent rounded-sm text-xs font-semibold  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Upload size={14} /> Import CSV
                </button>
                <button 
                    type="button" 
                    onClick={handleExport} 
                    disabled={isExporting} 
                    className="flex items-center gap-2 px-4 py-2 bg-surface-tertiary hover:bg-surface-tertiary border border-border-secondary text-text-secondary hover:text-text-primary rounded-sm text-xs font-semibold  transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                >
                    <Download size={14} /> Backup Data
                </button>
                <button 
                    type="button" 
                    onClick={handleTaxExport} 
                    disabled={isExportingTax} 
                    className="flex items-center gap-2 px-4 py-2 bg-positive-subtle hover:bg-positive-subtle border border-positive/30 text-positive rounded-sm text-xs font-semibold  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileSpreadsheet size={14} /> Tax Report
                </button>
            </div>
            {message && (
                <p className={`mt-4 text-xs px-3 py-2 rounded border ${message.includes("failed") ? "bg-negative-subtle text-negative border-negative/20" : "bg-positive-subtle text-positive border-positive/20"}`}>
                    {message}
                </p>
            )}
        </div>
    );
};

export default ImportExportPanel;
