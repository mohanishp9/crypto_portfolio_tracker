/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../app/store";
import useDebounce from "../hooks/useDebounce";
import {
    useAddTransactionMutation,
    useSearchCoinsQuery,
    useUpdateTransactionMutation,
} from "../services/portfolioApi";
import { clearSelectedTransaction, closeAddModal } from "../features/portfolio/portfolioSlice";
import type { TransactionType } from "../types/portfolio.types";
import { X, Search } from "lucide-react";
import { usePostHog } from 'posthog-js/react';

const AddHoldingModal = () => {
    const dispatch = useDispatch();
    const isOpen = useSelector((state: RootState) => state.portfolio.isAddModalOpen);
    const selectedTransaction = useSelector((state: RootState) => state.portfolio.selectedTransaction);
    const isEditing = Boolean(selectedTransaction?._id);
    const [addTransaction, { isLoading: isAdding }] = useAddTransactionMutation();
    const [updateTransaction, { isLoading: isUpdating }] = useUpdateTransactionMutation();
    const posthog = usePostHog();

    const [coinInput, setCoinInput] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const debouncedCoin = useDebounce(coinInput);
    const { data: coins } = useSearchCoinsQuery(debouncedCoin, {
        skip: debouncedCoin.length < 2 || isEditing,
    });

    const [formData, setFormData] = useState({
        coinId: "",
        coinName: "",
        coinSymbol: "",
        quantity: "",
        price: "",
        fee: "",
        type: "BUY" as TransactionType,
        timestamp: new Date().toISOString().slice(0, 16),
    });
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        if (selectedTransaction) {
            setFormData({
                coinId: selectedTransaction.coinId,
                coinName: selectedTransaction.coinName,
                coinSymbol: selectedTransaction.coinSymbol,
                quantity: String(selectedTransaction.quantity),
                price: String(selectedTransaction.price),
                fee: String(selectedTransaction.fee ?? 0),
                type: selectedTransaction.type,
                timestamp: new Date(selectedTransaction.timestamp).toISOString().slice(0, 16),
            });
            setCoinInput(selectedTransaction.coinName);
        } else {
            setFormData({
                coinId: "",
                coinName: "",
                coinSymbol: "",
                quantity: "",
                price: "",
                fee: "",
                type: "BUY",
                timestamp: new Date().toISOString().slice(0, 16),
            });
            setCoinInput("");
        }
        setErrorMessage(null);
        setShowDropdown(false);
    }, [isOpen, selectedTransaction]);

    if (!isOpen) return null;

    const isLoading = isAdding || isUpdating;

    const handleClose = () => {
        dispatch(closeAddModal());
        dispatch(clearSelectedTransaction());
    };

    const handleCoinSelect = (coin: { id: string; name: string; symbol: string }) => {
        setFormData((prev) => ({
            ...prev,
            coinId: coin.id,
            coinName: coin.name,
            coinSymbol: coin.symbol,
        }));
        setCoinInput(coin.name);
        setShowDropdown(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        const payload = {
            ...formData,
            quantity: Number(formData.quantity),
            price: Number(formData.price),
            fee: formData.fee ? Number(formData.fee) : 0,
            timestamp: new Date(formData.timestamp).toISOString(),
        };

        if (!payload.coinId || payload.quantity <= 0 || payload.price <= 0) {
            setErrorMessage("Choose a coin and enter valid quantity and price.");
            return;
        }

        try {
            if (selectedTransaction?._id) {
                await updateTransaction({ id: selectedTransaction._id, transaction: payload }).unwrap();
                posthog?.capture('Updated Coin in Portfolio', { coin: payload.coinSymbol, type: payload.type });
            } else {
                await addTransaction(payload).unwrap();
                posthog?.capture('Added Coin to Portfolio', { coin: payload.coinSymbol, type: payload.type });
            }
            handleClose();
        } catch (err: unknown) {
            const error = err as { data?: { message?: string }, error?: string };
            setErrorMessage(error?.data?.message || error?.error || "Failed to save transaction.");
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[100] px-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                <div className="px-8 py-5 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] tracking-widest uppercase text-indigo-400 mb-1 font-semibold">
                            Portfolio
                        </p>
                        <h2 className="font-semibold text-2xl text-zinc-50 tracking-tight flex gap-2">
                            {isEditing ? "Edit" : "Add"} <span className="font-normal text-zinc-500 italic">Transaction</span>
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-zinc-500 hover:text-zinc-50 hover:bg-zinc-800 rounded-md transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-8 py-7 space-y-6">
                    <div className="relative z-20">
                        <label className="block text-[10px] tracking-widest uppercase text-zinc-500 mb-2 font-semibold">Coin</label>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                            <input
                                type="text"
                                value={coinInput}
                                disabled={isEditing}
                                onChange={(e) => {
                                    setCoinInput(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onFocus={() => {
                                    if (coinInput.length >= 2 && !isEditing) setShowDropdown(true);
                                }}
                                onBlur={() => {
                                    setTimeout(() => setShowDropdown(false), 150);
                                }}
                                autoComplete="off"
                                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 text-sm py-2.5 pl-9 pr-4 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors placeholder-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="Search by coin name..."
                            />
                        </div>

                        {showDropdown && coins && coins.length > 0 && (
                            <ul className="absolute top-full left-0 right-0 mt-1 bg-zinc-950 border border-zinc-800 rounded-lg max-h-56 overflow-y-auto shadow-xl py-1 z-30">
                                {coins.map((coin) => (
                                    <li
                                        key={coin.id}
                                        onMouseDown={() => handleCoinSelect(coin)}
                                        className="px-4 py-2.5 hover:bg-zinc-800 cursor-pointer flex items-center justify-between transition-colors"
                                    >
                                        <span className="text-sm text-zinc-300 font-medium">{coin.name}</span>
                                        <span className="text-[10px] tracking-widest font-mono text-zinc-500 uppercase">{coin.symbol}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
                        <div>
                            <label className="block text-[10px] tracking-widest uppercase text-zinc-500 mb-3 font-semibold">Type</label>
                            <div className="flex gap-4">
                                {(["BUY", "SELL"] as TransactionType[]).map((type) => (
                                    <label key={type} className="flex items-center gap-2 cursor-pointer group">
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${formData.type === type ? (type === "BUY" ? "border-emerald-500 bg-emerald-500/10" : "border-rose-500 bg-rose-500/10") : "border-zinc-700 group-hover:border-zinc-500"}`}>
                                            {formData.type === type && <div className={`w-2 h-2 rounded-full ${type === "BUY" ? "bg-emerald-500" : "bg-rose-500"}`} />}
                                        </div>
                                        <input
                                            type="radio"
                                            name="type"
                                            value={type}
                                            checked={formData.type === type}
                                            onChange={() => setFormData((prev) => ({ ...prev, type }))}
                                            className="hidden"
                                        />
                                        <span className={`text-xs font-semibold tracking-wider font-mono ${formData.type === type ? (type === "BUY" ? "text-emerald-500" : "text-rose-500") : "text-zinc-500 group-hover:text-zinc-300"}`}>
                                            {type}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] tracking-widest uppercase text-zinc-500 mb-2 font-semibold">Date</label>
                            <input
                                type="datetime-local"
                                value={formData.timestamp}
                                onChange={(e) => setFormData((prev) => ({ ...prev, timestamp: e.target.value }))}
                                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 font-mono text-xs py-2.5 px-3 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 relative z-10">
                        <div>
                            <label className="block text-[10px] tracking-widest uppercase text-zinc-500 mb-2 font-semibold">Quantity</label>
                            <input
                                type="number"
                                step="any"
                                value={formData.quantity}
                                onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                                placeholder="0.00"
                                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 font-mono text-sm py-2.5 px-3 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors placeholder-zinc-700"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] tracking-widest uppercase text-zinc-500 mb-2 font-semibold">Price / USD</label>
                            <input
                                type="number"
                                step="any"
                                value={formData.price}
                                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                                placeholder="0.00"
                                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 font-mono text-sm py-2.5 px-3 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors placeholder-zinc-700"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] tracking-widest uppercase text-zinc-500 mb-2 font-semibold">Fee / USD</label>
                            <input
                                type="number"
                                step="any"
                                value={formData.fee}
                                onChange={(e) => setFormData((prev) => ({ ...prev, fee: e.target.value }))}
                                placeholder="0.00"
                                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 font-mono text-sm py-2.5 px-3 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors placeholder-zinc-700"
                            />
                        </div>
                    </div>

                    {errorMessage && (
                        <div className="text-rose-500 text-xs font-mono bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
                            {errorMessage}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800 relative z-10">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-2.5 bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2.5 bg-indigo-500 border border-indigo-500 text-white hover:bg-indigo-600 hover:border-indigo-600 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-indigo-500/20"
                        >
                            {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Transaction"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddHoldingModal;
