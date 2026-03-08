import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../app/store";
import { useEffect, useState } from "react";
import { useUpdateHoldingMutation } from "../services/portfolioApi";
import { clearSelectedHolding, closeEditModal } from "../features/portfolio/portfolioSlice";

const EditHoldingModal = () => {

    const dispatch = useDispatch();
    const isEditOpen = useSelector((state: RootState) => state.portfolio.isEditModalOpen);
    const selectedHolding = useSelector((state: RootState) => state.portfolio.selectedHolding);
    const [updateHolding, { isLoading }] = useUpdateHoldingMutation();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);


    const [formData, setFormData] = useState({

        quantity: selectedHolding?.quantity || 0,
        buyPrice: selectedHolding?.buyPrice || 0,
    })
    if (!isEditOpen || !selectedHolding) return null;

    useEffect(() => {
        if (selectedHolding) {
            setFormData({
                quantity: selectedHolding.quantity,
                buyPrice: selectedHolding.buyPrice,
            })
        }
    }, [selectedHolding])


    const handleUpdateHolding = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null); // Clear previous errors
        try {
            await updateHolding({
                holdingId: selectedHolding._id,
                quantity: formData.quantity,
                buyPrice: formData.buyPrice,
            }).unwrap();
            dispatch(closeEditModal());
        } catch (error: any) {
            console.error('Update error:', error);
            setErrorMessage(
                JSON.stringify(error?.data?.errors || error?.data?.message || "Failed to update holding")
            );
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: Number(e.target.value),
        })
    }

    const isUnchanged =
        formData.quantity === selectedHolding.quantity &&
        formData.buyPrice === selectedHolding.buyPrice;


    const handleClose = () => {
        dispatch(clearSelectedHolding());
        dispatch(closeEditModal());
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">Edit Holding</h2>

                <form onSubmit={handleUpdateHolding} className="space-y-4">
                    <div>
                        <label htmlFor="quantity">Quantity</label>
                        <input
                            type="number"
                            id="quantity"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label htmlFor="buyPrice">Buy Price</label>
                        <input
                            type="number"
                            id="buyPrice"
                            name="buyPrice"
                            value={formData.buyPrice}
                            onChange={handleChange}
                        />

                    </div>
                    {errorMessage && (
                        <p className="text-red-600 text-sm">
                            {errorMessage}
                        </p>
                    )}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 border rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || isUnchanged}
                            className="px-4 py-2 bg-indigo-600 text-white rounded"
                        >
                            {isLoading ? 'Updating...' : 'Update Holding'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EditHoldingModal;