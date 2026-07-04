import { useState, useEffect } from "react";
import { useGetCurrentUserQuery, useLogoutMutation } from "../services/authApi";
import { 
    useUpdateNameMutation, 
    useChangePasswordMutation, 
    useInitiateEmailChangeMutation, 
    useVerifyEmailChangeMutation, 
    useInitiateAccountDeletionMutation, 
    useDeleteAccountMutation,
    useLazyCheckNameQuery
} from "../services/userApi";
import { usePortfolioData } from "../hooks/usePortfolioData";
import { useDispatch } from "react-redux";
import { logout as logoutAction } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { User, Wallet, Hash, ActivitySquare, Shield, Key, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import useDebounce from "../hooks/useDebounce";

const Profile = () => {
    const { data: userData, isLoading: userLoading, error: userError } = useGetCurrentUserQuery();
    const { statsData, transactionsData, statsLoading, transactionsLoading } = usePortfolioData();
    const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');

    // Forms state
    const [nameInput, setNameInput] = useState('');
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
    const [emailForm, setEmailForm] = useState({ currentPassword: '', newEmail: '', otp: '', step: 1 });
    const [deleteForm, setDeleteForm] = useState({ currentPassword: '', otp: '', step: 1 });
    const [showPasswords, setShowPasswords] = useState({
        changeCurrent: false,
        changeNew: false,
        emailCurrent: false,
        deleteCurrent: false,
    });

    const debouncedName = useDebounce(nameInput, 500);
    const [checkName, { isFetching: isCheckingName, data: nameData }] = useLazyCheckNameQuery();

    const [updateName, { isLoading: isUpdatingName }] = useUpdateNameMutation();
    const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
    const [initiateEmailChange, { isLoading: isInitiatingEmail }] = useInitiateEmailChangeMutation();
    const [verifyEmailChange, { isLoading: isVerifyingEmail }] = useVerifyEmailChangeMutation();
    const [initiateAccountDeletion, { isLoading: isInitiatingDeletion }] = useInitiateAccountDeletionMutation();
    const [deleteAccount, { isLoading: isDeletingAccount }] = useDeleteAccountMutation();

    useEffect(() => {
        if (userData?.user.name) {
            setNameInput(userData.user.name);
        }
    }, [userData]);

    useEffect(() => {
        if (debouncedName && debouncedName.trim().length >= 2 && debouncedName.trim() !== userData?.user.name) {
            checkName(debouncedName.trim());
        }
    }, [debouncedName, checkName, userData]);

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

    const getErrorMessage = (error: any) => {
        if (!error) return null;
        if (typeof error.data?.message === 'string') return error.data.message;
        if ('data' in error) return 'An error occurred. Please try again.';
        return 'Network error.';
    };

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (nameInput.trim() === userData?.user.name) return;
        if (nameInput.trim().length < 2) return toast.error("Name must be at least 2 characters");
        if (nameData && !nameData.available) return toast.error("Name is already taken");
        
        try {
            await updateName({ name: nameInput.trim() }).unwrap();
            toast.success("Name updated successfully");
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword.length < 6) return toast.error("New password must be at least 6 characters");
        
        try {
            await changePassword(passwordForm).unwrap();
            toast.success("Password updated successfully. Please log in again.");
            dispatch(logoutAction());
            navigate("/login");
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const handleInitiateEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailForm.newEmail || !emailForm.currentPassword) return toast.error("Please fill all fields");
        try {
            await initiateEmailChange({ currentPassword: emailForm.currentPassword, newEmail: emailForm.newEmail }).unwrap();
            toast.success("OTP sent to new email");
            setEmailForm(prev => ({ ...prev, step: 2 }));
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const handleVerifyEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (emailForm.otp.length !== 6) return toast.error("OTP must be 6 digits");
        try {
            await verifyEmailChange({ otp: emailForm.otp }).unwrap();
            toast.success("Email updated successfully");
            setEmailForm({ currentPassword: '', newEmail: '', otp: '', step: 1 });
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const handleInitiateDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deleteForm.currentPassword) return toast.error("Please enter your password");
        try {
            await initiateAccountDeletion({ currentPassword: deleteForm.currentPassword }).unwrap();
            toast.success("OTP sent to your email");
            setDeleteForm(prev => ({ ...prev, step: 2 }));
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const handleVerifyDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (deleteForm.otp.length !== 6) return toast.error("OTP must be 6 digits");
        try {
            await deleteAccount({ otp: deleteForm.otp }).unwrap();
            toast.success("Account deleted successfully");
            dispatch(logoutAction());
            navigate("/");
        } catch (err) {
            toast.error(getErrorMessage(err));
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
                    
                    <div className="text-center md:text-left flex-1 relative z-10">
                        <p className="text-[10px] tracking-widest uppercase text-indigo-400 mb-2 font-semibold">
                            Investor Profile
                        </p>
                        <h2 className="text-4xl font-semibold text-zinc-50 tracking-tight flex items-center gap-3 justify-center md:justify-start">
                            {userData?.user.name} 
                        </h2>
                        <p className="text-sm text-zinc-400 font-mono mt-2">
                            {userData?.user.email}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-4 mb-6 border-b border-zinc-800">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`pb-3 px-4 text-sm font-semibold uppercase tracking-wider transition-colors ${activeTab === 'profile' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`pb-3 px-4 text-sm font-semibold uppercase tracking-wider transition-colors ${activeTab === 'settings' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Settings
                    </button>
                </div>

                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
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
                                    <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-2">Full Name</p>
                                    <p className="text-sm text-zinc-300 font-medium px-1">
                                        {userData?.user.name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-2">Email Address</p>
                                    <p className="text-sm text-zinc-300 font-medium px-1">
                                        {userData?.user.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Portfolio Stats */}
                        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-sm">
                            <h3 className="mb-6 font-semibold text-xl text-zinc-50 tracking-tight flex items-center gap-2">
                                <Wallet className="text-zinc-500" size={20} /> Portfolio Summary
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
                                    <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-2">Total Value</p>
                                    <p className="text-lg font-semibold text-zinc-100">
                                        ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
                                    <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-2">P/L</p>
                                    <p className={`text-lg font-semibold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {isProfit ? '+' : ''}{(statsData?.profitLoss || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
                                    <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-2">Unique Assets</p>
                                    <p className="text-lg font-semibold text-zinc-100">
                                        {uniqueAssets}
                                    </p>
                                </div>
                                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
                                    <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-2">Transactions</p>
                                    <p className="text-lg font-semibold text-zinc-100">
                                        {totalTransactions}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Change Name */}
                        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-sm">
                            <h3 className="mb-2 font-semibold text-xl text-zinc-50 tracking-tight flex items-center gap-2">
                                <Hash className="text-zinc-500" size={20} /> Update Display Name
                            </h3>
                            <p className="text-xs text-zinc-500 mb-6">Choose a unique name to identify yourself on the platform.</p>
                            
                            <form onSubmit={handleUpdateName} className="flex gap-4 items-start">
                                <div className="flex-1">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={nameInput}
                                            onChange={(e) => setNameInput(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full bg-zinc-950/50 border border-zinc-800 text-zinc-50 font-mono text-sm py-2.5 px-4 pr-10 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors placeholder-zinc-700"
                                        />
                                        {nameInput.trim().length >= 2 && nameInput.trim() !== userData?.user.name && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                                                {isCheckingName ? (
                                                    <svg className="w-4 h-4 animate-spin text-zinc-500" viewBox="0 0 24 24" fill="none">
                                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40" strokeDashoffset="10" />
                                                    </svg>
                                                ) : nameData?.available ? (
                                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-rose-500" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isUpdatingName || nameInput.trim() === userData?.user.name || (nameInput.trim().length >= 2 && nameData && !nameData.available)}
                                    className="px-6 py-2.5 bg-indigo-500 border border-indigo-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20"
                                >
                                    {isUpdatingName ? "Saving..." : "Save"}
                                </button>
                            </form>
                        </div>

                        {/* Change Password */}
                        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-sm">
                            <h3 className="mb-2 font-semibold text-xl text-zinc-50 tracking-tight flex items-center gap-2">
                                <Key className="text-zinc-500" size={20} /> Change Password
                            </h3>
                            <p className="text-xs text-zinc-500 mb-6">Ensure your account is using a long, random password to stay secure.</p>
                            
                            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-[10px] tracking-widest uppercase text-zinc-500 font-semibold">Current Password</label>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.changeCurrent ? "text" : "password"}
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                                            className="w-full bg-zinc-950/50 border border-zinc-800 text-zinc-50 font-mono text-sm py-2.5 px-4 pr-10 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(p => ({ ...p, changeCurrent: !p.changeCurrent }))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                                        >
                                            {showPasswords.changeCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-[10px] tracking-widest uppercase text-zinc-500 font-semibold">New Password</label>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.changeNew ? "text" : "password"}
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                                            className="w-full bg-zinc-950/50 border border-zinc-800 text-zinc-50 font-mono text-sm py-2.5 px-4 pr-10 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(p => ({ ...p, changeNew: !p.changeNew }))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                                        >
                                            {showPasswords.changeNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isChangingPassword}
                                    className="w-full py-3 bg-indigo-500 border border-indigo-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20"
                                >
                                    {isChangingPassword ? "Updating..." : "Update Password"}
                                </button>
                            </form>
                        </div>

                        {/* Change Email */}
                        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-sm">
                            <h3 className="mb-2 font-semibold text-xl text-zinc-50 tracking-tight flex items-center gap-2">
                                <Shield className="text-zinc-500" size={20} /> Change Email
                            </h3>
                            <p className="text-xs text-zinc-500 mb-6">Update the email address associated with your account.</p>
                            
                            {emailForm.step === 1 ? (
                                <form onSubmit={handleInitiateEmailChange} className="space-y-4 max-w-md">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-[10px] tracking-widest uppercase text-zinc-500 font-semibold">Current Password</label>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.emailCurrent ? "text" : "password"}
                                                value={emailForm.currentPassword}
                                                onChange={(e) => setEmailForm(p => ({ ...p, currentPassword: e.target.value }))}
                                                className="w-full bg-zinc-950/50 border border-zinc-800 text-zinc-50 font-mono text-sm py-2.5 px-4 pr-10 rounded-lg focus:outline-none focus:border-indigo-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords(p => ({ ...p, emailCurrent: !p.emailCurrent }))}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                                            >
                                                {showPasswords.emailCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] tracking-widest uppercase text-zinc-500 mb-2 font-semibold">New Email Address</label>
                                        <input
                                            type="email"
                                            value={emailForm.newEmail}
                                            onChange={(e) => setEmailForm(p => ({ ...p, newEmail: e.target.value }))}
                                            className="w-full bg-zinc-950/50 border border-zinc-800 text-zinc-50 font-mono text-sm py-2.5 px-4 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isInitiatingEmail}
                                        className="w-full py-3 bg-indigo-500 border border-indigo-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20"
                                    >
                                        {isInitiatingEmail ? "Sending OTP..." : "Continue"}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyEmailChange} className="space-y-4 max-w-md animate-fade-in">
                                    <p className="text-sm text-emerald-400 font-medium mb-4">OTP sent to {emailForm.newEmail}</p>
                                    <div>
                                        <label className="block text-[10px] tracking-widest uppercase text-zinc-500 mb-2 font-semibold">Verification Code</label>
                                        <input
                                            type="text"
                                            value={emailForm.otp}
                                            onChange={(e) => setEmailForm(p => ({ ...p, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                            placeholder="123456"
                                            className="w-full bg-zinc-950/50 border border-zinc-800 text-zinc-50 font-mono text-2xl tracking-[0.5em] text-center py-4 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setEmailForm(p => ({ ...p, step: 1, otp: '' }))}
                                            className="flex-1 py-3 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all hover:bg-zinc-700"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isVerifyingEmail || emailForm.otp.length !== 6}
                                            className="flex-1 py-3 bg-emerald-500 text-zinc-950 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
                                        >
                                            {isVerifyingEmail ? "Verifying..." : "Verify & Update"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Delete Account */}
                        <div className="p-8 bg-rose-950/10 border border-rose-900/30 rounded-2xl shadow-sm">
                            <h3 className="mb-2 font-semibold text-xl text-rose-500 tracking-tight flex items-center gap-2">
                                <AlertTriangle className="text-rose-500" size={20} /> Danger Zone
                            </h3>
                            <p className="text-xs text-rose-400/70 mb-6">Once you delete your account, there is no going back. Please be certain.</p>
                            
                            {deleteForm.step === 1 ? (
                                <form onSubmit={handleInitiateDelete} className="space-y-4 max-w-md">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-[10px] tracking-widest uppercase text-rose-500/70 font-semibold">Current Password</label>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.deleteCurrent ? "text" : "password"}
                                                value={deleteForm.currentPassword}
                                                onChange={(e) => setDeleteForm(p => ({ ...p, currentPassword: e.target.value }))}
                                                className="w-full bg-zinc-950/50 border border-rose-900/30 text-zinc-50 font-mono text-sm py-2.5 px-4 pr-10 rounded-lg focus:outline-none focus:border-rose-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords(p => ({ ...p, deleteCurrent: !p.deleteCurrent }))}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                                            >
                                                {showPasswords.deleteCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isInitiatingDeletion}
                                        className="w-full py-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
                                    >
                                        {isInitiatingDeletion ? "Preparing..." : "Delete Account"}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyDelete} className="space-y-4 max-w-md animate-fade-in">
                                    <p className="text-sm text-rose-400 font-medium mb-4">OTP sent to {userData?.user.email}</p>
                                    <div>
                                        <label className="block text-[10px] tracking-widest uppercase text-rose-500/70 mb-2 font-semibold">Verification Code</label>
                                        <input
                                            type="text"
                                            value={deleteForm.otp}
                                            onChange={(e) => setDeleteForm(p => ({ ...p, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                            placeholder="123456"
                                            className="w-full bg-zinc-950/50 border border-rose-900/30 text-zinc-50 font-mono text-2xl tracking-[0.5em] text-center py-4 rounded-lg focus:outline-none focus:border-rose-500"
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setDeleteForm(p => ({ ...p, step: 1, otp: '' }))}
                                            className="flex-1 py-3 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all hover:bg-zinc-700"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isDeletingAccount || deleteForm.otp.length !== 6}
                                            className="flex-1 py-3 bg-rose-600 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 hover:bg-rose-500 shadow-lg shadow-rose-500/20"
                                        >
                                            {isDeletingAccount ? "Deleting..." : "Confirm Deletion"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Profile;