import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../app/store";
import { useDeleteHoldingMutation } from "../services/portfolioApi";
import { closeDeleteModal, clearSelectedHolding } from "../features/portfolio/portfolioSlice";

const DeleteConfirmModal = () => {

    const dispatch = useDispatch();
    const [deleteHolding, { isLoading }] = useDeleteHoldingMutation();
    const selectedHolding = useSelector((state: RootState) => state.portfolio.selectedHolding);
    const isDeleteModalOpen = useSelector((state: RootState) => state.portfolio.isDeleteModalOpen);

    if (!isDeleteModalOpen || !selectedHolding) return null;

    const handleDelete = async () => {
        if (!selectedHolding?._id) return;
        await deleteHolding(selectedHolding?._id).unwrap();
        dispatch(closeDeleteModal());
        dispatch(clearSelectedHolding());
    }

    const handleCancel = () => {
        dispatch(closeDeleteModal());
        dispatch(clearSelectedHolding());
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Delete Holding
                </h2>
                <p className="text-gray-600 mb-6">
                    Are you sure you want to delete <b>{selectedHolding?.coinName}</b>?
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DeleteConfirmModal;