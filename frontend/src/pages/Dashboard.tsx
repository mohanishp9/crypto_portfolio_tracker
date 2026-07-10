import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import useDebounce from "../hooks/useDebounce";
import { useGetCurrentUserQuery, useLogoutMutation } from "../services/authApi";
import type { RootState } from "../app/store";
import {
    openAddModal,
    openDeleteModal,
    setSelectedTransaction,
} from "../features/portfolio/portfolioSlice";
import { logout as logoutAction } from "../features/auth/authSlice";
import type { Transaction } from "../types/portfolio.types";
import { usePortfolioData } from "../hooks/usePortfolioData";
import Navbar from "../components/Navbar";
import PortfolioStats from "../components/PortfolioStats";
import HoldingsTable from "../components/HoldingsTable";
import TransactionsTable from "../components/TransactionsTable";
import TopCoinsList from "../components/TopCoinsList";
import AddHoldingModal from "../components/AddHoldingModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import PortfolioCharts from "../components/PortfolioCharts";
import PortfolioAnalytics from "../components/PortfolioAnalytics";
import MarketStaleBanner from "../components/MarketStaleBanner";
import WatchlistPanel from "../components/WatchlistPanel";
import AlertsPanel from "../components/AlertsPanel";
import CoinDetailDrawer from "../components/CoinDetailDrawer";
import ImportExportPanel from "../components/ImportExportPanel";
import { Skeleton } from "../components/common/Skeleton";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableDashboardWidget } from "../components/SortableDashboardWidget";

