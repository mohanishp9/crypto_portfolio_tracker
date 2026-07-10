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
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

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
            posthog?.capture('User Signed Up');

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
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface-primary">
            <div className="w-full max-w-sm animate-fade-in">

                {/* Brand mark */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-md bg-surface-secondary border border-border-primary flex items-center justify-center mb-4">
                        <Activity className="text-accent" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
                        Cypher<span className="font-normal text-text-tertiary italic">Sight</span>
                    </h1>
                    <p className="text-xs text-text-tertiary mt-2">
                        Portfolio tracking, simplified
                    </p>
                </div>

                {/* Card */}
                <Card elevation="raised">
                    <CardHeader className="text-center">
                        <h2 className="text-lg font-semibold text-text-primary tracking-tight">
                            {step === 'form' ? 'Create your account' : 'Verify your email'}
                        </h2>
                        <p className="text-sm text-text-secondary mt-1">
                            {step === 'form' ? 'Get started in under a minute' : `Enter the 6-digit code sent to ${formData.email}`}
                        </p>
                    </CardHeader>

                    {step === 'form' ? (
                        <CardBody>
                            <form onSubmit={handleInitiate} className="space-y-4">
                                {/* Name — manual for availability indicator */}
                                <div>
                                    <label htmlFor="name" className="block text-xs font-medium text-text-secondary mb-1.5">
                                        Full name
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="John Doe"
                                            disabled={isInitiating}
                                            className={`w-full bg-surface-primary border rounded-sm px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${validationErrors.name ? 'border-negative/50 focus:border-negative focus:ring-negative/20' : 'border-border-secondary'} pr-9`}
                                        />
                                        {formData.name.trim().length >= 2 && (
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
                                    {validationErrors.name && (
                                        <p className="text-xs text-negative mt-1.5">{validationErrors.name}</p>
                                    )}
                                    {formData.name.trim().length >= 2 && !isCheckingName && nameData && (
                                        <p className={`text-xs mt-1.5 ${nameData.available ? 'text-positive' : 'text-negative'}`}>
                                            {nameData.available ? 'Name is available' : 'Name is already taken'}
                                        </p>
                                    )}
                                </div>

                                <Input
                                    label="Email address"
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    disabled={isInitiating}
                                    error={validationErrors.email}
                                />

                                {/* Password — manual for toggle icon */}
                                <div>
                                    <label htmlFor="password" className="block text-xs font-medium text-text-secondary mb-1.5">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            disabled={isInitiating}
                                            className={`w-full bg-surface-primary border rounded-sm px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${validationErrors.password ? 'border-negative/50 focus:border-negative focus:ring-negative/20' : 'border-border-secondary'} pr-9`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary focus:outline-none disabled:opacity-50"
                                            disabled={isInitiating}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {validationErrors.password && (
                                        <p className="text-xs text-negative mt-1.5">{validationErrors.password}</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="md"
                                    disabled={isInitiating || (formData.name.trim().length >= 2 && nameData && !nameData.available)}
                                    className="w-full"
                                >
                                    {isInitiating ? "Sending code..." : "Continue"}
                                </Button>
                            </form>
                        </CardBody>
                    ) : (
                        <CardBody>
                            <form onSubmit={handleVerify} className="space-y-4 animate-fade-in">
                                <div>
                                    <label htmlFor="otp" className="block text-xs font-medium text-text-secondary mb-1.5">
                                        Verification code
                                    </label>
                                    <input
                                        type="text"
                                        id="otp"
                                        name="otp"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="123456"
                                        disabled={isVerifying}
                                        className="w-full bg-surface-primary border border-border-secondary text-center text-text-primary font-mono text-2xl tracking-[0.5em] py-4 rounded-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors duration-150 placeholder:text-text-tertiary disabled:opacity-50"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="md"
                                    disabled={isVerifying || otp.length !== 6}
                                    className="w-full"
                                >
                                    {isVerifying ? "Verifying..." : "Verify & join"}
                                </Button>
                            </form>
                        </CardBody>
                    )}

                    {/* Footer link */}
                    <div className="px-4 pb-4 text-center border-t border-border-primary pt-4 mx-4">
                        {step === 'form' ? (
                            <p className="text-sm text-text-secondary">
                                Already have an account?{' '}
                                <Link to="/login" className="text-accent hover:text-accent-hover transition-colors font-medium">
                                    Sign in →
                                </Link>
                            </p>
                        ) : (
                            <p className="text-sm text-text-secondary">
                                <button type="button" onClick={() => setStep('form')} className="text-accent hover:text-accent-hover transition-colors font-medium">
                                    ← Back to registration
                                </button>
                            </p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Register;