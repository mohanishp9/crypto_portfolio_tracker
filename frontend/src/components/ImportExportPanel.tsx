import { useState } from "react";
import {
    useExportTransactionsMutation,
    useImportTransactionsMutation,
} from "../services/portfolioApi";

const ImportExportPanel = () => {
    const [csv, setCsv] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [exportTransactions, { isLoading: isExporting }] = useExportTransactionsMutation();
    const [importTransactions, { isLoading: isImporting }] = useImportTransactionsMutation();

    const handleExport = async () => {
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
        setMessage("Transactions exported.");
    };

    const handleImport = async (previewOnly: boolean) => {
        try {
            const response = await importTransactions({ csv, previewOnly }).unwrap();
            setMessage(previewOnly ? `Preview ready: ${response.count ?? response.preview?.length ?? 0} rows validated.` : `Imported ${response.count ?? 0} transactions.`);
        } catch (err: any) {
            setMessage(err?.data?.message || "Import failed.");
        }
    };

    return (
        <div className="p-6" style={{ background: "#2e3330", border: "1px solid rgba(61,74,62,0.3)" }}>
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b7c6a" }}>
                Import / Export
            </p>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", color: "#ede8dd", marginTop: "12px" }}>
                Move Data In and Out
            </h3>
            <textarea
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
                placeholder="Paste CSV with header: coinId,coinName,coinSymbol,type,quantity,price,fee,timestamp"
                style={{
                    width: "100%",
                    minHeight: "150px",
                    marginTop: "18px",
                    background: "#1a1c1a",
                    border: "1px solid rgba(61,74,62,0.4)",
                    color: "#ede8dd",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.68rem",
                    padding: "12px 14px",
                    outline: "none",
                }}
            />
            <div className="flex flex-wrap gap-3 mt-4">
                <button type="button" onClick={() => handleImport(true)} disabled={!csv || isImporting} style={buttonStyle}>
                    Preview CSV
                </button>
                <button type="button" onClick={() => handleImport(false)} disabled={!csv || isImporting} style={buttonStyle}>
                    Import CSV
                </button>
                <button type="button" onClick={handleExport} disabled={isExporting} style={buttonStyle}>
                    Export Transactions
                </button>
            </div>
            {message && <p style={{ color: "#9aab97", fontSize: "0.72rem", marginTop: "16px" }}>{message}</p>}
        </div>
    );
};

const buttonStyle: React.CSSProperties = {
    background: "transparent",
    border: "1px solid rgba(196,136,90,0.35)",
    color: "#c4885a",
    padding: "10px 14px",
    fontSize: "0.58rem",
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    fontFamily: "'DM Mono', monospace",
    cursor: "pointer",
};

export default ImportExportPanel;
