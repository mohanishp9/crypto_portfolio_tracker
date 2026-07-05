import { useState } from 'react';
import type { FormEvent } from 'react';
import { useInitiatePasswordResetMutation, useVerifyPasswordResetMutation } from '../services/authApi';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Eye, EyeOff } from 'lucide-react';

const ForgotPassword = () => {
    const [initiateReset, { isLoading: isInitiating, error: initiateError }] = useInitiatePasswordResetMutation();
    const [verifyReset, { isLoading: isVerifying, error: verifyError }] = useVerifyPasswordResetMutation();
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2>(1);
    
    // Step 1 data
    const [email, setEmail] = useState('');
    
    // Step 2 data
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [validationErrors, setValidationErrors] = useState({ email: '', otp: '', newPassword: '' });

    const handleInitiate = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setValidationErrors({ email: '', otp: '', newPassword: '' });

        if (!email.trim()) {
            setValidationErrors((prev) => ({ ...prev, email: 'Email is required' }));
            return;
        }

        try {
            await initiateReset({ email }).unwrap();
            setStep(2);
        } catch (err) {
            console.error('Failed to initiate password reset:', err);
        }
    };

    const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setValidationErrors({ email: '', otp: '', newPassword: '' });

        const errors = { email: '', otp: '', newPassword: '' };
        let isValid = true;
        if (!otp.trim() || otp.length !== 6) { errors.otp = 'A valid 6-digit OTP is required'; isValid = false; }
        if (!newPassword.trim() || newPassword.length < 6) { errors.newPassword = 'Password must be at least 6 characters'; isValid = false; }
        setValidationErrors(errors);

        if (!isValid) return;

        try {
            await verifyReset({ email, otp, newPassword }).unwrap();
            navigate('/login');
        } catch (err) {
            console.error('Failed to verify password reset:', err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-zinc-950 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-950 to-zinc-950 pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-sm relative z-10 animate-fade-in">
                
                {/* Brand mark */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/10">
                        <Activity className="text-indigo-500" size={24} />
                    </div>
                    <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight flex items-center gap-2">
                        Cypher<span className="font-normal text-zinc-500 italic">Sight</span>
                    </h1>
                </div>

                {/* Card */}
                <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                    
                    {/* Card header */}
                    <div className="px-8 py-6 border-b border-zinc-800/50 bg-zinc-900/30 text-center">
                        <p className="text-[10px] tracking-widest uppercase text-indigo-400 mb-1 font-semibold">
                            Recovery
                        </p>
                        <h2 className="text-xl font-semibold text-zinc-50 tracking-tight">
                            Forgot <span className="font-normal text-zinc-500 italic">Password</span>
                        </h2>
                    </div>

                    {step === 1 ? (
                        <>
                            {initiateError && (
                                <div className="mx-8 mt-6 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-mono text-rose-400 text-center">
                                    Something went wrong. Try again.
                                </div>
                            )}

                            <form onSubmit={handleInitiate} className="px-8 py-6 space-y-5">
                                <div>
                                    <label htmlFor="email" className="block text-[10px] tracking-widest uppercase text-zinc-500 mb-2 font-semibold">Account Email</label>
                                    <input
                                        type="email" id="email"
                                        value={email} onChange={(e) => { setEmail(e.target.value); setValidationErrors(p => ({...p, email: ''})) }}
                                        placeholder="you@example.com"
                                        disabled={isInitiating}
                                        className={`w-full bg-zinc-950/50 border text-zinc-50 font-mono text-sm py-2.5 px-4 rounded-lg focus:outline-none transition-colors placeholder-zinc-700 disabled:opacity-50 ${validationErrors.email ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-800 focus:border-indigo-500'}`}
                                    />
                                    {validationErrors.email && (
                                        <p className="text-[10px] text-rose-400 mt-1.5 font-mono">{validationErrors.email}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isInitiating}
                                    className="w-full mt-2 py-3 bg-indigo-500 border border-indigo-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-600 hover:border-indigo-600 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                                >
                                    {isInitiating ? 'Sending OTP...' : 'Send Reset Code'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            {verifyError && (
                                <div className="mx-8 mt-6 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-mono text-rose-400 text-center">
                                    {'data' in verifyError ? 'Invalid or expired OTP.' : 'Something went wrong. Try again.'}
                                </div>
                            )}

                            <form onSubmit={handleVerify} className="px-8 py-6 space-y-5">
                                <div>
                                    <label htmlFor="otp" className="block text-[10px] tracking-widest uppercase text-zinc-500 mb-2 font-semibold">6-Digit Code</label>
                                    <input
                                        type="text" id="otp"
                                        value={otp} onChange={(e) => { setOtp(e.target.value); setValidationErrors(p => ({...p, otp: ''})) }}
                                        placeholder="000000"
                                        maxLength={6}
                                        disabled={isVerifying}
                                        className={`w-full bg-zinc-950/50 border text-zinc-50 font-mono text-sm py-2.5 px-4 rounded-lg focus:outline-none transition-colors placeholder-zinc-700 disabled:opacity-50 tracking-[0.5em] text-center ${validationErrors.otp ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-800 focus:border-indigo-500'}`}
                                    />
                                    {validationErrors.otp && (
                                        <p className="text-[10px] text-rose-400 mt-1.5 font-mono text-center">{validationErrors.otp}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="newPassword" className="block text-[10px] tracking-widest uppercase text-zinc-500 mb-2 font-semibold">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"} id="newPassword"
                                            value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setValidationErrors(p => ({...p, newPassword: ''})) }}
                                            placeholder="••••••••"
                                            disabled={isVerifying}
                                            className={`w-full bg-zinc-950/50 border text-zinc-50 font-mono text-sm py-2.5 px-4 pr-10 rounded-lg focus:outline-none transition-colors placeholder-zinc-700 disabled:opacity-50 ${validationErrors.newPassword ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-800 focus:border-indigo-500'}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none disabled:opacity-50"
                                            disabled={isVerifying}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {validationErrors.newPassword && (
                                        <p className="text-[10px] text-rose-400 mt-1.5 font-mono">{validationErrors.newPassword}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isVerifying}
                                    className="w-full mt-2 py-3 bg-emerald-500 border border-emerald-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 hover:border-emerald-600 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                >
                                    {isVerifying ? 'Verifying...' : 'Reset Password'}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Footer link */}
                    <div className="px-8 pb-6 pt-4 text-center border-t border-zinc-800/50">
                        <p className="text-xs text-zinc-500 font-medium">
                            Remember your password?{' '}
                            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors ml-1 font-semibold">
                                Return to login →
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
