import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLoginMutation } from '../services/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

const Login = () => {
    const [login, { isLoading, error }] = useLoginMutation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [validationErrors, setValidationErrors] = useState({ email: '', password: '' });

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
            navigate('/dashboard');
        } catch (err) {
            console.error('Login failed:', err);
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
                    <p className="text-[10px] tracking-widest uppercase text-zinc-500 mt-2 font-mono">
                        Terminal Access
                    </p>
                </div>

                {/* Card */}
                <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                    
                    {/* Card header */}
                    <div className="px-8 py-6 border-b border-zinc-800/50 bg-zinc-900/30 text-center">
                        <p className="text-[10px] tracking-widest uppercase text-indigo-400 mb-1 font-semibold">
                            Welcome back
                        </p>
                        <h2 className="text-xl font-semibold text-zinc-50 tracking-tight">
                            Sign <span className="font-normal text-zinc-500 italic">in</span>
                        </h2>
                    </div>

                    {/* API error */}
                    {error && (
                        <div className="mx-8 mt-6 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-mono text-rose-400 text-center">
                            {'data' in error ? 'Credentials not recognised.' : 'Something went wrong. Try again.'}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
                        
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-[10px] tracking-widest uppercase text-zinc-500 mb-2 font-semibold">Email Address</label>
                            <input
                                type="email" id="email" name="email"
                                value={formData.email} onChange={handleChange}
                                placeholder="you@example.com"
                                disabled={isLoading}
                                className={`w-full bg-zinc-950/50 border text-zinc-50 font-mono text-sm py-2.5 px-4 rounded-lg focus:outline-none transition-colors placeholder-zinc-700 disabled:opacity-50 ${validationErrors.email ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-800 focus:border-indigo-500'}`}
                            />
                            {validationErrors.email && (
                                <p className="text-[10px] text-rose-400 mt-1.5 font-mono">{validationErrors.email}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-[10px] tracking-widest uppercase text-zinc-500 mb-2 font-semibold">Password</label>
                            <input
                                type="password" id="password" name="password"
                                value={formData.password} onChange={handleChange}
                                placeholder="••••••••"
                                disabled={isLoading}
                                className={`w-full bg-zinc-950/50 border text-zinc-50 font-mono text-sm py-2.5 px-4 rounded-lg focus:outline-none transition-colors placeholder-zinc-700 disabled:opacity-50 ${validationErrors.password ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-800 focus:border-indigo-500'}`}
                            />
                            {validationErrors.password && (
                                <p className="text-[10px] text-rose-400 mt-1.5 font-mono">{validationErrors.password}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-2 py-3 bg-indigo-500 border border-indigo-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-600 hover:border-indigo-600 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40" strokeDashoffset="10" />
                                    </svg>
                                    Signing in...
                                </>
                            ) : (
                                "Authenticate"
                            )}
                        </button>
                    </form>

                    {/* Footer link */}
                    <div className="px-8 pb-6 pt-4 text-center border-t border-zinc-800/50">
                        <p className="text-xs text-zinc-500 font-medium">
                            No account yet?{' '}
                            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors ml-1 font-semibold">
                                Initialize instance →
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;