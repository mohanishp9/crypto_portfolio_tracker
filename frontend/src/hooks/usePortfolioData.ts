import { useGetPortfolioQuery, useGetPortfolioStatsQuery } from "../services/portfolioApi";

export const usePortfolioData = () => {
    const {
        data: portfolioData,
        isLoading: portfolioLoading,
        error: portfolioError,
    } = useGetPortfolioQuery(undefined, {
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
        portfolioData,
        statsData,
        portfolioLoading,
        statsLoading,
        portfolioError,
        statsError,
    };
};
