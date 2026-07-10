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
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface-primary relative overflow-hidden">
            {/* Background elements */}
            
            <div className="w-full max-w-sm relative z-10 animate-fade-in">
                
                {/* Brand mark */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-sm bg-surface-secondary border border-border-primary flex items-center justify-center mb-4 shadow-accent/10">
                        <Activity className="text-accent" size={24} />
                    </div>
                    <h1 className="text-2xl font-semibold text-text-primary tracking-tight flex items-center gap-2">
                        Cypher<span className="font-normal text-text-tertiary italic">Sight</span>
                    </h1>
                </div>

                {/* Card */}
                <div className="bg-surface-secondary/50  border border-border-primary rounded-sm  overflow-hidden">
                    
                    {/* Card header */}
                    <div className="px-8 py-6 border-b border-border-primary/50 bg-surface-secondary/30 text-center">
                        <p className="text-xs font-medium text-accent mb-1 font-semibold">
                            Recovery
                        </p>
                        <h2 className="text-xl font-semibold text-text-primary tracking-tight">
                            Forgot <span className="font-normal text-text-tertiary italic">Password</span>
                        </h2>
                    </div>

                    {step === 1 ? (
                        <>
                            {initiateError && (
                                <div className="mx-8 mt-6 px-4 py-3 bg-negative-subtle border border-negative/20 rounded-sm text-xs font-medium text-negative text-center">
                                    Something went wrong. Try again.
                                </div>
                            )}

                            <form onSubmit={handleInitiate} className="px-8 py-6 space-y-5">
                                <div>
                                    <label htmlFor="email" className="block text-xs font-medium text-text-tertiary mb-2 font-semibold">Account Email</label>
                                    <input
                                        type="email" id="email"
                                        value={email} onChange={(e) => { setEmail(e.target.value); setValidationErrors(p => ({...p, email: ''})) }}
                                        placeholder="you@example.com"
                                        disabled={isInitiating}
                                        className={`w-full bg-surface-primary/50 border text-text-primary text-sm py-2.5 px-4 rounded-sm focus:outline-none transition-colors placeholder-text-tertiary disabled:opacity-50 ${validationErrors.email ? 'border-negative/50 focus:border-negative' : 'border-border-primary focus:border-accent'}`}
                                    />
                                    {validationErrors.email && (
                                        <p className="text-xs text-negative mt-1.5 font-medium">{validationErrors.email}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isInitiating}
                                    className="w-full mt-2 py-3 bg-accent border border-accent text-white rounded-sm text-xs font-semibold  transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-hover hover:border-accent-hover flex items-center justify-center gap-2  shadow-accent/20"
                                >
                                    {isInitiating ? 'Sending OTP...' : 'Send Reset Code'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            {verifyError && (
                                <div className="mx-8 mt-6 px-4 py-3 bg-negative-subtle border border-negative/20 rounded-sm text-xs font-medium text-negative text-center">
                                    {'data' in verifyError ? 'Invalid or expired OTP.' : 'Something went wrong. Try again.'}
                                </div>
                            )}

                            <form onSubmit={handleVerify} className="px-8 py-6 space-y-5">
                                <div>
                                    <label htmlFor="otp" className="block text-xs font-medium text-text-tertiary mb-2 font-semibold">6-Digit Code</label>
                                    <input
                                        type="text" id="otp"
                                        value={otp} onChange={(e) => { setOtp(e.target.value); setValidationErrors(p => ({...p, otp: ''})) }}
                                        placeholder="000000"
                                        maxLength={6}
                                        disabled={isVerifying}
                                        className={`w-full bg-surface-primary/50 border text-text-primary font-mono text-sm py-2.5 px-4 rounded-sm focus:outline-none transition-colors placeholder-text-tertiary disabled:opacity-50 tracking-[0.5em] text-center ${validationErrors.otp ? 'border-negative/50 focus:border-negative' : 'border-border-primary focus:border-accent'}`}
                                    />
                                    {validationErrors.otp && (
                                        <p className="text-xs text-negative mt-1.5 font-medium text-center">{validationErrors.otp}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="newPassword" className="block text-xs font-medium text-text-tertiary mb-2 font-semibold">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"} id="newPassword"
                                            value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setValidationErrors(p => ({...p, newPassword: ''})) }}
                                            placeholder="••••••••"
                                            disabled={isVerifying}
                                            className={`w-full bg-surface-primary/50 border text-text-primary text-sm py-2.5 px-4 pr-10 rounded-sm focus:outline-none transition-colors placeholder-text-tertiary disabled:opacity-50 ${validationErrors.newPassword ? 'border-negative/50 focus:border-negative' : 'border-border-primary focus:border-accent'}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary focus:outline-none disabled:opacity-50"
                                            disabled={isVerifying}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {validationErrors.newPassword && (
                                        <p className="text-xs text-negative mt-1.5 font-medium">{validationErrors.newPassword}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isVerifying}
                                    className="w-full mt-2 py-3 bg-positive border border-positive text-white rounded-sm text-xs font-semibold  transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-positive hover:border-positive flex items-center justify-center gap-2  shadow-positive/20"
                                >
                                    {isVerifying ? 'Verifying...' : 'Reset Password'}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Footer link */}
                    <div className="px-8 pb-6 pt-4 text-center border-t border-border-primary/50">
                        <p className="text-xs text-text-tertiary font-medium">
                            Remember your password?{' '}
                            <Link to="/login" className="text-accent hover:text-accent transition-colors ml-1 font-semibold">
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
