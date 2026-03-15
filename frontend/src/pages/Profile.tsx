import { useGetCurrentUserQuery, useLogoutMutation } from "../services/authApi";
import { usePortfolioData } from "../hooks/usePortfolioData";
import { useDispatch } from "react-redux";
import { logout as logoutAction } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const Profile = () => {
    const { data: userData, isLoading: userLoading, error: userError } = useGetCurrentUserQuery();
    const { statsData, transactionsData, statsLoading, transactionsLoading } = usePortfolioData();
    const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

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

    if (userLoading || statsLoading || transactionsLoading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: "#1a1c1a" }}
            >
                <div className="flex flex-col items-center gap-6">
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
                        gathering your profile...
                    </p>
                </div>
            </div>
        );
    }

    if (userError) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#1a1c1a" }}>
                <div className="text-center p-10" style={{ background: "#2e3330", border: "1px solid rgba(139,94,60,0.25)" }}>
                    <p style={{ color: "#c4885a", fontSize: "0.8rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>Error loading profile</p>
                </div>
            </div>
        );
    }

    const uniqueAssets = statsData?.portfolio?.length || 0;
    const totalTransactions = transactionsData?.transactions?.length || 0;
    const totalValue = statsData?.currentValue || 0;
    const isProfit = (statsData?.profitLoss || 0) >= 0;

    return (
        <div className="min-h-screen" style={{ background: "#1a1c1a" }}>
            <Navbar
                email={userData?.user.email}
                handleLogout={handleLogout}
                isLoggingOut={isLoggingOut}
            />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                        Investor Profile
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
                        {userData?.user.name}
                    </h2>
                    <p
                        style={{
                            fontSize: "0.75rem",
                            letterSpacing: "0.15em",
                            color: "#9aab97",
                            fontFamily: "'DM Mono', monospace",
                            marginTop: "12px",
                        }}
                    >
                        {userData?.user.email}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User Details */}
                    <div className="p-8" style={{ background: "#2e3330", border: "1px solid rgba(61,74,62,0.3)" }}>
                        <h3 className="mb-6 font-light tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "#ede8dd" }}>
                            Account Details
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b7c6a", marginBottom: "4px" }}>User ID</p>
                                <p style={{ fontSize: "0.8rem", color: "#d4cfc4", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>{userData?.user._id}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b7c6a", marginBottom: "4px" }}>Status</p>
                                <p style={{ fontSize: "0.75rem", color: "#587560", textTransform: "uppercase", letterSpacing: "0.2em", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#587560" }}></span> Active
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Profile Stats */}
                    <div className="p-8" style={{ background: "#2e3330", border: "1px solid rgba(61,74,62,0.3)" }}>
                        <h3 className="mb-6 font-light tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "#ede8dd" }}>
                            Your Grove Statistics
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b7c6a", marginBottom: "4px" }}>Current Balance</p>
                                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.6rem", color: "#ede8dd", letterSpacing: "0.04em" }}>
                                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b7c6a", marginBottom: "4px" }}>Total PnL</p>
                                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "1rem", color: isProfit ? "#587560" : "#8b5e3c", letterSpacing: "0.05em" }}>
                                    {isProfit ? "+" : "-"}${Math.abs(statsData?.profitLoss || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b7c6a", marginBottom: "4px" }}>Active Assets</p>
                                <p style={{ fontSize: "1.1rem", color: "#d4cfc4", fontFamily: "'DM Mono', monospace" }}>{uniqueAssets}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b7c6a", marginBottom: "4px" }}>Transactions</p>
                                <p style={{ fontSize: "1.1rem", color: "#d4cfc4", fontFamily: "'DM Mono', monospace" }}>{totalTransactions}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;