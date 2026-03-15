import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRegisterMutation } from '../services/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [register, { isLoading, error }] = useRegisterMutation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [validationErrors, setValidationErrors] = useState({ name: '', email: '', password: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validateForm = (): boolean => {
        const errors = { name: '', email: '', password: '' };
        let isValid = true;
        if (formData.name.trim().length < 2) { errors.name = 'At least 2 characters'; isValid = false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { errors.email = 'Valid email required'; isValid = false; }
        if (formData.password.length < 6) { errors.password = 'Minimum 6 characters'; isValid = false; }
        setValidationErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            const result = await register({ name: formData.name, email: formData.email, password: formData.password }).unwrap();
            dispatch(setCredentials({ user: result.user, token: result.jwtToken }));
            navigate('/dashboard');
        } catch (err) {
            console.error('Registration failed:', err);
        }
    };

    const inputStyle = (hasError: boolean) => ({
        width: '100%',
        background: '#1a1c1a',
        border: `1px solid ${hasError ? 'rgba(139,94,60,0.5)' : 'rgba(61,74,62,0.4)'}`,
        color: '#ede8dd',
        fontFamily: "'DM Mono', monospace",
        fontSize: '0.72rem',
        padding: '12px 14px',
        outline: 'none',
        letterSpacing: '0.05em',
        transition: 'border-color 0.2s',
    } as React.CSSProperties);

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '0.55rem',
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        color: '#6b7c6a',
        marginBottom: '8px',
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 py-12"
            style={{ background: '#1a1c1a' }}
        >
            {/* Background grid */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(rgba(61,74,62,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(61,74,62,0.06) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />

            <div className="w-full max-w-sm relative">

                {/* Brand mark */}
                <div className="flex flex-col items-center mb-10">
                    <div
                        className="mb-5 flex items-center justify-center"
                        style={{ width: 48, height: 48, borderRadius: '50%', border: '1px solid rgba(196,136,90,0.3)' }}
                    >
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#c4885a', opacity: 0.7 }} />
                    </div>
                    <h1
                        className="font-light"
                        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', color: '#ede8dd', letterSpacing: '0.06em' }}
                    >
                        Gr<span style={{ fontStyle: 'italic', color: '#c4885a' }}>o</span>ve
                    </h1>
                    <p style={{ fontSize: '0.58rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6b7c6a', marginTop: '6px' }}>
                        Portfolio Tracker
                    </p>
                </div>

                {/* Card */}
                <div style={{ background: '#2e3330', border: '1px solid rgba(61,74,62,0.35)' }}>

                    {/* Card header */}
                    <div
                        className="px-8 py-5"
                        style={{ borderBottom: '1px solid rgba(61,74,62,0.25)', background: '#2a3d2e' }}
                    >
                        <p style={{ fontSize: '0.55rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: '#587560' }}>
                            First time here
                        </p>
                        <h2
                            className="font-light mt-1"
                            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', color: '#ede8dd', letterSpacing: '0.04em' }}
                        >
                            Plant a <span style={{ fontStyle: 'italic', color: '#9aab97' }}>seed</span>
                        </h2>
                    </div>

                    {/* API error */}
                    {error && (
                        <div
                            className="mx-8 mt-6"
                            style={{
                                padding: '10px 14px',
                                background: 'rgba(139,94,60,0.1)',
                                border: '1px solid rgba(139,94,60,0.25)',
                                fontSize: '0.6rem',
                                letterSpacing: '0.1em',
                                color: '#8b5e3c',
                            }}
                        >
                            {'data' in error ? 'Registration failed. Try a different email.' : 'Something went still. Try again.'}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-8 py-7 space-y-6">

                        {/* Name */}
                        <div>
                            <label htmlFor="name" style={labelStyle}>Full Name</label>
                            <input
                                type="text" id="name" name="name"
                                value={formData.name} onChange={handleChange}
                                placeholder="Hana Mori"
                                disabled={isLoading}
                                style={inputStyle(!!validationErrors.name)}
                                onFocus={e => e.currentTarget.style.borderColor = 'rgba(196,136,90,0.5)'}
                                onBlur={e => e.currentTarget.style.borderColor = validationErrors.name ? 'rgba(139,94,60,0.5)' : 'rgba(61,74,62,0.4)'}
                            />
                            {validationErrors.name && (
                                <p style={{ fontSize: '0.58rem', letterSpacing: '0.1em', color: '#8b5e3c', marginTop: '6px' }}>
                                    {validationErrors.name}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" style={labelStyle}>Email Address</label>
                            <input
                                type="email" id="email" name="email"
                                value={formData.email} onChange={handleChange}
                                placeholder="you@grove.studio"
                                disabled={isLoading}
                                style={inputStyle(!!validationErrors.email)}
                                onFocus={e => e.currentTarget.style.borderColor = 'rgba(196,136,90,0.5)'}
                                onBlur={e => e.currentTarget.style.borderColor = validationErrors.email ? 'rgba(139,94,60,0.5)' : 'rgba(61,74,62,0.4)'}
                            />
                            {validationErrors.email && (
                                <p style={{ fontSize: '0.58rem', letterSpacing: '0.1em', color: '#8b5e3c', marginTop: '6px' }}>
                                    {validationErrors.email}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" style={labelStyle}>Password</label>
                            <input
                                type="password" id="password" name="password"
                                value={formData.password} onChange={handleChange}
                                placeholder="••••••••"
                                disabled={isLoading}
                                style={inputStyle(!!validationErrors.password)}
                                onFocus={e => e.currentTarget.style.borderColor = 'rgba(196,136,90,0.5)'}
                                onBlur={e => e.currentTarget.style.borderColor = validationErrors.password ? 'rgba(139,94,60,0.5)' : 'rgba(61,74,62,0.4)'}
                            />
                            {validationErrors.password && (
                                <p style={{ fontSize: '0.58rem', letterSpacing: '0.1em', color: '#8b5e3c', marginTop: '6px' }}>
                                    {validationErrors.password}
                                </p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full transition-all duration-300"
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(196,136,90,0.4)',
                                color: '#c4885a',
                                fontFamily: "'DM Mono', monospace",
                                fontSize: '0.6rem',
                                letterSpacing: '0.3em',
                                textTransform: 'uppercase',
                                padding: '12px 0',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                opacity: isLoading ? 0.5 : 1,
                            }}
                            onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.background = '#c4885a'; e.currentTarget.style.color = '#1a1c1a'; } }}
                            onMouseLeave={e => { if (!isLoading) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c4885a'; } }}
                        >
                            {isLoading ? (
                                <>
                                    <svg style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40" strokeDashoffset="10" />
                                    </svg>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '0.9rem', fontWeight: 300 }}>◎</span>
                                    Create Account
                                </>
                            )}
                        </button>

                    </form>

                    {/* Footer link */}
                    <div
                        className="px-8 pb-7 text-center"
                        style={{ borderTop: '1px solid rgba(61,74,62,0.2)', paddingTop: '20px' }}
                    >
                        <p style={{ fontSize: '0.58rem', letterSpacing: '0.15em', color: '#6b7c6a' }}>
                            Already rooted?{' '}
                            <Link
                                to="/login"
                                style={{ color: '#9aab97', textDecoration: 'none', letterSpacing: '0.15em' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#ede8dd'}
                                onMouseLeave={e => e.currentTarget.style.color = '#9aab97'}
                            >
                                Sign in →
                            </Link>
                        </p>
                    </div>

                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default Register;