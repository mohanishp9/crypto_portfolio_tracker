import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";
import type { CoinSearchResult, TopCoin } from "../types/coin.types";
import type {
    AddAlertInput,
    AddTransactionInput,
    AddWatchlistItemInput,
    AlertsResponse,
    CoinDetailResponse,
    CoinChartResponse,
    PortfolioMutationResponse,
    PortfolioStatsResponse,
    PortfolioAnalyticsResponse,
    PriceAlert,
    Transaction,
    TransactionsResponse,
    WatchlistResponse,
} from "../types/portfolio.types";

export const portfolioApi = createApi({
    reducerPath: "portfolioApi",
    baseQuery: baseQueryWithReauth, // Automatically handles 401s and token rotation
    tagTypes: ["Portfolio", "Watchlist", "Alerts", "Market"],
    endpoints: (builder) => ({
        getTransactions: builder.query<TransactionsResponse, { page?: number; limit?: number; search?: string } | void>({
            query: (params) => {
                const page = params?.page ?? 1;
                const limit = params?.limit ?? 10;
                const search = params?.search ?? "";
                return `/portfolio/transactions?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
            },
            providesTags: ["Portfolio"],
        }),
        addTransaction: builder.mutation<PortfolioMutationResponse, AddTransactionInput>({
            query: (transaction) => ({
                url: "/portfolio/transactions",
                method: "POST",
                body: transaction,
            }),
            invalidatesTags: ["Portfolio"],
        }),
        updateTransaction: builder.mutation<PortfolioMutationResponse, { id: string; transaction: AddTransactionInput }>({
            query: ({ id, transaction }) => ({
                url: `/portfolio/transactions/${id}`,
                method: "PATCH",
                body: transaction,
            }),
            invalidatesTags: ["Portfolio"],
        }),
        deleteTransaction: builder.mutation<PortfolioMutationResponse, string>({
            query: (id) => ({
                url: `/portfolio/transactions/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Portfolio"],
        }),
        getPortfolioStats: builder.query<PortfolioStatsResponse, void>({
            query: () => "/portfolio/stats",
            providesTags: ["Portfolio", "Alerts"],
        }),
        getPortfolioAnalytics: builder.query<PortfolioAnalyticsResponse, void>({
            query: () => "/portfolio/analytics",
            providesTags: ["Portfolio"],
        }),
        searchCoins: builder.query<CoinSearchResult[], string>({
            query: (searchTerm) => `/portfolio/search?query=${encodeURIComponent(searchTerm)}`,
            transformResponse: (response: { success: boolean; coins: CoinSearchResult[] }) => response.coins,
        }),
        getTopCoins: builder.query<{ success: boolean; coins: TopCoin[]; lastUpdated: string; stale: boolean; staleReason?: string }, void>({
            query: () => "/market/top?limit=10",
            providesTags: ["Market"],
        }),
        getCoinDetail: builder.query<CoinDetailResponse, string>({
            query: (coinId) => `/market/coins/${coinId}`,
            providesTags: (_result, _error, coinId) => [{ type: "Market", id: coinId }],
        }),
        getCoinChart: builder.query<CoinChartResponse, { coinId: string; days?: number }>({
            query: ({ coinId, days = 7 }) => `/market/chart/${coinId}?days=${days}`,
            providesTags: (_result, _error, arg) => [{ type: "Market", id: `chart-${arg.coinId}` }],
        }),
        getWatchlist: builder.query<WatchlistResponse, void>({
            query: () => "/watchlist",
            providesTags: ["Watchlist", "Market"],
        }),
        addToWatchlist: builder.mutation<{ success: boolean }, AddWatchlistItemInput>({
            query: (body) => ({
                url: "/watchlist",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Watchlist"],
        }),
        deleteFromWatchlist: builder.mutation<{ success: boolean; coinId: string }, string>({
            query: (coinId) => ({
                url: `/watchlist/${coinId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Watchlist"],
        }),
        getAlerts: builder.query<AlertsResponse, void>({
            query: () => "/alerts",
            providesTags: ["Alerts"],
        }),
        addAlert: builder.mutation<{ success: boolean; alert: PriceAlert }, AddAlertInput>({
            query: (body) => ({
                url: "/alerts",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Alerts"],
        }),
        updateAlert: builder.mutation<{ success: boolean; alert: PriceAlert }, { id: string; patch: Partial<AddAlertInput> & { isActive?: boolean } }>({
            query: ({ id, patch }) => ({
                url: `/alerts/${id}`,
                method: "PATCH",
                body: patch,
            }),
            invalidatesTags: ["Alerts"],
        }),
        deleteAlert: builder.mutation<{ success: boolean; id: string }, string>({
            query: (id) => ({
                url: `/alerts/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Alerts"],
        }),
        exportTransactions: builder.mutation<string, void>({
            query: () => ({
                url: "/portfolio/export",
                method: "GET",
                responseHandler: async (response) => response.text(),
            }),
        }),
        exportTaxReport: builder.mutation<string, { year?: number }>({
            query: ({ year }) => ({
                url: `/portfolio/tax-report${year ? `?year=${year}` : ""}`,
                method: "GET",
                responseHandler: async (response) => response.text(),
            }),
        }),
        importTransactions: builder.mutation<{ success: boolean; preview?: Transaction[]; count?: number }, { csv: string; previewOnly?: boolean }>({
            query: (body) => ({
                url: "/portfolio/import",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Portfolio"],
        }),
    }),
});

export const {
    useAddAlertMutation,
    useAddToWatchlistMutation,
    useAddTransactionMutation,
    useDeleteAlertMutation,
    useDeleteFromWatchlistMutation,
    useDeleteTransactionMutation,
    useExportTransactionsMutation,
    useExportTaxReportMutation,
    useGetAlertsQuery,
    useGetCoinDetailQuery,
    useGetCoinChartQuery,
    useGetPortfolioStatsQuery,
    useGetPortfolioAnalyticsQuery,
    useGetTopCoinsQuery,
    useGetTransactionsQuery,
    useGetWatchlistQuery,
    useImportTransactionsMutation,
    useSearchCoinsQuery,
    useUpdateAlertMutation,
    useUpdateTransactionMutation,
} = portfolioApi;
