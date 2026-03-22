import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface PortfolioState {
    selectedTransaction: any | null;
    isAddModalOpen: boolean;
    isDeleteModalOpen: boolean;
}

const initialState: PortfolioState = {
    selectedTransaction: null,
    isAddModalOpen: false,
    isDeleteModalOpen: false,
}

const portfolioSlice = createSlice({
    name: 'portfolio',
    initialState,
    reducers: {
        setSelectedTransaction: (state, action: PayloadAction<any>) => {
            state.selectedTransaction = action.payload;
        },

        clearSelectedTransaction: (state) => {
            state.selectedTransaction = null;
        },

        openAddModal: (state) => {
            state.isAddModalOpen = true;
        },

        closeAddModal: (state) => {
            state.isAddModalOpen = false;
            state.selectedTransaction = null;
        },

        openDeleteModal: (state) => {
            state.isDeleteModalOpen = true;
        },

        closeDeleteModal: (state) => {
            state.isDeleteModalOpen = false;
            state.selectedTransaction = null;
        },
    },
});

export const {
    setSelectedTransaction,
    clearSelectedTransaction,
    openAddModal,
    closeAddModal,
    openDeleteModal,
    closeDeleteModal,
} = portfolioSlice.actions;

export default portfolioSlice.reducer;
