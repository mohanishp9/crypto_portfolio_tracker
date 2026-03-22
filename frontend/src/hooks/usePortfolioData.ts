import { useEffect, useState } from "react";
import { useGetTransactionsQuery, useGetPortfolioStatsQuery } from "../services/portfolioApi";

export const usePortfolioData = () => {
    const getPollingInterval = () => (document.visibilityState === "visible" ? 90_000 : 5 * 60_000);
    const [pollingInterval, setPollingInterval] = useState<number>(getPollingInterval);

    useEffect(() => {
        const handleVisibilityChange = () => {
            setPollingInterval(getPollingInterval());
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    const {
        data: transactionsData,
        isLoading: transactionsLoading,
        error: transactionsError,
        refetch: refetchTransactions,
    } = useGetTransactionsQuery(undefined, {
        pollingInterval,
    });

    const {
        data: statsData,
        isLoading: statsLoading,
        error: statsError,
        refetch: refetchStats,
    } = useGetPortfolioStatsQuery(undefined, {
        pollingInterval,
    });

    return {
        transactionsData,
        statsData,
        transactionsLoading,
        statsLoading,
        transactionsError,
        statsError,
        refetchPortfolio: () => {
            refetchTransactions();
            refetchStats();
        },
        pollingInterval,
    };
};
