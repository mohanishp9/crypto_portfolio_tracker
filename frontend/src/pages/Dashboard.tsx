import { useEffect, useState } from "react";
import { useGetCurrentUserQuery, useLogoutMutation } from "../services/authApi";
import { useDispatch, useSelector } from "react-redux";
import { logout as logoutAction } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import { useGetPortfolioQuery, useGetPortfolioStatsQuery } from "../services/portfolioApi";
import { openAddModal, openEditModal, setSelectedHolding, openDeleteModal } from "../features/portfolio/portfolioSlice";
import type { RootState } from "../app/store";
import type { Holding } from "../types/portfolio.types";
import AddHoldingModal from "../components/AddHoldingModal";
import EditHoldingModal from "../components/EditHoldingModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

const Dashboard = () => {
    const { data, isLoading, error } = useGetCurrentUserQuery();
    const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {
        selectedHolding,
        isAddModalOpen,
        isEditModalOpen,
        isDeleteModalOpen,
    } = useSelector((state: RootState) => state.portfolio);

    // Fetch portfolio data
    const { data: portfolioData, isLoading: portfolioLoading } = useGetPortfolioQuery(undefined, {
        pollingInterval: 30000, // Refresh every 30 seconds
    });

    const { data: statsData, isLoading: statsLoading } = useGetPortfolioStatsQuery(undefined, {
        pollingInterval: 30000, // Refresh every 30 seconds
    });

    // Redirect to login if there's an authentication error
    useEffect(() => {
        if (error) {
            if ('status' in error && error.status === 401) {
                dispatch(logoutAction());
                navigate('/login');
            }
        }
    }, [error, navigate, dispatch]);

    // Handle logout
    const handleLogout = async () => {
        try {
            await logoutMutation().unwrap();
            dispatch(logoutAction());
            navigate('/login');
        } catch (err) {
            console.error('Logout failed:', err);
            dispatch(logoutAction());
            navigate('/login');
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


    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-10 rounded-xl shadow-lg">
                    <div className="flex flex-col items-center space-y-6">
                        <svg
                            className="animate-spin h-12 w-12 text-indigo-600"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        <p className="text-gray-700 font-medium text-lg">Loading your dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state (non-401 errors)
    if (error && !('status' in error && error.status === 401)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="bg-white p-10 rounded-xl shadow-lg max-w-md w-full text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-6">
                        <svg
                            className="h-6 w-6 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        Error Loading Dashboard
                    </h3>
                    <p className="text-gray-600 mb-8">
                        We couldn't load your user data. Please try again later.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    // Success state - dashboard
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header/Navbar */}
            <nav className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-base sm:text-2xl md:text-3xl font-semibold text-gray-900">
                                Crypto Portfolio Tracker
                            </h1>
                        </div>
                        <div className="flex items-center space-x-6">
                            <span className="text-gray-600 text-sm">
                                {data?.user.email}
                            </span>
                            <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-4 py-2 transition-colors duration-200 disabled:opacity-50"
                            >
                                {isLoggingOut ? 'Logging out...' : 'Logout'}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Welcome Section */}
                <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-gray-100">
                    <h2 className="text-3xl font-semibold text-gray-900 mb-2">
                        Welcome back, {data?.user.name}!
                    </h2>
                    <p className="text-gray-500 text-lg">
                        Here's an overview of your account.
                    </p>
                </div>

                {/* Account Information Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100">
                        <h3 className="text-xl font-semibold text-gray-900">
                            Account Information
                        </h3>
                    </div>
                    <div className="px-8 py-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Full Name</span>
                            <span className="text-gray-900 font-medium">{data?.user.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Email Address</span>
                            <span className="text-gray-900 font-medium">{data?.user.email}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">User ID</span>
                            <span className="text-gray-900 font-mono text-sm bg-gray-100 px-3 py-1 rounded-md">
                                {data?.user._id}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => dispatch(openAddModal())}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg mt-4"
                >
                    +Add Holding
                </button>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">

                    {/* Total Value */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-sm text-gray-500 mb-2">Total Value</h3>
                        <p className="text-2xl font-semibold text-gray-900">
                            ${statsData?.currentValue?.toFixed(2) ?? "0.00"}
                        </p>
                    </div>

                    {/* Total Investment */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-sm text-gray-500 mb-2">Total Investment</h3>
                        <p className="text-2xl font-semibold text-gray-900">
                            ${statsData?.investment?.toFixed(2) ?? "0.00"}
                        </p>
                    </div>

                    {/* Profit / Loss */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-sm text-gray-500 mb-2">Profit / Loss</h3>
                        <p
                            className={`text-2xl font-semibold ${(statsData?.profitLoss ?? 0) < 0 ? "text-red-600" : "text-green-600"
                                }`}
                        >
                            ${statsData?.profitLoss?.toFixed(2) ?? "0.00"}
                        </p>
                    </div>

                    {/* Change % */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-sm text-gray-500 mb-2">Change %</h3>
                        <p
                            className={`text-2xl font-semibold ${(statsData?.profitPercentage ?? 0) < 0 ? "text-red-600" : "text-green-600"
                                }`}
                        >
                            {statsData?.profitPercentage?.toFixed(2) ?? "0.00"}%
                        </p>
                    </div>

                </div>

                {/* Holdings Table */}
                <table className="min-w-full mt-8">
                    <thead>
                        <tr>
                            <th>Coin</th>
                            <th>Quantity</th>
                            <th>Buy Price</th>
                            <th>Current Price</th>
                            <th>Value</th>
                            <th>Profit/Loss</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {portfolioData?.portfolio.holdings.map((holding) => {
                            const currentPrice = statsData?.prices?.[holding.coinId]?.usd ?? 0;

                            const value = holding.quantity * currentPrice;
                            const profitLoss = value - holding.quantity * holding.buyPrice;
                            return (
                                <tr key={holding._id}>
                                    <td>{holding.coinName} ({holding.coinSymbol})</td>
                                    <td>{holding.quantity}</td>
                                    <td>${holding.buyPrice.toFixed(2)}</td>
                                    <td>${currentPrice.toFixed(2)}</td> {/* Fetch from CoinGecko */}
                                    <td>${value.toFixed(2)}</td> {/* quantity * current price */}
                                    <td className={profitLoss > 0 ? 'text-green-600' : 'text-red-600'}>
                                        ${profitLoss.toFixed(2)}
                                    </td>
                                    <td>
                                        <button onClick={() => handleEdit(holding)}>Edit</button>
                                        <button onClick={() => handleDelete(holding)}>Delete</button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {portfolioData?.portfolio.holdings.length === 0 && (
                    <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">No Holdings</h3>
                        <p className="text-gray-600 mb-8">
                            No holdings yet. Add your first crypto!
                        </p>
                        <button
                            onClick={() => dispatch(openAddModal())}
                            className="w-50 bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
                        >
                            Add Holding
                        </button>
                    </div>
                )}

                {isAddModalOpen && <AddHoldingModal />}
                {isEditModalOpen && <EditHoldingModal />}
                {isDeleteModalOpen && <DeleteConfirmModal />}
            </main>
        </div>
    );
};

export default Dashboard;