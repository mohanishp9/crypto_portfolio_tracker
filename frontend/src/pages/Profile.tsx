import { useGetCurrentUserQuery, useLogoutMutation } from "../services/authApi";
import { usePortfolioData } from "../hooks/usePortfolioData";
import { useDispatch } from "react-redux";
import { logout as logoutAction } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { User, Activity, Wallet, Hash, ActivitySquare } from "lucide-react";

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
            navigate("/");
        } catch {
            dispatch(logoutAction());
            navigate("/");
        }
    };

    if (userLoading || statsLoading || transactionsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-14 h-14 rounded-full border border-indigo-500/30 flex items-center justify-center animate-pulse shadow-xl shadow-indigo-500/10">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/50 animate-pulse" />
                    </div>
                    <p className="text-zinc-500 text-sm tracking-widest font-mono uppercase">
                        Gathering identity...
                    </p>
                </div>
            </div>
        );
    }

    if (userError) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-950">
                <div className="text-center p-10 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <p className="text-rose-500 text-xs font-mono tracking-widest uppercase">Error loading profile</p>
                </div>
            </div>
        );
    }

    const uniqueAssets = statsData?.portfolio?.length || 0;
    const totalTransactions = transactionsData?.transactions?.length || 0;
    const totalValue = statsData?.currentValue || 0;
    const isProfit = (statsData?.profitLoss || 0) >= 0;

    return (
        <div className="min-h-screen bg-zinc-950">
            <Navbar
                email={userData?.user.email}
                handleLogout={handleLogout}
                isLoggingOut={isLoggingOut}
            />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                
                {/* Profile Header */}
                <div className="mb-8 p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-6 backdrop-blur-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
                    
                    <div className="w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                        <User size={40} className="text-indigo-400" />
                    </div>
                    
                    <div className="text-center md:text-left flex-1">
                        <p className="text-[10px] tracking-widest uppercase text-indigo-400 mb-2 font-semibold">
                            Investor Profile
                        </p>
                        <h2 className="text-4xl font-semibold text-zinc-50 tracking-tight">
                            {userData?.user.name}
                        </h2>
                        <p className="text-sm text-zinc-400 font-mono mt-2">
                            {userData?.user.email}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User Details */}
                    <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-sm">
                        <h3 className="mb-6 font-semibold text-xl text-zinc-50 tracking-tight flex items-center gap-2">
                            <ActivitySquare className="text-zinc-500" size={20} /> Account Details
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-2">System ID</p>
                                <p className="text-sm text-zinc-300 font-mono bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800 break-all">
                                    {userData?.user._id}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-2">Status</p>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-semibold">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Stats */}
                    <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-sm">
                        <h3 className="mb-6 font-semibold text-xl text-zinc-50 tracking-tight flex items-center gap-2">
                            <Activity className="text-indigo-400" size={20} /> CypherSight Statistics
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 bg-zinc-950 p-6 rounded-xl border border-zinc-800">
                                <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-2 flex items-center gap-1.5"><Wallet size={14}/> Current Balance</p>
                                <p className="text-4xl font-semibold text-zinc-50 font-mono tracking-tight">
                                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="col-span-2 bg-zinc-950 p-6 rounded-xl border border-zinc-800">
                                <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-2">Total PnL</p>
                                <p className={`text-3xl font-mono tracking-tight font-medium ${isProfit ? "text-emerald-500" : "text-rose-500"}`}>
                                    {isProfit ? "+" : "-"}${Math.abs(statsData?.profitLoss || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                                <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-2 flex items-center gap-1.5"><Hash size={12}/> Active Assets</p>
                                <p className="text-lg text-zinc-300 font-mono">{uniqueAssets}</p>
                            </div>
                            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                                <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-2">Transactions</p>
                                <p className="text-lg text-zinc-300 font-mono">{totalTransactions}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;