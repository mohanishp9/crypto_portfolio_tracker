import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
    GetPortfolioResponse,
    PortfolioMutationResponse,
    PortfolioStatsResponse,
    AddHoldingInput,
    UpdateHoldingInput,
    DeleteHoldingInput
} from '../types/portfolio.types';

import type {
    CoinSearchResult
} from '../types/coin.types';

export const portfolioApi = createApi({
    reducerPath: 'portfolioApi',

    // Base query configuration
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
        credentials: 'include', // Send cookies with requests
    }),

    tagTypes: ['Portfolio'],

    // Define endpoints
    endpoints: (builder) => ({
        // getPortfolio
        getPortfolio: builder.query<GetPortfolioResponse, void>({
            query: () => '/portfolio',
            providesTags: ['Portfolio'],
        }),

        // addHolding
        addHolding: builder.mutation<PortfolioMutationResponse, AddHoldingInput>({
            query: (holding) => ({
                url: '/portfolio/holdings',
                method: 'POST',
                body: holding,
            }),
            invalidatesTags: ['Portfolio'],
        }),

        // updateHolding
        updateHolding: builder.mutation<PortfolioMutationResponse, UpdateHoldingInput>({
            query: ({ holdingId, ...body }) => ({
                url: `/portfolio/holdings/${holdingId}`,
                method: 'PUT',
                body: body, // Only send quantity and buyPrice
            }),
            invalidatesTags: ['Portfolio'],
        }),

        //deleteHolding
        deleteHolding: builder.mutation<PortfolioMutationResponse, DeleteHoldingInput>({
            query: (holdingId) => ({
                url: `/portfolio/holdings/${holdingId}`,
                method: 'DELETE',
                // body: holdingId,
            }),
            invalidatesTags: ['Portfolio'],
        }),

        // getPortfolioStats
        getPortfolioStats: builder.query<PortfolioStatsResponse, void>({
            query: () => '/portfolio/stats',
            providesTags: ['Portfolio'],
        }),

        searchCoins: builder.query<CoinSearchResult[], string>({
            query: (searchTerm) => `/portfolio/search?query=${searchTerm}`,
            transformResponse: (response: { success: boolean; coins: CoinSearchResult[] }) => response.coins,
        }),
    }),
});

export const {
    useGetPortfolioQuery,
    useAddHoldingMutation,
    useUpdateHoldingMutation,
    useDeleteHoldingMutation,
    useGetPortfolioStatsQuery,
    useSearchCoinsQuery,
} = portfolioApi;
