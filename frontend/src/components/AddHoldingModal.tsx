import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../app/store";
import useDebounce from "../hooks/useDebounce";
import { useState } from "react";
import { useSearchCoinsQuery, useAddHoldingMutation } from "../services/portfolioApi";
import { closeAddModal } from "../features/portfolio/portfolioSlice";


const AddHoldingModal = () => {
    const dispatch = useDispatch();
    const isOpen = useSelector((state: RootState) => state.portfolio.isAddModalOpen);
    const [addHolding, { isLoading }] = useAddHoldingMutation();


    const [coinInput, setCoinInput] = useState<string>("");

    const debouncedCoin = useDebounce(coinInput);

    const { data: coins } = useSearchCoinsQuery(debouncedCoin, {
        skip: debouncedCoin.length < 2,
    })

    const [formData, setFormData] = useState({
        coinId: "",
        coinName: "",
        coinSymbol: "",
        quantity: "",
        buyPrice: "",
    });

    if (!isOpen) return null;

    const handleCoinSelect = (coin: any) => {
        setFormData((prev) => ({
            ...prev,
            coinId: coin.id,
            coinName: coin.name,
            coinSymbol: coin.symbol,
        }));
        setCoinInput(coin.name);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const quantity = Number(formData.quantity);
        const buyPrice = Number(formData.buyPrice);

        if (!formData.coinId || quantity <= 0 || buyPrice <= 0) {
            return;
        }

        try {
            await addHolding({ ...formData, quantity, buyPrice }).unwrap();
            // Reset form
            setFormData({
                coinId: "",
                coinName: "",
                coinSymbol: "",
                quantity: "",
                buyPrice: "",
            });
            setCoinInput("");
            dispatch(closeAddModal());
        } catch (err) {
            console.error('Failed to add holding:', err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">Add Holding</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Coin Search */}
                    <div>
                        <label htmlFor="coin" className="block text-sm font-medium">Coin</label>
                        <input
                            id="coin"
                            type="text"
                            value={coinInput}
                            onChange={(e) => setCoinInput(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                        {coins && coins.length > 0 && (
                            <ul className="border rounded mt-1 max-h-40 overflow-y-auto">
                                {coins.map((coin) => (
                                    <li
                                        key={coin.id}
                                        className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleCoinSelect(coin)}
                                    >
                                        {coin.name} ({coin.symbol})
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Quantity  */}
                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium">Quantity</label>
                        <input
                            id="quantity"
                            type="number"
                            value={formData.quantity}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    quantity: e.target.value,
                                }))
                            }
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    {/* Buy Price */}
                    <div>
                        <label className="block text-sm font-medium">Buy Price (USD)</label>
                        <input
                            type="number"
                            value={formData.buyPrice}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    buyPrice: e.target.value,
                                }))
                            }
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => dispatch(closeAddModal())}
                            className="px-4 py-2 border rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded"
                        >
                            {isLoading ? 'Adding...' : 'Add Holding'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddHoldingModal;