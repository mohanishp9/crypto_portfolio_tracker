import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLoginMutation } from '../services/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Activity } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const Login = () => {
    const [login, { isLoading, error }] = useLoginMutation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const posthog = usePostHog();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [validationErrors, setValidationErrors] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validateForm = (): boolean => {
        const errors = { email: '', password: '' };
        let isValid = true;
        if (!formData.email.trim()) { errors.email = 'Email is required'; isValid = false; }
        if (!formData.password.trim()) { errors.password = 'Password is required'; isValid = false; }
        setValidationErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            const result = await login({ email: formData.email, password: formData.password }).unwrap();
            dispatch(setCredentials({ user: result.user, accessToken: result.accessToken }));

            posthog?.identify(result.user._id, {
                email: result.user.email,
                name: result.user.name,
            });
            posthog?.capture('Logged In');

            navigate('/dashboard');
        } catch (err) {
            console.error('Login failed:', err);
        }
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
                            Welcome back
                        </h2>
                        <p className="text-sm text-text-secondary mt-1">
                            Sign in to your account
                        </p>
                    </CardHeader>

                    {/* API error */}
                    {error && (
                        <div className="mx-6 mt-4 px-4 py-3 bg-negative-subtle border border-negative/20 rounded-sm text-sm text-negative text-center">
                            {'data' in error ? 'Credentials not recognised.' : 'Something went wrong. Try again.'}
                        </div>
                    )}

                    {/* Form */}
                    <CardBody>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Email address"
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                disabled={isLoading}
                                error={validationErrors.email}
                            />

                            {/* Password — manual for forgot-password link in label row */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="password" className="text-xs font-medium text-text-secondary">
                                        Password
                                    </label>
                                    <Link to="/forgot-password" className="text-xs text-accent hover:text-accent-hover transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        disabled={isLoading}
                                        className={`w-full bg-surface-primary border rounded-sm px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${validationErrors.password ? 'border-negative/50 focus:border-negative focus:ring-negative/20' : 'border-border-secondary'} pr-9`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary focus:outline-none disabled:opacity-50"
                                        disabled={isLoading}
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
                                disabled={isLoading}
                                className="w-full"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40" strokeDashoffset="10" />
                                        </svg>
                                        Signing in...
                                    </>
                                ) : (
                                    "Sign in"
                                )}
                            </Button>
                        </form>
                    </CardBody>

                    {/* Footer link */}
                    <div className="px-4 pb-4 text-center border-t border-border-primary pt-4 mx-4">
                        <p className="text-sm text-text-secondary">
                            Don&apos;t have an account?{' '}
                            <Link to="/register" className="text-accent hover:text-accent-hover transition-colors font-medium">
                                Create one →
                            </Link>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Login;