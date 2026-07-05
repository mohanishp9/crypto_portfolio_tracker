import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useInitiateRegistrationMutation, useVerifyRegistrationMutation } from '../services/authApi';
import { useLazyCheckNameQuery } from '../services/userApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import toast from 'react-hot-toast';
import useDebounce from '../hooks/useDebounce';

const Register = () => {
    const [step, setStep] = useState<'form' | 'otp'>('form');
    const [initiateRegistration, { isLoading: isInitiating }] = useInitiateRegistrationMutation();
    const [verifyRegistration, { isLoading: isVerifying }] = useVerifyRegistrationMutation();
    const [checkName, { isFetching: isCheckingName, data: nameData }] = useLazyCheckNameQuery();
    
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const posthog = usePostHog();

    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [validationErrors, setValidationErrors] = useState({ name: '', email: '', password: '' });
    const [otp, setOtp] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const debouncedName = useDebounce(formData.name, 500);

    useEffect(() => {
        if (debouncedName && debouncedName.trim().length >= 2) {
            checkName(debouncedName.trim());
        }
    }, [debouncedName, checkName]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validateForm = (): boolean => {
        const errors = { name: '', email: '', password: '' };
        let isValid = true;
        if (formData.name.trim().length < 2) { errors.name = 'At least 2 characters'; isValid = false; }
        if (nameData && !nameData.available) { errors.name = 'Name is already taken'; isValid = false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { errors.email = 'Valid email required'; isValid = false; }
        if (formData.password.length < 6) { errors.password = 'Minimum 6 characters'; isValid = false; }
        setValidationErrors(errors);
        return isValid;
    };

    const handleInitiate = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            await initiateRegistration({ name: formData.name.trim(), email: formData.email, password: formData.password }).unwrap();
            posthog?.capture('Sign Up Started');
            toast.success('OTP sent to your email!');
            setStep('otp');
        } catch (err: any) {
            console.error('Registration initiation failed:', err);
            toast.error(getErrorMessage(err));
        }
    };

    const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast.error('OTP must be 6 digits.');
            return;
        }
        try {
            const result = await verifyRegistration({ email: formData.email, otp }).unwrap();
            dispatch(setCredentials({ user: result.user, accessToken: result.accessToken }));
            
            posthog?.identify(result.user._id, {
                email: result.user.email,
                name: result.user.name,
            });
            posthog?.capture('Signed Up');

            toast.success('Registration successful! Welcome to CypherSight.');
            navigate('/dashboard');
        } catch (err: any) {
            console.error('OTP verification failed:', err);
            toast.error(getErrorMessage(err));
        }
    };

    const getErrorMessage = (error: any) => {
        if (!error) return null;
        if (typeof error.data?.message === 'string') return error.data.message;
        if ('data' in error) return 'An error occurred. Please try again.';
        return 'Network error.';
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-zinc-950 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-950 to-zinc-950 pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-sm relative z-10 animate-fade-in">
                
                {/* Brand mark */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/10">
                        <Activity className="text-indigo-500" size={24} />
                    </div>
                    <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight flex items-center gap-2">
                        Cypher<span className="font-normal text-zinc-500 italic">Sight</span>
                    </h1>
                    <p className="text-[10px] tracking-widest uppercase text-zinc-500 mt-2 font-mono">
                        System Initialization
                    </p>
                </div>

                {/* Card */}
                <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                    
                    {/* Card header */}
                    <div className="px-8 py-6 border-b border-zinc-800/50 bg-zinc-900/30 text-center">
                        <p className="text-[10px] tracking-widest uppercase text-emerald-500 mb-1 font-semibold">
                            {step === 'form' ? 'First time here' : 'Verification Required'}
                        </p>
                        <h2 className="text-xl font-semibold text-zinc-50 tracking-tight">
                            {step === 'form' ? (
                                <>Create <span className="font-normal text-zinc-500 italic">Account</span></>
                            ) : (
                                <>Enter <span className="font-normal text-zinc-500 italic">OTP</span></>
                            )}
                        </h2>
                    </div>

                    {step === 'form' ? (
                        <form onSubmit={handleInitiate} className="px-8 py-6 space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-[10px] tracking-widest uppercase text-zinc-500 mb-2 font-semibold">Full Name</label>
                                <div className="relative">
                                    <input
                                        type="text" id="name" name="name"
                                        value={formData.name} onChange={handleChange}
                                        placeholder="John Doe"
                                        disabled={isInitiating}
                                        className={`w-full bg-zinc-950/50 border text-zinc-50 font-mono text-sm py-2.5 px-4 pr-10 rounded-lg focus:outline-none transition-colors placeholder-zinc-700 disabled:opacity-50 ${validationErrors.name ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-800 focus:border-indigo-500'}`}
                                    />
                                    {formData.name.trim().length >= 2 && (
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
                                {validationErrors.name && (
                                    <p className="text-[10px] text-rose-400 mt-1.5 font-mono">{validationErrors.name}</p>
                                )}
                                {formData.name.trim().length >= 2 && !isCheckingName && nameData && (
                                    <p className={`text-[10px] mt-1.5 font-mono ${nameData.available ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {nameData.available ? 'Name is available' : 'Name is already taken'}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-[10px] tracking-widest uppercase text-zinc-500 mb-2 font-semibold">Email Address</label>
                                <input
                                    type="email" id="email" name="email"
                                    value={formData.email} onChange={handleChange}
                                    placeholder="you@example.com"
                                    disabled={isInitiating}
                                    className={`w-full bg-zinc-950/50 border text-zinc-50 font-mono text-sm py-2.5 px-4 rounded-lg focus:outline-none transition-colors placeholder-zinc-700 disabled:opacity-50 ${validationErrors.email ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-800 focus:border-indigo-500'}`}
                                />
                                {validationErrors.email && (
                                    <p className="text-[10px] text-rose-400 mt-1.5 font-mono">{validationErrors.email}</p>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="password" className="block text-[10px] tracking-widest uppercase text-zinc-500 font-semibold">Password</label>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"} id="password" name="password"
                                        value={formData.password} onChange={handleChange}
                                        placeholder="••••••••"
                                        disabled={isInitiating}
                                        className={`w-full bg-zinc-950/50 border text-zinc-50 font-mono text-sm py-2.5 px-4 pr-10 rounded-lg focus:outline-none transition-colors placeholder-zinc-700 disabled:opacity-50 ${validationErrors.password ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-800 focus:border-indigo-500'}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none disabled:opacity-50"
                                        disabled={isInitiating}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {validationErrors.password && (
                                    <p className="text-[10px] text-rose-400 mt-1.5 font-mono">{validationErrors.password}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isInitiating || (formData.name.trim().length >= 2 && nameData && !nameData.available)}
                                className="w-full mt-4 py-3 bg-indigo-500 border border-indigo-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-600 hover:border-indigo-600 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                            >
                                {isInitiating ? "Sending OTP..." : "Continue"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerify} className="px-8 py-6 space-y-4 animate-fade-in">
                            <p className="text-xs text-zinc-400 text-center mb-4">
                                We sent a 6-digit code to <strong className="text-zinc-50">{formData.email}</strong>
                            </p>
                            <div>
                                <label htmlFor="otp" className="block text-[10px] tracking-widest uppercase text-zinc-500 mb-2 font-semibold">Verification Code</label>
                                <input
                                    type="text" id="otp" name="otp"
                                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="123456"
                                    disabled={isVerifying}
                                    className="w-full bg-zinc-950/50 border text-center text-zinc-50 font-mono text-2xl tracking-[0.5em] py-4 rounded-lg focus:outline-none transition-colors placeholder-zinc-700 disabled:opacity-50 border-zinc-800 focus:border-indigo-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isVerifying || otp.length !== 6}
                                className="w-full mt-4 py-3 bg-emerald-500 border border-emerald-500 text-zinc-950 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-400 hover:border-emerald-400 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                            >
                                {isVerifying ? "Verifying..." : "Confirm & Register"}
                            </button>
                        </form>
                    )}

                    {/* Footer link */}
                    <div className="px-8 pb-6 pt-4 text-center border-t border-zinc-800/50">
                        {step === 'form' ? (
                            <p className="text-xs text-zinc-500 font-medium">
                                Already active?{' '}
                                <Link to="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors ml-1 font-semibold">
                                    Sign in →
                                </Link>
                            </p>
                        ) : (
                            <p className="text-xs text-zinc-500 font-medium">
                                <button type="button" onClick={() => setStep('form')} className="text-zinc-400 hover:text-zinc-300 transition-colors">
                                    ← Back to registration
                                </button>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;