const Dashboard = () => {
  const { data, isLoading, error } = useGetCurrentUserQuery();
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { isAddModalOpen, isDeleteModalOpen } = useSelector((state: RootState) => state.portfolio);
  const {
    transactionsData,
    statsData,
    transactionsLoading,
    statsLoading,
    refetchPortfolio,
    pollingInterval,
  } = usePortfolioData({ page, limit: 10, search: debouncedSearch });

  useEffect(() => {
    if (error && "status" in error && error.status === 401) {
      dispatch(logoutAction());
      navigate("/");
    }
  }, [error, navigate, dispatch]);

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } finally {
      dispatch(logoutAction());
      navigate("/");
    }
  };

  const handleDelete = (transaction: Transaction) => {
    dispatch(setSelectedTransaction(transaction));
    dispatch(openDeleteModal());
  };

  const handleEdit = (transaction: Transaction) => {
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

  const DEFAULT_MAIN = ["holdings", "transactions", "importExport"];
  const [mainOrder, setMainOrder] = useState<string[]>(DEFAULT_MAIN);

  const DEFAULT_SIDEBAR = ["liveMarket", "watchlist", "alerts", "gainers", "losers"];
  const [sidebarOrder, setSidebarOrder] = useState<string[]>(DEFAULT_SIDEBAR);

  useEffect(() => {
    const savedSidebar = localStorage.getItem("sidebar_layout");
    if (savedSidebar) {
      try {
        const parsed = JSON.parse(savedSidebar);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_SIDEBAR.length) {
          setSidebarOrder(parsed);
        }
      } catch (e) {}
    }

    const savedMain = localStorage.getItem("main_layout");
    if (savedMain) {
      try {
        const parsed = JSON.parse(savedMain);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_MAIN.length) {
          setMainOrder(parsed);
        }
      } catch (e) {}
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSidebarDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSidebarOrder((items) => {
        const oldIndex = items.indexOf(String(active.id));
        const newIndex = items.indexOf(String(over.id));
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem("sidebar_layout", JSON.stringify(newOrder));
        return newOrder;
      });
    }
  };

  const handleMainDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMainOrder((items) => {
        const oldIndex = items.indexOf(String(active.id));
        const newIndex = items.indexOf(String(over.id));
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem("main_layout", JSON.stringify(newOrder));
        return newOrder;
      });
    }
  };

  const renderMainWidget = (id: string) => {
    switch (id) {
      case "holdings":
        return (
          <SortableDashboardWidget key="holdings" id="holdings">
            <HoldingsTable statsData={statsData} onSelectCoin={setSelectedCoinId} isLoading={statsLoading} />
          </SortableDashboardWidget>
        );
      case "transactions":
        return (
          <SortableDashboardWidget key="transactions" id="transactions">
            <TransactionsTable
              transactions={transactionsData?.transactions || []}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              currentPage={transactionsData?.currentPage ?? 1}
              totalPages={transactionsData?.totalPages ?? 1}
              totalCount={transactionsData?.totalCount ?? 0}
              onPageChange={setPage}
              searchQuery={search}
              onSearchChange={setSearch}
              isLoading={transactionsLoading}
            />
          </SortableDashboardWidget>
        );
      case "importExport":
        return (
          <SortableDashboardWidget key="importExport" id="importExport">
            <ImportExportPanel />
          </SortableDashboardWidget>
        );
      default:
        return null;
    }
  };

  const renderSidebarWidget = (id: string) => {
    switch (id) {
      case "liveMarket":
        return (
          <SortableDashboardWidget key="liveMarket" id="liveMarket">
            <TopCoinsList onSelectCoin={setSelectedCoinId} />
          </SortableDashboardWidget>
        );
      case "watchlist":
        return (
          <SortableDashboardWidget key="watchlist" id="watchlist">
            <WatchlistPanel onSelectCoin={setSelectedCoinId} />
          </SortableDashboardWidget>
        );
      case "alerts":
        return (
          <SortableDashboardWidget key="alerts" id="alerts">
            <AlertsPanel />
          </SortableDashboardWidget>
        );
      case "gainers":
        return (
          <SortableDashboardWidget key="gainers" id="gainers">
            <MarketPulse title="Strongest 24H Movers" items={topMovers.gainers} tone="up" isLoading={statsLoading} />
          </SortableDashboardWidget>
        );
      case "losers":
        return (
          <SortableDashboardWidget key="losers" id="losers">
            <MarketPulse title="Weakest 24H Movers" items={topMovers.losers} tone="down" isLoading={statsLoading} />
          </SortableDashboardWidget>
        );
      default:
        return null;
    }
  };

  if (error && !("status" in error && error.status === 401)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-surface-primary">
        <Card elevation="raised" className="w-full max-w-sm text-center p-8">
          <h3 className="text-lg font-semibold text-text-primary">Something went wrong</h3>
          <p className="mt-3 text-sm text-text-secondary">We couldn&apos;t load your data. Please try again later.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar email={data?.user.email} handleLogout={handleLogout} isLoggingOut={isLoggingOut} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card elevation="raised" className="mb-8 p-6 sm:p-8">
          <p className="text-xs font-medium text-text-secondary mb-3">
            Welcome back
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight flex items-center gap-3">
            {isLoading ? (
              <Skeleton className="w-48 h-8 my-1" />
            ) : (
              data?.user.name
            )}
          </h2>
          <p className="text-xs text-text-tertiary mt-3">
            Prices refresh every {(pollingInterval / 1000).toFixed(0)}s while this tab is open
          </p>
        </Card>

        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            variant="primary"
            size="md"
            onClick={() => dispatch(openAddModal())}
          >
            Add transaction
          </Button>
        </div>

        <MarketStaleBanner
          lastUpdated={statsData?.lastUpdated}
          staleReason={statsData?.usedStalePrices ? statsData?.staleReason : undefined}
          onRefresh={refetchPortfolio}
        />

        <PortfolioStats statsData={statsData} isLoading={statsLoading} />
        <PortfolioCharts statsData={statsData} isLoading={statsLoading} />
        <PortfolioAnalytics />

        <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-6 mt-8">
          <div className="space-y-6 min-w-0">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleMainDragEnd}
            >
              <SortableContext items={mainOrder} strategy={verticalListSortingStrategy}>
                <div className="space-y-6">
                  {mainOrder.map((id) => renderMainWidget(id))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="space-y-6">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSidebarDragEnd}
            >
              <SortableContext items={sidebarOrder} strategy={verticalListSortingStrategy}>
                <div className="space-y-6">
                  {sidebarOrder.map((id) => renderSidebarWidget(id))}
                </div>
              </SortableContext>
            </DndContext>
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
  isLoading,
}: {
  title: string;
  items: Array<{ coinName: string; coinSymbol: string; priceChange24h: number }>;
  tone: "up" | "down";
  isLoading?: boolean;
}) => (
  <Card elevation="raised" className="p-5">
    <p className="text-xs font-medium text-text-secondary mb-4">{title}</p>
    <div className="space-y-4">
      {isLoading ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="w-16 h-4 mb-1" />
              <Skeleton className="w-8 h-3" />
            </div>
            <Skeleton className="w-12 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="w-20 h-4 mb-1" />
              <Skeleton className="w-10 h-3" />
            </div>
            <Skeleton className="w-10 h-4" />
          </div>
        </>
      ) : items.length > 0 ? items.map((item) => (
        <div key={item.coinSymbol} className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-text-primary">{item.coinName}</div>
            <div className="text-xs font-mono text-text-secondary uppercase mt-0.5">{item.coinSymbol}</div>
          </div>
          <div className={`font-mono text-sm tabular-nums font-medium ${tone === "up" ? "text-positive" : "text-negative"}`}>
            {item.priceChange24h >= 0 ? "+" : ""}
            {item.priceChange24h.toFixed(2)}%
          </div>
        </div>
      )) : (
        <p className="text-sm text-text-tertiary">Add holdings to unlock this view.</p>
      )}
    </div>
  </Card>
);

export default Dashboard;
