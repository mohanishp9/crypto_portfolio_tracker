import { useGetTransactionsQuery, useGetPortfolioStatsQuery } from "../services/portfolioApi";

export const usePortfolioData = () => {
    const {
        data: transactionsData,
        isLoading: transactionsLoading,
        error: transactionsError,
    } = useGetTransactionsQuery(undefined, {
        pollingInterval: 30000,
    });

    const {
        data: statsData,
        isLoading: statsLoading,
        error: statsError,
    } = useGetPortfolioStatsQuery(undefined, {
        pollingInterval: 30000,
    });

    return {
        transactionsData,
        statsData,
        transactionsLoading,
        statsLoading,
        transactionsError,
        statsError,
    };
};
