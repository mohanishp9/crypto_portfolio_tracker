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
  const DEFAULT_SIDEBAR = ["liveMarket", "watchlist", "alerts", "gainers", "losers"];

  const [sidebarOrder, setSidebarOrder] = useState<string[]>(() => {
    const savedSidebar = localStorage.getItem("sidebar_layout");
    if (savedSidebar) {
      try {
        const parsed = JSON.parse(savedSidebar);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_SIDEBAR.length) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse sidebar layout", e);
      }
    }
    return DEFAULT_SIDEBAR;
  });

  const [mainOrder, setMainOrder] = useState<string[]>(() => {
    const savedMain = localStorage.getItem("main_layout");
    if (savedMain) {
      try {
        const parsed = JSON.parse(savedMain);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_MAIN.length) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse main layout", e);
      }
    }
    return DEFAULT_MAIN;
  });

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
      <div className="min-h-screen bg-[#f4f4f0] text-black flex items-center justify-center px-4 font-sans">
        <div className="w-full max-w-sm text-center p-10 bg-white border-4 border-black brutalist-shadow">
          <h3 className="text-2xl font-black uppercase tracking-tighter">System Failure</h3>
          <p className="mt-3 font-mono font-bold">We couldn't load your data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f0] text-black font-sans">
      <Navbar email={data?.user.email} handleLogout={handleLogout} isLoggingOut={isLoggingOut} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 p-8 bg-[#ccff00] border-4 border-black brutalist-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 font-mono font-black text-6xl opacity-10 pointer-events-none">SYS_ACTIVE</div>
          <p className="text-sm font-mono font-bold uppercase tracking-widest mb-3">
            [ SECURE CONNECTION ESTABLISHED ]
          </p>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter flex items-center gap-3">
            {isLoading ? (
              <Skeleton className="w-48 h-12 my-1 border-4 border-black" />
            ) : (
              `WELCOME, ${data?.user.name}`
            )}
          </h2>
          <p className="text-sm mt-4 font-mono font-bold">
            &gt; STREAMING MARKET DATA: {(pollingInterval / 1000).toFixed(0)}s interval
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-8 border-b-4 border-black pb-8">
          <button
            onClick={() => dispatch(openAddModal())}
            className="brutalist-btn bg-white"
          >
            + ADD TRANSACTION
          </button>
          <button
            onClick={refetchPortfolio}
            className="brutalist-btn bg-black text-white"
          >
            REFRESH DATA
          </button>
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
  <div className="brutalist-card">
    <p className="text-xl font-black uppercase tracking-tighter border-b-4 border-black pb-2 mb-4">{title}</p>
    <div className="space-y-4">
      {isLoading ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="w-16 h-4 mb-1 border-2 border-black" />
              <Skeleton className="w-8 h-3 border-2 border-black" />
            </div>
            <Skeleton className="w-12 h-4 border-2 border-black" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="w-20 h-4 mb-1 border-2 border-black" />
              <Skeleton className="w-10 h-3 border-2 border-black" />
            </div>
            <Skeleton className="w-10 h-4 border-2 border-black" />
          </div>
        </>
      ) : items.length > 0 ? items.map((item) => (
        <div key={item.coinSymbol} className="flex items-center justify-between border-b-2 border-black pb-2 last:border-b-0">
          <div>
            <div className="text-sm font-bold uppercase">{item.coinName}</div>
            <div className="text-xs font-mono font-bold bg-[#ccff00] border-2 border-black px-1 inline-block mt-1">{item.coinSymbol}</div>
          </div>
          <div className={`font-mono text-lg font-black ${tone === "up" ? "text-blue-700" : "text-red-600"}`}>
            {item.priceChange24h >= 0 ? "+" : ""}
            {item.priceChange24h.toFixed(2)}%
          </div>
        </div>
      )) : (
        <p className="font-mono font-bold text-sm">NO DATA DETECTED.</p>
      )}
    </div>
  </div>
);

export default Dashboard;
