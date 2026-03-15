import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
    PortfolioMutationResponse,
    PortfolioStatsResponse,
    AddTransactionInput,
} from '../types/portfolio.types';

import type {
    CoinSearchResult,
    TopCoin
} from '../types/coin.types';

export const portfolioApi = createApi({
    reducerPath: 'portfolioApi',

    // Base query configuration
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL,
        credentials: 'include', // Send cookies with requests
    }),

    tagTypes: ['Portfolio'],

    // Define endpoints
    endpoints: (builder) => ({
        // getTransactions (formerly getPortfolio)
        getTransactions: builder.query<{ success: boolean; transactions: any[] }, void>({
            query: () => '/portfolio/transactions',
            providesTags: ['Portfolio'],
        }),

        // addTransaction
        addTransaction: builder.mutation<PortfolioMutationResponse, AddTransactionInput>({
            query: (transaction) => ({
                url: '/portfolio/transactions',
                method: 'POST',
                body: transaction,
            }),
            invalidatesTags: ['Portfolio'],
        }),

        // deleteTransaction
        deleteTransaction: builder.mutation<PortfolioMutationResponse, string>({
            query: (id) => ({
                url: `/portfolio/transactions/${id}`,
                method: 'DELETE',
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

        getTopCoins: builder.query<{ success: boolean; coins: TopCoin[] }, void>({
            query: () => '/market/top?limit=10'
        })
    }),
});

export const {
    useGetTransactionsQuery,
    useAddTransactionMutation,
    useDeleteTransactionMutation,
    useGetPortfolioStatsQuery,
    useSearchCoinsQuery,
    useGetTopCoinsQuery,
} = portfolioApi;
