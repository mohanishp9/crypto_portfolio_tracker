import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Holding } from '../../types/portfolio.types';

interface PortfolioState {
    selectedHolding: Holding | null;
    isAddModalOpen: boolean;
    isEditModalOpen: boolean;
    isDeleteModalOpen: boolean;
}

const initialState: PortfolioState = {
    selectedHolding: null,
    isAddModalOpen: false,
    isEditModalOpen: false,
    isDeleteModalOpen: false,
}

const portfolioSlice = createSlice({
    name: 'portfolio',
    initialState,
    reducers: {

        // Stores the holding the user clicked on
        // Used before opening edit modal
        setSelectedHolding: (state, action: PayloadAction<Holding>) => {
            state.selectedHolding = action.payload;
        },

        clearSelectedHolding: (state) => {
            state.selectedHolding = null;
        },

        // Opens Add Holding modal
        // Clears selectedHolding (usually)
        openAddModal: (state) => {
            state.isAddModalOpen = true;
            state.selectedHolding = null;
        },

        // Closes Add Holding modal
        // Resets form state if needed
        closeAddModal: (state) => {
            state.isAddModalOpen = false;
            state.selectedHolding = null;
        },

        // Opens Edit Holding modal
        // Assumes selectedHolding is already set
        openEditModal: (state) => {
            state.isEditModalOpen = true;
        },

        // Closes Edit Holding modal
        // Clears selectedHolding
        closeEditModal: (state) => {
            state.isEditModalOpen = false;
            state.selectedHolding = null;
        },

        openDeleteModal: (state) => {
            state.isDeleteModalOpen = true;
        },

        closeDeleteModal: (state) => {
            state.isDeleteModalOpen = false;
            state.selectedHolding = null;
        },
    },
});

// Export actions
export const {
    setSelectedHolding,
    clearSelectedHolding,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
} = portfolioSlice.actions;

// Export reducer
export default portfolioSlice.reducer;