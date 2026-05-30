import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div style={{ background: '#1a1c1a', minHeight: '100vh', color: '#ede8dd' }}>

            {/* Subtle background grid — same as Login page */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(61,74,62,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(61,74,62,0.06) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />

            {/* ─── Navbar ─── */}
            <nav
                style={{
                    background: 'rgba(26,28,26,0.92)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(61,74,62,0.3)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">

                        {/* Logo — matches Navbar.tsx */}
                        <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80" style={{ textDecoration: 'none' }}>
                            <div
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    border: '1px solid rgba(196,136,90,0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <div
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: '#c4885a',
                                        opacity: 0.8,
                                    }}
                                />
                            </div>
                            <span
                                className="font-light"
                                style={{
                                    fontFamily: "'Cormorant Garamond', serif",
                                    fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)',
                                    color: '#ede8dd',
                                    letterSpacing: '0.06em',
                                }}
                            >
                                Grove{' '}
                                <span style={{ color: '#c4885a', fontStyle: 'italic' }}>Portfolio</span>
                            </span>
                        </Link>

                        {/* Right — Login + Sign Up */}
                        <div className="flex items-center gap-4">
                            <Link
                                to="/login"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '0.6rem',
                                    letterSpacing: '0.25em',
                                    textTransform: 'uppercase',
                                    color: '#9aab97',
                                    fontFamily: "'DM Mono', monospace",
                                    textDecoration: 'none',
                                    padding: '6px 0',
                                    transition: 'color 0.2s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#ede8dd')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#9aab97')}
                            >
                                Login
                            </Link>

                            <div
                                className="hidden sm:block"
                                style={{ width: 1, height: 20, background: 'rgba(61,74,62,0.5)' }}
                            />

                            <Link
                                to="/register"
                                className="transition-all duration-300"
                                style={{
                                    border: '1px solid rgba(196,136,90,0.4)',
                                    color: '#c4885a',
                                    fontFamily: "'DM Mono', monospace",
                                    fontSize: '0.6rem',
                                    letterSpacing: '0.25em',
                                    textTransform: 'uppercase',
                                    padding: '8px 18px',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = '#c4885a';
                                    e.currentTarget.style.color = '#1a1c1a';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#c4885a';
                                }}
                            >
                                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '0.9rem', fontWeight: 300 }}>→</span>
                                Sign Up
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ─── Hero Section ─── */}
            <section className="relative flex flex-col items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 64px)' }}>

                {/* Decorative ambient glow */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        width: '520px',
                        height: '520px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(196,136,90,0.06) 0%, transparent 70%)',
                        top: '15%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                    }}
                />

                {/* Brand mark — same circle as Login */}
                <div className="mb-8 flex items-center justify-center" style={{ animation: 'heroFadeIn 0.8s ease-out' }}>
                    <div
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            border: '1px solid rgba(196,136,90,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#c4885a', opacity: 0.7 }} />
                    </div>
                </div>

                {/* Tagline chip */}
                <div
                    className="mb-6"
                    style={{
                        padding: '6px 16px',
                        border: '1px solid rgba(61,74,62,0.35)',
                        background: 'rgba(42,61,46,0.25)',
                        fontSize: '0.55rem',
                        letterSpacing: '0.35em',
                        textTransform: 'uppercase',
                        color: '#587560',
                        animation: 'heroFadeIn 0.8s ease-out 0.15s both',
                    }}
                >
                    Portfolio Tracker
                </div>

                {/* Headline */}
                <h1
                    className="font-light text-center"
                    style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 'clamp(2.2rem, 6vw, 4rem)',
                        color: '#ede8dd',
                        letterSpacing: '0.04em',
                        lineHeight: 1.15,
                        maxWidth: '720px',
                        animation: 'heroFadeIn 0.8s ease-out 0.3s both',
                    }}
                >
                    Cultivate your{' '}
                    <span style={{ fontStyle: 'italic', color: '#c4885a' }}>crypto</span>
                    <br />
                    portfolio with clarity
                </h1>

                {/* Subheadline */}
                <p
                    className="text-center mt-5"
                    style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '0.68rem',
                        letterSpacing: '0.12em',
                        color: '#6b7c6a',
                        maxWidth: '480px',
                        lineHeight: 1.8,
                        animation: 'heroFadeIn 0.8s ease-out 0.45s both',
                    }}
                >
                    Track holdings, monitor real-time prices, and watch your digital assets grow — all in one quiet, refined space.
                </p>

                {/* CTA Buttons */}
                <div
                    className="flex flex-col sm:flex-row items-center gap-4 mt-10"
                    style={{ animation: 'heroFadeIn 0.8s ease-out 0.6s both' }}
                >
                    {/* Primary — Get Started */}
                    <Link
                        to="/register"
                        id="hero-cta-register"
                        className="transition-all duration-300"
                        style={{
                            border: '1px solid rgba(196,136,90,0.4)',
                            background: '#c4885a',
                            color: '#1a1c1a',
                            fontFamily: "'DM Mono', monospace",
                            fontSize: '0.62rem',
                            letterSpacing: '0.3em',
                            textTransform: 'uppercase',
                            padding: '14px 36px',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#c4885a';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = '#c4885a';
                            e.currentTarget.style.color = '#1a1c1a';
                        }}
                    >
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 300 }}>→</span>
                        Get Started
                    </Link>

                    {/* Secondary — Login */}
                    <Link
                        to="/login"
                        id="hero-cta-login"
                        className="transition-all duration-300"
                        style={{
                            border: '1px solid rgba(61,74,62,0.4)',
                            background: 'transparent',
                            color: '#9aab97',
                            fontFamily: "'DM Mono', monospace",
                            fontSize: '0.62rem',
                            letterSpacing: '0.3em',
                            textTransform: 'uppercase',
                            padding: '14px 36px',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'rgba(154,171,151,0.5)';
                            e.currentTarget.style.color = '#ede8dd';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'rgba(61,74,62,0.4)';
                            e.currentTarget.style.color = '#9aab97';
                        }}
                    >
                        Login
                    </Link>
                </div>

                {/* Decorative bottom line */}
                <div
                    className="mt-16"
                    style={{
                        width: '40px',
                        height: '1px',
                        background: 'rgba(196,136,90,0.25)',
                        animation: 'heroFadeIn 0.8s ease-out 0.75s both',
                    }}
                />

                {/* Bottom hint */}
                <p
                    className="mt-4"
                    style={{
                        fontSize: '0.5rem',
                        letterSpacing: '0.4em',
                        textTransform: 'uppercase',
                        color: '#3d4a3e',
                        animation: 'heroFadeIn 0.8s ease-out 0.85s both',
                    }}
                >
                    Free to use · No credit card required
                </p>
            </section>

            {/* Keyframe animations */}
            <style>{`
                @keyframes heroFadeIn {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
