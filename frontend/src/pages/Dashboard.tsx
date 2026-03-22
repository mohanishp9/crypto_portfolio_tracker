import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useGetCurrentUserQuery, useLogoutMutation } from "../services/authApi";
import type { RootState } from "../app/store";
import {
    openAddModal,
    openDeleteModal,
    setSelectedTransaction,
} from "../features/portfolio/portfolioSlice";
import { logout as logoutAction } from "../features/auth/authSlice";
import { usePortfolioData } from "../hooks/usePortfolioData";
import Navbar from "../components/Navbar";
import PortfolioStats from "../components/PortfolioStats";
import HoldingsTable from "../components/HoldingsTable";
import TransactionsTable from "../components/TransactionsTable";
import TopCoinsList from "../components/TopCoinsList";
import AddHoldingModal from "../components/AddHoldingModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import PortfolioCharts from "../components/PortfolioCharts";
import MarketStaleBanner from "../components/MarketStaleBanner";
import WatchlistPanel from "../components/WatchlistPanel";
import AlertsPanel from "../components/AlertsPanel";
import CoinDetailDrawer from "../components/CoinDetailDrawer";
import ImportExportPanel from "../components/ImportExportPanel";

const Dashboard = () => {
  const { data, isLoading, error } = useGetCurrentUserQuery();
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null);

  const { isAddModalOpen, isDeleteModalOpen } = useSelector((state: RootState) => state.portfolio);
  const {
    transactionsData,
    statsData,
    transactionsLoading,
    statsLoading,
    refetchPortfolio,
    pollingInterval,
  } = usePortfolioData();

  useEffect(() => {
    if (error && "status" in error && error.status === 401) {
      dispatch(logoutAction());
      navigate("/login");
    }
  }, [error, navigate, dispatch]);

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } finally {
      dispatch(logoutAction());
      navigate("/login");
    }
  };

  const handleDelete = (transaction: any) => {
    dispatch(setSelectedTransaction(transaction));
    dispatch(openDeleteModal());
  };

  const handleEdit = (transaction: any) => {
    dispatch(setSelectedTransaction(transaction));
    dispatch(openAddModal());
  };

  const topMovers = useMemo(() => {
    const holdings = statsData?.portfolio ?? [];
    return {
      gainers: [...holdings].sort((a, b) => b.priceChange24h - a.priceChange24h).slice(0, 3),
      losers: [...holdings].sort((a, b) => a.priceChange24h - b.priceChange24h).slice(0, 3),
    };
  }, [statsData]);

  if (isLoading || transactionsLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#1a1c1a" }}>
        <p style={{ color: "#9aab97", letterSpacing: "0.2em", textTransform: "uppercase" }}>Loading dashboard...</p>
      </div>
    );
  }

  if (error && !("status" in error && error.status === 401)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#1a1c1a" }}>
        <div className="w-full max-w-sm text-center p-10" style={{ background: "#2e3330", border: "1px solid rgba(139,94,60,0.25)" }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "#ede8dd" }}>Something went still</h3>
          <p style={{ marginTop: "12px", color: "#6b7c6a" }}>We couldn't load your data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#1a1c1a" }}>
      <Navbar email={data?.user.email} handleLogout={handleLogout} isLoggingOut={isLoggingOut} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 p-8" style={{ background: "#2a3d2e", borderBottom: "1px solid rgba(88,117,96,0.2)" }}>
          <p style={{ fontSize: "0.58rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "#587560", marginBottom: "10px" }}>
            Welcome back
          </p>
          <h2
            className="font-light"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: "#ede8dd", letterSpacing: "0.04em", lineHeight: 1.1 }}
          >
            {data?.user.name}
            <span style={{ fontStyle: "italic", color: "#9aab97", fontSize: "70%", marginLeft: "12px" }}>
              your grove
            </span>
          </h2>
          <p style={{ color: "#9aab97", fontSize: "0.75rem", marginTop: "12px", letterSpacing: "0.08em" }}>
            Polling every {(pollingInterval / 1000).toFixed(0)}s while this tab stays open.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => dispatch(openAddModal())}
            style={primaryButton}
          >
            Add Transaction
          </button>
          <button
            onClick={refetchPortfolio}
            style={secondaryButton}
          >
            Refresh Prices
          </button>
        </div>

        <MarketStaleBanner
          lastUpdated={statsData?.lastUpdated}
          staleReason={statsData?.usedStalePrices ? statsData?.staleReason : undefined}
          onRefresh={refetchPortfolio}
        />

        <PortfolioStats statsData={statsData} />
        <PortfolioCharts statsData={statsData} />

        <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-6 mt-8">
          <div className="space-y-6 min-w-0">
            <HoldingsTable statsData={statsData} onSelectCoin={setSelectedCoinId} />
            <TransactionsTable
              transactions={transactionsData?.transactions || []}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
            />
            <ImportExportPanel />
          </div>

          <div className="space-y-6">
            <TopCoinsList onSelectCoin={setSelectedCoinId} />
            <WatchlistPanel onSelectCoin={setSelectedCoinId} />
            <AlertsPanel />
            <MarketPulse title="Strongest 24H Movers" items={topMovers.gainers} tone="up" />
            <MarketPulse title="Weakest 24H Movers" items={topMovers.losers} tone="down" />
          </div>
        </div>
      </main>

      {isAddModalOpen && <AddHoldingModal />}
      {isDeleteModalOpen && <DeleteConfirmModal />}
      <CoinDetailDrawer coinId={selectedCoinId} onClose={() => setSelectedCoinId(null)} />
    </div>
  );
};

const MarketPulse = ({
  title,
  items,
  tone,
}: {
  title: string;
  items: Array<{ coinName: string; coinSymbol: string; priceChange24h: number }>;
  tone: "up" | "down";
}) => (
  <div className="p-6" style={{ background: "#2e3330", border: "1px solid rgba(61,74,62,0.3)" }}>
    <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b7c6a" }}>{title}</p>
    <div className="space-y-3 mt-5">
      {items.length > 0 ? items.map((item) => (
        <div key={item.coinSymbol} className="flex items-center justify-between" style={{ color: "#d4cfc4" }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#ede8dd" }}>{item.coinName}</div>
            <div style={{ fontSize: "0.52rem", letterSpacing: "0.2em", color: "#6b7c6a", textTransform: "uppercase" }}>{item.coinSymbol}</div>
          </div>
          <div style={{ color: tone === "up" ? "#587560" : "#8b5e3c", fontSize: "0.72rem" }}>
            {item.priceChange24h >= 0 ? "+" : ""}
            {item.priceChange24h.toFixed(2)}%
          </div>
        </div>
      )) : (
        <p style={{ color: "#6b7c6a", fontSize: "0.75rem" }}>Add holdings to unlock this view.</p>
      )}
    </div>
  </div>
);

const primaryButton: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(196,136,90,0.4)",
  color: "#c4885a",
  padding: "10px 28px",
  fontSize: "0.6rem",
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  fontFamily: "'DM Mono', monospace",
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(107,124,106,0.35)",
  color: "#9aab97",
  padding: "10px 22px",
  fontSize: "0.6rem",
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  fontFamily: "'DM Mono', monospace",
  cursor: "pointer",
};

export default Dashboard;
