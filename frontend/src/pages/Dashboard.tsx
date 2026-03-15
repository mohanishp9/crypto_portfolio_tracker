import { useEffect, useState } from "react";
import { useGetCurrentUserQuery, useLogoutMutation } from "../services/authApi";
import { useDispatch, useSelector } from "react-redux";
import { logout as logoutAction } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import {
  useGetPortfolioQuery,
  useGetPortfolioStatsQuery,
} from "../services/portfolioApi";
import {
  openAddModal,
  openEditModal,
  setSelectedHolding,
  openDeleteModal,
} from "../features/portfolio/portfolioSlice";
import type { RootState } from "../app/store";
import type { Holding } from "../types/portfolio.types";
import AddHoldingModal from "../components/AddHoldingModal";
import EditHoldingModal from "../components/EditHoldingModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { usePortfolioData } from "../hooks/usePortfolioData";
import Navbar from "../components/Navbar";
import PortfolioStats from "../components/PortfolioStats";
import HoldingsTable from "../components/HoldingsTable";

const Dashboard = () => {
  const { data, isLoading, error } = useGetCurrentUserQuery();
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { selectedHolding, isAddModalOpen, isEditModalOpen, isDeleteModalOpen } =
    useSelector((state: RootState) => state.portfolio);

  const { portfolioData, statsData, portfolioLoading, statsLoading } = usePortfolioData();

  useEffect(() => {
    if (error && "status" in error && error.status === 401) {
      dispatch(logoutAction());
      navigate("/login");
    }
  }, [error, navigate, dispatch]);

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
      dispatch(logoutAction());
      navigate("/login");
    } catch {
      dispatch(logoutAction());
      navigate("/login");
    }
  };

  const handleEdit = (holding: Holding) => {
    dispatch(setSelectedHolding(holding));
    dispatch(openEditModal());
  };
  const handleDelete = (holding: Holding) => {
    dispatch(setSelectedHolding(holding));
    dispatch(openDeleteModal());
  };

  // ── Loading ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#1a1c1a" }}
      >
        <div className="flex flex-col items-center gap-6">
          {/* Breathing ring */}
          <div
            className="rounded-full"
            style={{
              width: 56, height: 56,
              border: "1px solid rgba(196,136,90,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            <div
              className="rounded-full"
              style={{
                width: 20, height: 20,
                background: "rgba(196,136,90,0.5)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
          </div>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.1rem",
              fontWeight: 300,
              color: "#6b7c6a",
              letterSpacing: "0.15em",
            }}
          >
            gathering your holdings...
          </p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────
  if (error && !("status" in error && error.status === 401)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#1a1c1a" }}
      >
        <div
          className="w-full max-w-sm text-center p-10"
          style={{
            background: "#2e3330",
            border: "1px solid rgba(139,94,60,0.25)",
          }}
        >
          {/* X mark */}
          <div
            className="mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{
              width: 44, height: 44,
              border: "1px solid rgba(139,94,60,0.35)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#8b5e3c" strokeWidth="1.2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>

          <h3
            className="font-light mb-3"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.4rem",
              color: "#ede8dd",
              letterSpacing: "0.04em",
            }}
          >
            Something went still
          </h3>
          <p
            className="mb-8"
            style={{
              fontSize: "0.65rem",
              letterSpacing: "0.12em",
              color: "#6b7c6a",
              lineHeight: 1.8,
            }}
          >
            We couldn't load your data.<br />Please try again later.
          </p>

          <button
            onClick={() => navigate("/login")}
            className="w-full transition-all duration-300"
            style={{
              background: "transparent",
              border: "1px solid rgba(196,136,90,0.4)",
              color: "#c4885a",
              padding: "11px 0",
              fontSize: "0.6rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              fontFamily: "'DM Mono', monospace",
              cursor: "pointer",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#c4885a";
              e.currentTarget.style.color = "#1a1c1a";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#c4885a";
            }}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#1a1c1a" }}>

      <Navbar
        email={data?.user.email}
        handleLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Welcome */}
        <div
          className="mb-8 p-8"
          style={{
            background: "#2a3d2e",
            borderBottom: "1px solid rgba(88,117,96,0.2)",
          }}
        >
          <p
            style={{
              fontSize: "0.58rem",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "#587560",
              marginBottom: "10px",
            }}
          >
            Welcome back
          </p>
          <h2
            className="font-light"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              color: "#ede8dd",
              letterSpacing: "0.04em",
              lineHeight: 1.1,
            }}
          >
            {data?.user.name}
            <span
              style={{
                fontStyle: "italic",
                color: "#9aab97",
                fontSize: "70%",
                marginLeft: "12px",
              }}
            >
              — your grove
            </span>
          </h2>
        </div>

        {/* Add Holding */}
        <button
          onClick={() => dispatch(openAddModal())}
          className="transition-all duration-300"
          style={{
            background: "transparent",
            border: "1px solid rgba(196,136,90,0.4)",
            color: "#c4885a",
            padding: "10px 28px",
            fontSize: "0.6rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            fontFamily: "'DM Mono', monospace",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "#c4885a";
            e.currentTarget.style.color = "#1a1c1a";
            e.currentTarget.style.borderColor = "#c4885a";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#c4885a";
            e.currentTarget.style.borderColor = "rgba(196,136,90,0.4)";
          }}
        >
          <span style={{ fontSize: "0.9rem", fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}>
            +
          </span>
          Add Holding
        </button>

        {/* Stats */}
        <PortfolioStats statsData={statsData} />

        {/* Table */}
        <div className="mt-8">
          <HoldingsTable
            portfolioData={portfolioData}
            statsData={statsData}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />
        </div>

      </main>

      {isAddModalOpen && <AddHoldingModal />}
      {isEditModalOpen && <EditHoldingModal />}
      {isDeleteModalOpen && <DeleteConfirmModal />}
    </div>
  );
};

export default Dashboard;