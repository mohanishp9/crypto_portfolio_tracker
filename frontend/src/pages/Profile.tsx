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
import { User, Wallet, Hash, ActivitySquare, Shield, Key, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff, Activity } from "lucide-react";
import toast from "react-hot-toast";
import useDebounce from "../hooks/useDebounce";
import { usePostHog } from 'posthog-js/react';

const Profile = () => {
    const { data: userData, isLoading: userLoading, error: userError } = useGetCurrentUserQuery();
    const { statsData, transactionsData, statsLoading, transactionsLoading } = usePortfolioData();
    const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();
    const posthog = usePostHog();
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
            posthog?.reset();
            navigate("/");
        } catch {
            dispatch(logoutAction());
            posthog?.reset();
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
            <div className="min-h-screen flex items-center justify-center bg-surface-primary">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-14 h-14 rounded-md bg-surface-secondary border border-border-primary flex items-center justify-center mb-4 animate-pulse">
                        <Activity className="text-accent" size={28} />
                    </div>
                    <p className="text-text-tertiary text-sm">
                        Gathering identity...
                    </p>
                </div>
            </div>
        );
    }

    if (userError) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 bg-surface-primary">
                <div className="text-center p-10 bg-surface-secondary border border-border-primary rounded-sm">
                    <p className="text-negative text-xs font-medium">Error loading profile</p>
                </div>
            </div>
        );
    }

    const uniqueAssets = statsData?.portfolio?.length || 0;
    const totalTransactions = transactionsData?.transactions?.length || 0;
    const totalValue = statsData?.currentValue || 0;
    const isProfit = (statsData?.profitLoss || 0) >= 0;

    return (
        <div className="min-h-screen bg-surface-primary">
            <Navbar
                email={userData?.user.email}
                handleLogout={handleLogout}
                isLoggingOut={isLoggingOut}
            />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                
                {/* Profile Header */}
                <div className="mb-8 p-8 bg-surface-secondary/50 border border-border-primary rounded-sm flex flex-col md:flex-row items-center md:items-start gap-6">
                                        
                    <div className="w-24 h-24 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                        <User size={40} className="text-accent" />
                    </div>
                    
                    <div className="text-center md:text-left flex-1 relative z-10">
                        <p className="text-xs font-medium text-accent mb-2 font-semibold">
                            Investor Profile
                        </p>
                        <h2 className="text-4xl font-semibold text-text-primary tracking-tight flex items-center gap-3 justify-center md:justify-start">
                            {userData?.user.name} 
                        </h2>
                        <p className="text-sm text-text-tertiary mt-2">
                            {userData?.user.email}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-4 mb-6 border-b border-border-primary">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`pb-3 px-4 text-sm font-semibold  transition-colors ${activeTab === 'profile' ? 'text-accent border-b-2 border-accent' : 'text-text-tertiary hover:text-text-secondary'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`pb-3 px-4 text-sm font-semibold  transition-colors ${activeTab === 'settings' ? 'text-accent border-b-2 border-accent' : 'text-text-tertiary hover:text-text-secondary'}`}
                    >
                        Settings
                    </button>
                </div>

                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                        {/* User Details */}
                        <div className="p-8 bg-surface-secondary border border-border-primary rounded-sm ">
                            <h3 className="mb-6 font-semibold text-xl text-text-primary tracking-tight flex items-center gap-2">
                                <ActivitySquare className="text-text-tertiary" size={20} /> Account Details
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs font-medium text-text-tertiary mb-2">System ID</p>
                                    <p className="text-sm text-text-secondary bg-surface-primary px-3 py-2 rounded-sm border border-border-primary break-all">
                                        {userData?.user._id}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-text-tertiary mb-2">Full Name</p>
                                    <p className="text-sm text-text-secondary font-medium px-1">
                                        {userData?.user.name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-text-tertiary mb-2">Email Address</p>
                                    <p className="text-sm text-text-secondary font-medium px-1">
                                        {userData?.user.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Portfolio Stats */}
                        <div className="p-8 bg-surface-secondary border border-border-primary rounded-sm ">
                            <h3 className="mb-6 font-semibold text-xl text-text-primary tracking-tight flex items-center gap-2">
                                <Wallet className="text-text-tertiary" size={20} /> Portfolio Summary
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-surface-primary rounded-sm border border-border-primary/50">
                                    <p className="text-xs font-medium text-text-tertiary mb-2">Total Value</p>
                                    <p className="text-lg font-semibold text-text-primary">
                                        ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="p-4 bg-surface-primary rounded-sm border border-border-primary/50">
                                    <p className="text-xs font-medium text-text-tertiary mb-2">P/L</p>
                                    <p className={`text-lg font-semibold ${isProfit ? 'text-positive' : 'text-negative'}`}>
                                        {isProfit ? '+' : ''}{(statsData?.profitLoss || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="p-4 bg-surface-primary rounded-sm border border-border-primary/50">
                                    <p className="text-xs font-medium text-text-tertiary mb-2">Unique Assets</p>
                                    <p className="text-lg font-semibold text-text-primary">
                                        {uniqueAssets}
                                    </p>
                                </div>
                                <div className="p-4 bg-surface-primary rounded-sm border border-border-primary/50">
                                    <p className="text-xs font-medium text-text-tertiary mb-2">Transactions</p>
                                    <p className="text-lg font-semibold text-text-primary">
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
                        <div className="p-8 bg-surface-secondary border border-border-primary rounded-sm ">
                            <h3 className="mb-2 font-semibold text-xl text-text-primary tracking-tight flex items-center gap-2">
                                <Hash className="text-text-tertiary" size={20} /> Update Display Name
                            </h3>
                            <p className="text-xs text-text-tertiary mb-6">Choose a unique name to identify yourself on the platform.</p>
                            
                            <form onSubmit={handleUpdateName} className="flex gap-4 items-start">
                                <div className="flex-1">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={nameInput}
                                            onChange={(e) => setNameInput(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full bg-surface-primary/50 border border-border-primary text-text-primary text-sm py-2.5 px-4 pr-10 rounded-sm focus:outline-none focus:border-accent transition-colors placeholder-text-tertiary"
                                        />
                                        {nameInput.trim().length >= 2 && nameInput.trim() !== userData?.user.name && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                                                {isCheckingName ? (
                                                    <svg className="w-4 h-4 animate-spin text-text-tertiary" viewBox="0 0 24 24" fill="none">
                                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40" strokeDashoffset="10" />
                                                    </svg>
                                                ) : nameData?.available ? (
                                                    <CheckCircle className="w-4 h-4 text-positive" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-negative" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isUpdatingName || nameInput.trim() === userData?.user.name || (nameInput.trim().length >= 2 && nameData && !nameData.available)}
                                    className="px-6 py-2.5 bg-accent border border-accent text-white rounded-sm text-xs font-semibold  transition-all disabled:opacity-50 hover:bg-accent-hover  shadow-accent/20"
                                >
                                    {isUpdatingName ? "Saving..." : "Save"}
                                </button>
                            </form>
                        </div>

                        {/* Change Password */}
                        <div className="p-8 bg-surface-secondary border border-border-primary rounded-sm ">
                            <h3 className="mb-2 font-semibold text-xl text-text-primary tracking-tight flex items-center gap-2">
                                <Key className="text-text-tertiary" size={20} /> Change Password
                            </h3>
                            <p className="text-xs text-text-tertiary mb-6">Ensure your account is using a long, random password to stay secure.</p>
                            
                            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-medium text-text-tertiary font-semibold">Current Password</label>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.changeCurrent ? "text" : "password"}
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                                            className="w-full bg-surface-primary/50 border border-border-primary text-text-primary text-sm py-2.5 px-4 pr-10 rounded-sm focus:outline-none focus:border-accent"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(p => ({ ...p, changeCurrent: !p.changeCurrent }))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary focus:outline-none"
                                        >
                                            {showPasswords.changeCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-medium text-text-tertiary font-semibold">New Password</label>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.changeNew ? "text" : "password"}
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                                            className="w-full bg-surface-primary/50 border border-border-primary text-text-primary text-sm py-2.5 px-4 pr-10 rounded-sm focus:outline-none focus:border-accent"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(p => ({ ...p, changeNew: !p.changeNew }))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary focus:outline-none"
                                        >
                                            {showPasswords.changeNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isChangingPassword}
                                    className="w-full py-3 bg-accent border border-accent text-white rounded-sm text-xs font-semibold  transition-all disabled:opacity-50 hover:bg-accent-hover  shadow-accent/20"
                                >
                                    {isChangingPassword ? "Updating..." : "Update Password"}
                                </button>
                            </form>
                        </div>

                        {/* Change Email */}
                        <div className="p-8 bg-surface-secondary border border-border-primary rounded-sm ">
                            <h3 className="mb-2 font-semibold text-xl text-text-primary tracking-tight flex items-center gap-2">
                                <Shield className="text-text-tertiary" size={20} /> Change Email
                            </h3>
                            <p className="text-xs text-text-tertiary mb-6">Update the email address associated with your account.</p>
                            
                            {emailForm.step === 1 ? (
                                <form onSubmit={handleInitiateEmailChange} className="space-y-4 max-w-md">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-xs font-medium text-text-tertiary font-semibold">Current Password</label>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.emailCurrent ? "text" : "password"}
                                                value={emailForm.currentPassword}
                                                onChange={(e) => setEmailForm(p => ({ ...p, currentPassword: e.target.value }))}
                                                className="w-full bg-surface-primary/50 border border-border-primary text-text-primary text-sm py-2.5 px-4 pr-10 rounded-sm focus:outline-none focus:border-accent"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords(p => ({ ...p, emailCurrent: !p.emailCurrent }))}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary focus:outline-none"
                                            >
                                                {showPasswords.emailCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-text-tertiary mb-2 font-semibold">New Email Address</label>
                                        <input
                                            type="email"
                                            value={emailForm.newEmail}
                                            onChange={(e) => setEmailForm(p => ({ ...p, newEmail: e.target.value }))}
                                            className="w-full bg-surface-primary/50 border border-border-primary text-text-primary text-sm py-2.5 px-4 rounded-sm focus:outline-none focus:border-accent"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isInitiatingEmail}
                                        className="w-full py-3 bg-accent border border-accent text-white rounded-sm text-xs font-semibold  transition-all disabled:opacity-50 hover:bg-accent-hover  shadow-accent/20"
                                    >
                                        {isInitiatingEmail ? "Sending OTP..." : "Continue"}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyEmailChange} className="space-y-4 max-w-md animate-fade-in">
                                    <p className="text-sm text-positive font-medium mb-4">OTP sent to {emailForm.newEmail}</p>
                                    <div>
                                        <label className="block text-xs font-medium text-text-tertiary mb-2 font-semibold">Verification Code</label>
                                        <input
                                            type="text"
                                            value={emailForm.otp}
                                            onChange={(e) => setEmailForm(p => ({ ...p, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                            placeholder="123456"
                                            className="w-full bg-surface-primary/50 border border-border-primary text-text-primary text-2xl tracking-[0.5em] text-center py-4 rounded-sm focus:outline-none focus:border-accent"
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setEmailForm(p => ({ ...p, step: 1, otp: '' }))}
                                            className="flex-1 py-3 bg-surface-tertiary text-text-secondary rounded-sm text-xs font-semibold  transition-all hover:bg-surface-tertiary"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isVerifyingEmail || emailForm.otp.length !== 6}
                                            className="flex-1 py-3 bg-positive text-surface-primary rounded-sm text-xs font-semibold  transition-all disabled:opacity-50 hover:bg-positive  shadow-positive/20"
                                        >
                                            {isVerifyingEmail ? "Verifying..." : "Verify & Update"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Delete Account */}
                        <div className="p-8 bg-negative-subtle border border-negative/30 rounded-sm ">
                            <h3 className="mb-2 font-semibold text-xl text-negative tracking-tight flex items-center gap-2">
                                <AlertTriangle className="text-negative" size={20} /> Danger Zone
                            </h3>
                            <p className="text-xs text-negative/70 mb-6">Once you delete your account, there is no going back. Please be certain.</p>
                            
                            {deleteForm.step === 1 ? (
                                <form onSubmit={handleInitiateDelete} className="space-y-4 max-w-md">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-xs font-medium text-negative/70 font-semibold">Current Password</label>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.deleteCurrent ? "text" : "password"}
                                                value={deleteForm.currentPassword}
                                                onChange={(e) => setDeleteForm(p => ({ ...p, currentPassword: e.target.value }))}
                                                className="w-full bg-surface-primary/50 border border-negative/30 text-text-primary text-sm py-2.5 px-4 pr-10 rounded-sm focus:outline-none focus:border-negative"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords(p => ({ ...p, deleteCurrent: !p.deleteCurrent }))}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary focus:outline-none"
                                            >
                                                {showPasswords.deleteCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isInitiatingDeletion}
                                        className="w-full py-3 bg-negative-subtle border border-negative/30 text-negative hover:bg-negative hover:text-white rounded-sm text-xs font-semibold transition-all disabled:opacity-50"
                                    >
                                        {isInitiatingDeletion ? "Preparing..." : "Delete Account"}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyDelete} className="space-y-4 max-w-md animate-fade-in">
                                    <p className="text-sm text-negative font-medium mb-4">OTP sent to {userData?.user.email}</p>
                                    <div>
                                        <label className="block text-xs font-medium text-negative/70 mb-2 font-semibold">Verification Code</label>
                                        <input
                                            type="text"
                                            value={deleteForm.otp}
                                            onChange={(e) => setDeleteForm(p => ({ ...p, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                            placeholder="123456"
                                            className="w-full bg-surface-primary/50 border border-negative/30 text-text-primary text-2xl tracking-[0.5em] text-center py-4 rounded-sm focus:outline-none focus:border-negative"
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setDeleteForm(p => ({ ...p, step: 1, otp: '' }))}
                                            className="flex-1 py-3 bg-surface-tertiary text-text-secondary rounded-sm text-xs font-semibold  transition-all hover:bg-surface-tertiary"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isDeletingAccount || deleteForm.otp.length !== 6}
                                            className="flex-1 py-3 bg-negative text-white rounded-sm text-xs font-semibold  transition-all disabled:opacity-50 hover:bg-negative  shadow-negative/20"
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