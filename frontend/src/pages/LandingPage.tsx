import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { BarChart3, Bell, Eye, ArrowLeftRight, Activity, FolderInput } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LabelList } from 'recharts';

// ── Types ──────────────────────────────────────────────────────

interface CoinMarket {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    price_change_percentage_24h: number;
    market_cap_rank: number;
}

interface GlobalData {
    total_market_cap: number;
    total_volume_24h: number;
    btc_dominance: number;
}

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

// ── Module-level cache (survives re-renders, cleared on full page reload) ──

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let coinsCache: CacheEntry<CoinMarket[]> | null = null;
let globalCache: CacheEntry<GlobalData> | null = null;

interface ChartData { timestamp: number; price: number; }
type CoinCharts = Record<string, ChartData[]>;
let chartsCache: CacheEntry<CoinCharts> | null = null;

const CHART_COINS = [
    { id: 'bitcoin', symbol: 'BTC', color: '#F7931A' },
    { id: 'ethereum', symbol: 'ETH', color: '#627EEA' },
    { id: 'solana', symbol: 'SOL', color: '#14F195' },
    { id: 'binancecoin', symbol: 'BNB', color: '#F3BA2F' },
    { id: 'ripple', symbol: 'XRP', color: '#00AAE4' },
];



function isFresh<T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> {
    return entry !== null && Date.now() - entry.timestamp < CACHE_TTL;
}

function getCachedItem<T>(key: string): CacheEntry<T> | null {
    try {
        const item = localStorage.getItem(key);
        if (item) {
            const parsed = JSON.parse(item);
            if (Date.now() - parsed.timestamp < CACHE_TTL) {
                return parsed;
            }
        }
    } catch {
        // ignore
    }
    return null;
}

function setCachedItem<T>(key: string, data: CacheEntry<T>) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch {
        // ignore
    }
}

// ── Formatters ─────────────────────────────────────────────────

const fmtUsd = (n: number): string => {
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
};

const fmtPrice = (n: number): string =>
    n >= 1
        ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;

const fmtPct = (n: number): string => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

const formatAxisDate = (ts: number) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const formatTooltipDate = (ts: number) => new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// ── Component ──────────────────────────────────────────────────

const LandingPage = () => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [coins, setCoins] = useState<CoinMarket[]>([]);
    const [globalData, setGlobalData] = useState<GlobalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [chartData, setChartData] = useState<CoinCharts>({});
    const [chartLoading, setChartLoading] = useState(true);
    const [activeChartTab, setActiveChartTab] = useState('bitcoin');

    const fetchMarketData = useCallback(async () => {
        const cachedCoins = coinsCache || getCachedItem<CoinMarket[]>('cyphersight_coins');
        const cachedGlobal = globalCache || getCachedItem<GlobalData>('cyphersight_global');

        // Return cached data if fresh
        if (isFresh(cachedCoins) && isFresh(cachedGlobal)) {
            coinsCache = cachedCoins;
            globalCache = cachedGlobal;
            setCoins(cachedCoins.data);
            setGlobalData(cachedGlobal.data);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [coinsRes, globalRes] = await Promise.all([
                fetch(
                    `${import.meta.env.VITE_API_URL}/market/top?limit=10`
                ),
                fetch(`${import.meta.env.VITE_API_URL}/market/global`),
            ]);

            if (!coinsRes.ok || !globalRes.ok) {
                throw new Error('Backend API returned an error for market data');
            }

            const coinsJson = await coinsRes.json();
            const globalJson = await globalRes.json();

            const coinsArray = coinsJson.coins || coinsJson;
            const parsedCoins: CoinMarket[] = coinsArray.map((c: Record<string, unknown>) => ({
                id: c.id,
                symbol: c.symbol,
                name: c.name,
                image: c.image,
                current_price: c.current_price ?? 0,
                market_cap: c.market_cap ?? 0,
                price_change_percentage_24h: c.price_change_percentage_24h ?? 0,
                market_cap_rank: c.market_cap_rank ?? 0,
            }));

            const parsedGlobal: GlobalData = {
                total_market_cap: globalJson.data?.total_market_cap?.usd ?? 0,
                total_volume_24h: globalJson.data?.total_volume?.usd ?? 0,
                btc_dominance: globalJson.data?.market_cap_percentage?.btc ?? 0,
            };

            // Persist in module-level cache and localStorage
            const now = Date.now();
            coinsCache = { data: parsedCoins, timestamp: now };
            globalCache = { data: parsedGlobal, timestamp: now };
            setCachedItem('cyphersight_coins', coinsCache);
            setCachedItem('cyphersight_global', globalCache);

            setCoins(parsedCoins);
            setGlobalData(parsedGlobal);
        } catch (err) {
            console.warn('Failed to fetch market data, using fallback data', err);
            // Fallback to cache (even if stale) or stale cache
            if (cachedCoins && cachedGlobal) {
                setCoins((cachedCoins as CacheEntry<CoinMarket[]>).data);
                setGlobalData((cachedGlobal as CacheEntry<GlobalData>).data);
            } else {
                setError('Market data unavailable');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMarketData();
    }, [fetchMarketData]);

    const fetchChartsData = useCallback(async () => {
        const cachedCharts = chartsCache || getCachedItem<CoinCharts>('cyphersight_charts');
        
        if (isFresh(cachedCharts)) {
            chartsCache = cachedCharts;
            setChartData(cachedCharts.data);
            setChartLoading(false);
            return;
        }
        setChartLoading(true);
        try {
            const responses = await Promise.all(
                CHART_COINS.map(c => fetch(`${import.meta.env.VITE_API_URL}/market/chart/${c.id}?days=7`))
            );
            
            if (responses.some(r => !r.ok)) {
                throw new Error('Backend API returned an error for chart data');
            }

            const newChartData: CoinCharts = {};
            for (let i = 0; i < CHART_COINS.length; i++) {
                const json = await responses[i].json();
                const pricesArray = json.prices || json;
                newChartData[CHART_COINS[i].id] = pricesArray.map((p: [number, number]) => ({
                    timestamp: p[0], price: p[1]
                }));
            }
            chartsCache = { data: newChartData, timestamp: Date.now() };
            setCachedItem('cyphersight_charts', chartsCache);
            setChartData(newChartData);
        } catch (err) {
            console.warn('Failed to fetch chart data, using fallback data', err);
            if (cachedCharts) {
                setChartData((cachedCharts as CacheEntry<CoinCharts>).data);
            } else {
                setChartData({});
            }
        } finally {
            setChartLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchChartsData();
    }, [fetchChartsData]);

    // ── Shared styles ──────────────────────────────────────────

    const labelStyle: React.CSSProperties = {
        fontSize: '0.5rem',
        letterSpacing: '0.35em',
        textTransform: 'uppercase',
        color: '#818cf8',
    };

    const monoStyle: React.CSSProperties = {
        fontFamily: "'DM Mono', monospace",
        fontSize: '0.68rem',
        letterSpacing: '0.08em',
    };

    // ── Render ──────────────────────────────────────────────────

    return (
        <div style={{ background: '#09090b', minHeight: '100vh', color: '#fafafa' }}>

            {/* Subtle background grid — same as Login page */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(63, 63, 70,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(63, 63, 70,0.06) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />

            {/* ─── Navbar ─── */}
            <nav
                style={{
                    background: 'rgba(9, 9, 11, 0.92)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(63, 63, 70,0.3)',
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
                                    border: '1px solid rgba(129, 140, 248,0.5)',
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
                                        background: '#818cf8',
                                        opacity: 0.8,
                                    }}
                                />
                            </div>
                            <span
                                className="font-light"
                                style={{
                                    fontFamily: "ui-sans-serif, system-ui, sans-serif",
                                    fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)',
                                    color: '#fafafa',
                                    letterSpacing: '0.06em',
                                }}
                            >
                                CypherSight{' '}
                                <span style={{ color: '#818cf8', fontStyle: 'italic' }}>Portfolio</span>
                            </span>
                        </Link>

                        {/* Right — Login + Sign Up or Dashboard */}
                        <div className="flex items-center gap-4">
                            {isAuthenticated ? (
                                <Link
                                    to="/dashboard"
                                    className="transition-all duration-300"
                                    style={{
                                        border: '1px solid rgba(129, 140, 248,0.4)',
                                        color: '#818cf8',
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
                                        e.currentTarget.style.background = '#818cf8';
                                        e.currentTarget.style.color = '#09090b';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = '#818cf8';
                                    }}
                                >
                                    <span style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: '0.9rem', fontWeight: 300 }}>→</span>
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            fontSize: '0.6rem',
                                            letterSpacing: '0.25em',
                                            textTransform: 'uppercase',
                                            color: '#a1a1aa',
                                            fontFamily: "'DM Mono', monospace",
                                            textDecoration: 'none',
                                            padding: '6px 0',
                                            transition: 'color 0.2s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#fafafa')}
                                        onMouseLeave={e => (e.currentTarget.style.color = '#a1a1aa')}
                                    >
                                        Login
                                    </Link>

                                    <div
                                        className="hidden sm:block"
                                        style={{ width: 1, height: 20, background: 'rgba(63, 63, 70,0.5)' }}
                                    />

                                    <Link
                                        to="/register"
                                        className="transition-all duration-300"
                                        style={{
                                            border: '1px solid rgba(129, 140, 248,0.4)',
                                            color: '#818cf8',
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
                                            e.currentTarget.style.background = '#818cf8';
                                            e.currentTarget.style.color = '#09090b';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = '#818cf8';
                                        }}
                                    >
                                        <span style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: '0.9rem', fontWeight: 300 }}>→</span>
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* ─── Market Stats Bar ─── */}
            <div
                style={{
                    borderBottom: '1px solid rgba(63, 63, 70,0.2)',
                    background: 'rgba(39, 39, 42, 0.5)',
                }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center gap-6 sm:gap-10 py-3 overflow-x-auto">
                        {loading ? (
                            // Skeleton for stats bar
                            <>
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div style={{ ...skeletonBlock, width: 60, height: 10 }} />
                                        <div style={{ ...skeletonBlock, width: 80, height: 12 }} />
                                    </div>
                                ))}
                            </>
                        ) : error ? (
                            <span style={{ ...monoStyle, color: '#f43f5e', fontSize: '0.55rem' }}>
                                Market data unavailable
                            </span>
                        ) : globalData ? (
                            <>
                                <StatItem label="Market Cap" value={fmtUsd(globalData.total_market_cap)} labelStyle={labelStyle} monoStyle={monoStyle} />
                                <div style={{ width: 1, height: 16, background: 'rgba(63, 63, 70,0.3)' }} />
                                <StatItem label="24h Volume" value={fmtUsd(globalData.total_volume_24h)} labelStyle={labelStyle} monoStyle={monoStyle} />
                                <div className="hidden sm:block" style={{ width: 1, height: 16, background: 'rgba(63, 63, 70,0.3)' }} />
                                <StatItem label="BTC Dominance" value={`${globalData.btc_dominance.toFixed(1)}%`} labelStyle={labelStyle} monoStyle={monoStyle} className="hidden sm:flex" />
                            </>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* ─── Hero Section ─── */}
            <section className="relative flex flex-col items-center justify-center px-4 py-20 sm:py-28">

                {/* Decorative ambient glow */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        width: '520px',
                        height: '520px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(129, 140, 248,0.06) 0%, transparent 70%)',
                        top: '5%',
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
                            border: '1px solid rgba(129, 140, 248,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#818cf8', opacity: 0.7 }} />
                    </div>
                </div>

                {/* Tagline chip */}
                <div
                    className="mb-6"
                    style={{
                        padding: '6px 16px',
                        border: '1px solid rgba(63, 63, 70,0.35)',
                        background: 'rgba(39, 39, 42, 0.5)',
                        fontSize: '0.55rem',
                        letterSpacing: '0.35em',
                        textTransform: 'uppercase',
                        color: '#818cf8',
                        animation: 'heroFadeIn 0.8s ease-out 0.15s both',
                    }}
                >
                    Portfolio Tracker
                </div>

                {/* Headline */}
                <h1
                    className="font-light text-center"
                    style={{
                        fontFamily: "ui-sans-serif, system-ui, sans-serif",
                        fontSize: 'clamp(2.2rem, 6vw, 4rem)',
                        color: '#fafafa',
                        letterSpacing: '0.04em',
                        lineHeight: 1.15,
                        maxWidth: '720px',
                        animation: 'heroFadeIn 0.8s ease-out 0.3s both',
                    }}
                >
                    Cultivate your{' '}
                    <span style={{ fontStyle: 'italic', color: '#818cf8' }}>crypto</span>
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
                        color: '#71717a',
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
                    {isAuthenticated ? (
                        <Link
                            to="/dashboard"
                            className="transition-all duration-300"
                            style={{
                                border: '1px solid rgba(129, 140, 248,0.4)',
                                background: '#818cf8',
                                color: '#09090b',
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
                                e.currentTarget.style.color = '#818cf8';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = '#818cf8';
                                e.currentTarget.style.color = '#09090b';
                            }}
                        >
                            <span style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: '1rem', fontWeight: 300 }}>→</span>
                            Go to Dashboard
                        </Link>
                    ) : (
                        <>
                            {/* Primary — Get Started */}
                            <Link
                                to="/register"
                                id="hero-cta-register"
                                className="transition-all duration-300"
                                style={{
                                    border: '1px solid rgba(129, 140, 248,0.4)',
                                    background: '#818cf8',
                                    color: '#09090b',
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
                                    e.currentTarget.style.color = '#818cf8';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = '#818cf8';
                                    e.currentTarget.style.color = '#09090b';
                                }}
                            >
                                <span style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: '1rem', fontWeight: 300 }}>→</span>
                                Get Started
                            </Link>

                            {/* Secondary — Login */}
                            <Link
                                to="/login"
                                id="hero-cta-login"
                                className="transition-all duration-300"
                                style={{
                                    border: '1px solid rgba(63, 63, 70,0.4)',
                                    background: 'transparent',
                                    color: '#a1a1aa',
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
                                    e.currentTarget.style.color = '#fafafa';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'rgba(63, 63, 70,0.4)';
                                    e.currentTarget.style.color = '#a1a1aa';
                                }}
                            >
                                Login
                            </Link>
                        </>
                    )}
                </div>
            </section>

            {/* ─── Top 10 Coins Section ─── */}
            <section className="relative px-4 pb-20">
                <div className="max-w-5xl mx-auto">

                    {/* Section header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div style={{ width: 24, height: 1, background: 'rgba(129, 140, 248,0.3)' }} />
                        <h2
                            className="font-light"
                            style={{
                                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                                fontSize: '1.5rem',
                                color: '#fafafa',
                                letterSpacing: '0.04em',
                            }}
                        >
                            Top <span style={{ fontStyle: 'italic', color: '#818cf8' }}>10</span> by Market Cap
                        </h2>
                        <div style={{ flex: 1, height: 1, background: 'rgba(63, 63, 70,0.2)' }} />
                    </div>

                    {/* Error state */}
                    {error && !loading && (
                        <div
                            style={{
                                padding: '16px 20px',
                                background: 'rgba(244, 63, 94,0.1)',
                                border: '1px solid rgba(244, 63, 94,0.25)',
                                ...monoStyle,
                                fontSize: '0.6rem',
                                color: '#f43f5e',
                                letterSpacing: '0.1em',
                                textAlign: 'center',
                            }}
                        >
                            {error}
                            <button
                                onClick={fetchMarketData}
                                style={{
                                    marginLeft: 12,
                                    background: 'transparent',
                                    border: '1px solid rgba(244, 63, 94,0.35)',
                                    color: '#818cf8',
                                    fontFamily: "'DM Mono', monospace",
                                    fontSize: '0.55rem',
                                    letterSpacing: '0.2em',
                                    textTransform: 'uppercase',
                                    padding: '4px 12px',
                                    cursor: 'pointer',
                                }}
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Loading skeleton */}
                    {loading && (
                        <div className="custom-scrollbar" style={{ background: '#18181b', border: '1px solid rgba(63, 63, 70,0.3)', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(63, 63, 70,0.3)', background: 'rgba(39, 39, 42, 0.5)' }}>
                                        <th style={{ padding: '16px', ...labelStyle, width: '60px' }}>#</th>
                                        <th style={{ padding: '16px', ...labelStyle }}>Name</th>
                                        <th style={{ padding: '16px', ...labelStyle, textAlign: 'right' }}>Price</th>
                                        <th style={{ padding: '16px', ...labelStyle, textAlign: 'right' }}>24h Change</th>
                                        <th style={{ padding: '16px', ...labelStyle, textAlign: 'right' }}>Market Cap</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <tr
                                            key={i}
                                            style={{
                                                borderBottom: '1px solid rgba(63, 63, 70,0.15)',
                                                animation: `skeletonPulse 1.6s ease-in-out infinite ${i * 0.08}s`,
                                            }}
                                        >
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ ...skeletonBlock, width: 20, height: 12 }} />
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div className="flex items-center gap-3">
                                                    <div style={{ ...skeletonBlock, width: 24, height: 24, borderRadius: '50%' }} />
                                                    <div style={{ ...skeletonBlock, width: 80, height: 12 }} />
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ ...skeletonBlock, width: 60, height: 12, marginLeft: 'auto' }} />
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ ...skeletonBlock, width: 45, height: 12, marginLeft: 'auto' }} />
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ ...skeletonBlock, width: 80, height: 12, marginLeft: 'auto' }} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Coin table */}
                    {!loading && !error && coins.length > 0 && (
                        <div className="custom-scrollbar" style={{ background: '#18181b', border: '1px solid rgba(63, 63, 70,0.3)', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(63, 63, 70,0.3)', background: 'rgba(39, 39, 42, 0.5)' }}>
                                        <th style={{ padding: '16px', ...labelStyle, width: '60px' }}>#</th>
                                        <th style={{ padding: '16px', ...labelStyle }}>Name</th>
                                        <th style={{ padding: '16px', ...labelStyle, textAlign: 'right' }}>Price</th>
                                        <th style={{ padding: '16px', ...labelStyle, textAlign: 'right' }}>24h Change</th>
                                        <th style={{ padding: '16px', ...labelStyle, textAlign: 'right' }}>Market Cap</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coins.map((coin, idx) => {
                                        const isPositive = coin.price_change_percentage_24h >= 0;
                                        return (
                                            <tr
                                                key={coin.id}
                                                className="transition-colors duration-200"
                                                style={{
                                                    borderBottom: '1px solid rgba(63, 63, 70,0.15)',
                                                    animation: `heroFadeIn 0.5s ease-out ${idx * 0.04}s both`,
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(63, 63, 70,0.1)')}
                                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                            >
                                                {/* Rank */}
                                                <td style={{ padding: '16px', ...monoStyle, color: '#71717a' }}>
                                                    {coin.market_cap_rank}
                                                </td>

                                                {/* Name */}
                                                <td style={{ padding: '16px' }}>
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            style={{
                                                                width: 24,
                                                                height: 24,
                                                                borderRadius: '50%',
                                                                border: '1px solid rgba(63, 63, 70,0.25)',
                                                                overflow: 'hidden',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                background: '#09090b',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            <img
                                                                src={coin.image}
                                                                alt={coin.name}
                                                                width={16}
                                                                height={16}
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                        <div className="flex items-baseline gap-2 min-w-0">
                                                            <span
                                                                style={{
                                                                    fontFamily: "ui-sans-serif, system-ui, sans-serif",
                                                                    fontSize: '0.9rem',
                                                                    color: '#fafafa',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                }}
                                                            >
                                                                {coin.name}
                                                            </span>
                                                            <span style={{ ...labelStyle, fontSize: '0.45rem', color: '#71717a' }}>
                                                                {coin.symbol.toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Price */}
                                                <td
                                                    style={{
                                                        padding: '16px',
                                                        textAlign: 'right',
                                                        fontFamily: "'DM Mono', monospace",
                                                        fontSize: '0.72rem',
                                                        color: '#fafafa',
                                                    }}
                                                >
                                                    {fmtPrice(coin.current_price)}
                                                </td>

                                                {/* 24h Change */}
                                                <td
                                                    style={{
                                                        padding: '16px',
                                                        textAlign: 'right',
                                                        fontFamily: "'DM Mono', monospace",
                                                        fontSize: '0.72rem',
                                                        color: isPositive ? '#10b981' : '#f43f5e',
                                                    }}
                                                >
                                                    {fmtPct(coin.price_change_percentage_24h)}
                                                </td>

                                                {/* Market Cap */}
                                                <td
                                                    style={{
                                                        padding: '16px',
                                                        textAlign: 'right',
                                                        ...monoStyle,
                                                        color: '#a1a1aa',
                                                    }}
                                                >
                                                    {fmtUsd(coin.market_cap)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>
            </section>

            {/* ─── Live Market Overview (Charts) ─── */}
            <section className="relative px-4 py-20" style={{ borderTop: '1px solid rgba(63, 63, 70,0.15)' }}>
                <div className="max-w-5xl mx-auto">
                    {/* Section header */}
                    <div className="flex items-center gap-4 mb-10">
                        <div style={{ width: 24, height: 1, background: 'rgba(129, 140, 248,0.3)' }} />
                        <h2 className="font-light" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: '1.5rem', color: '#fafafa', letterSpacing: '0.04em' }}>
                            Live Market <span style={{ fontStyle: 'italic', color: '#818cf8' }}>Overview</span>
                        </h2>
                        <div style={{ flex: 1, height: 1, background: 'rgba(63, 63, 70,0.2)' }} />
                    </div>

                    {/* Top Row: 7-day Line Chart */}
                    <div style={{ background: '#18181b', border: '1px solid rgba(63, 63, 70,0.3)', padding: '24px', marginBottom: '24px' }}>
                        <div className="flex flex-wrap gap-2 mb-6 border-b border-[rgba(63, 63, 70,0.3)] pb-4">
                            {CHART_COINS.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setActiveChartTab(c.id)}
                                    style={{
                                        background: activeChartTab === c.id ? 'rgba(63, 63, 70,0.3)' : 'transparent',
                                        border: `1px solid ${activeChartTab === c.id ? c.color : 'rgba(63, 63, 70,0.2)'}`,
                                        color: activeChartTab === c.id ? '#fafafa' : '#a1a1aa',
                                        padding: '6px 12px',
                                        fontFamily: "'DM Mono', monospace",
                                        fontSize: '0.65rem',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
                                    {c.symbol}
                                </button>
                            ))}
                        </div>
                        <div className="custom-scrollbar" style={{ height: 300, overflowX: 'auto' }}>
                            {chartLoading ? (
                                <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(63, 63, 70,0.1)', animation: 'skeletonPulse 1.6s ease-in-out infinite' }}>
                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#71717a' }}>Loading chart...</span>
                                </div>
                            ) : (
                                <div style={{ minWidth: '600px', height: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData[activeChartTab] || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={CHART_COINS.find(c => c.id === activeChartTab)?.color || '#818cf8'} stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor={CHART_COINS.find(c => c.id === activeChartTab)?.color || '#818cf8'} stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="timestamp" tickFormatter={formatAxisDate} tick={{ fill: '#71717a', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} minTickGap={30} />
                                            <YAxis tickFormatter={(val) => `$${val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val}`} tick={{ fill: '#71717a', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                                            <Tooltip 
                                                contentStyle={{ background: '#09090b', border: '1px solid rgba(63, 63, 70,0.5)', borderRadius: '4px', fontFamily: "'DM Mono', monospace", fontSize: '0.7rem' }}
                                                labelFormatter={(l) => formatTooltipDate(l as number)}
                                                itemStyle={{ color: '#fafafa' }}
                                                formatter={(val: number) => [fmtPrice(val), 'Price']}
                                            />
                                            <Area type="monotone" dataKey="price" stroke={CHART_COINS.find(c => c.id === activeChartTab)?.color || '#818cf8'} fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} isAnimationActive={true} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Row: Donut & Bar Charts */}
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Donut Chart: Market Cap */}
                        <div style={{ background: '#18181b', border: '1px solid rgba(63, 63, 70,0.3)', padding: '24px', flex: 1 }}>
                            <h3 style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: '1.2rem', color: '#fafafa', letterSpacing: '0.04em', marginBottom: '16px' }}>Market Cap Distribution</h3>
                            <div className="flex items-center justify-center" style={{ height: 250, minHeight: 250 }}>
                                {!loading && coins.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={coins.map(coin => ({
                                                    ...coin,
                                                    value: coin.market_cap // Pie chart needs 'value' key or specific mapping
                                                }))}
                                                dataKey="value"
                                                nameKey="symbol"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                stroke="none"
                                                isAnimationActive={true}
                                            >
                                                {coins.map((coin, index) => {
                                                    const predefined = CHART_COINS.find(c => c.id === coin.id);
                                                    const color = predefined ? predefined.color : `hsl(${120 + index * 40}, 30%, 50%)`;
                                                    return <Cell key={`cell-${index}`} fill={color} />;
                                                })}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ background: '#09090b', border: '1px solid rgba(63, 63, 70,0.5)', borderRadius: '4px', fontFamily: "'DM Mono', monospace", fontSize: '0.7rem' }}
                                                itemStyle={{ color: '#fafafa' }}
                                                formatter={(val: number, name: string) => [fmtUsd(val), name.toUpperCase()]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(63, 63, 70,0.1)', animation: 'skeletonPulse 1.6s ease-in-out infinite' }} />
                                )}
                            </div>
                        </div>

                        {/* Bar Chart: 24h Performance */}
                        <div style={{ background: '#18181b', border: '1px solid rgba(63, 63, 70,0.3)', padding: '24px', flex: 1 }}>
                            <h3 style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: '1.2rem', color: '#fafafa', letterSpacing: '0.04em', marginBottom: '16px' }}>24h Performance</h3>
                            <div style={{ height: 250 }}>
                                {!loading && coins.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart layout="vertical" data={coins} margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                                            <XAxis type="number" hide domain={['dataMin - 2', 'dataMax + 2']} />
                                            <YAxis type="category" dataKey="symbol" tickFormatter={(val) => val.toUpperCase()} tick={{ fill: '#71717a', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} width={40} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(63, 63, 70,0.2)' }}
                                                contentStyle={{ background: '#09090b', border: '1px solid rgba(63, 63, 70,0.5)', borderRadius: '4px', fontFamily: "'DM Mono', monospace", fontSize: '0.7rem' }}
                                                formatter={(val: number) => [fmtPct(val), '24h Change']}
                                            />
                                            <Bar dataKey="price_change_percentage_24h" radius={[0, 4, 4, 0]} isAnimationActive={true} barSize={12}>
                                                {coins.map((coin, index) => (
                                                    <Cell key={`cell-${index}`} fill={coin.price_change_percentage_24h >= 0 ? '#10b981' : '#f43f5e'} />
                                                ))}
                                                <LabelList 
                                                    dataKey="price_change_percentage_24h" 
                                                    position="right" 
                                                    formatter={(val: unknown) => fmtPct(Number(val))} 
                                                    style={{ fill: '#a1a1aa', fontSize: 9, fontFamily: "'DM Mono', monospace" }}
                                                />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(63, 63, 70,0.1)', animation: 'skeletonPulse 1.6s ease-in-out infinite' }} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Features Section ─── */}
            <section className="relative px-4 py-20" style={{ borderTop: '1px solid rgba(63, 63, 70,0.15)' }}>
                <div className="max-w-5xl mx-auto">

                    {/* Section header */}
                    <div className="flex items-center gap-4 mb-4">
                        <div style={{ width: 24, height: 1, background: 'rgba(129, 140, 248,0.3)' }} />
                        <span style={{ fontSize: '0.5rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: '#818cf8' }}>
                            What you get
                        </span>
                    </div>
                    <h2
                        className="font-light mb-12"
                        style={{
                            fontFamily: "ui-sans-serif, system-ui, sans-serif",
                            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                            color: '#fafafa',
                            letterSpacing: '0.04em',
                        }}
                    >
                        Everything to <span style={{ fontStyle: 'italic', color: '#818cf8' }}>grow</span> your portfolio
                    </h2>

                    {/* Feature cards grid */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '1px',
                            background: 'rgba(63, 63, 70,0.15)',
                        }}
                    >
                        {FEATURES.map((feat, idx) => (
                            <FeatureCard key={feat.title} feature={feat} index={idx} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── How It Works Section ─── */}
            <section className="relative px-4 py-20" style={{ borderTop: '1px solid rgba(63, 63, 70,0.15)' }}>
                <div className="max-w-3xl mx-auto">

                    {/* Section header */}
                    <div className="text-center mb-14">
                        <span
                            style={{
                                display: 'inline-block',
                                padding: '6px 16px',
                                border: '1px solid rgba(63, 63, 70,0.35)',
                                background: 'rgba(39, 39, 42, 0.5)',
                                fontSize: '0.5rem',
                                letterSpacing: '0.35em',
                                textTransform: 'uppercase',
                                color: '#818cf8',
                                marginBottom: '16px',
                            }}
                        >
                            How it works
                        </span>
                        <h2
                            className="font-light"
                            style={{
                                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                                fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                                color: '#fafafa',
                                letterSpacing: '0.04em',
                            }}
                        >
                            Three steps to <span style={{ fontStyle: 'italic', color: '#818cf8' }}>clarity</span>
                        </h2>
                    </div>

                    {/* Steps */}
                    <div className="flex flex-col gap-0">
                        {STEPS.map((step, idx) => (
                            <StepItem key={step.title} step={step} index={idx} isLast={idx === STEPS.length - 1} />
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="flex flex-col items-center mt-14">
                        <Link
                            to={isAuthenticated ? "/dashboard" : "/register"}
                            id="how-it-works-cta"
                            className="transition-all duration-300"
                            style={{
                                border: '1px solid rgba(129, 140, 248,0.4)',
                                background: '#818cf8',
                                color: '#09090b',
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
                                e.currentTarget.style.color = '#818cf8';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = '#818cf8';
                                e.currentTarget.style.color = '#09090b';
                            }}
                        >
                            <span style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: '1rem', fontWeight: 300 }}>→</span>
                            {isAuthenticated ? "Go to Dashboard" : "Start Tracking Free"}
                        </Link>

                        <div className="mt-10" style={{ width: 40, height: 1, background: 'rgba(129, 140, 248,0.25)' }} />
                        <p
                            className="mt-4"
                            style={{
                                fontSize: '0.5rem',
                                letterSpacing: '0.4em',
                                textTransform: 'uppercase',
                                color: '#52525b',
                            }}
                        >
                            Free to use · No credit card required
                        </p>
                    </div>
                </div>
            </section>

            {/* ─── Trending Coins Section ─── */}
            <section className="relative px-4 py-20" style={{ borderTop: '1px solid rgba(63, 63, 70,0.15)' }}>
                <div className="max-w-5xl mx-auto">
                    {/* Section header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div style={{ width: 24, height: 1, background: 'rgba(129, 140, 248,0.3)' }} />
                        <h2
                            className="font-light"
                            style={{
                                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                                fontSize: '1.5rem',
                                color: '#fafafa',
                                letterSpacing: '0.04em',
                            }}
                        >
                            Trending <span style={{ fontStyle: 'italic', color: '#818cf8' }}>Movers</span>
                        </h2>
                        <div style={{ flex: 1, height: 1, background: 'rgba(63, 63, 70,0.2)' }} />
                    </div>
                    
                    {/* Horizontal scrollable row */}
                    {!loading && !error && coins.length > 0 ? (
                        <div className="flex overflow-x-auto gap-4 pb-4 sm:grid sm:grid-cols-5 sm:overflow-visible sm:pb-0" style={{ scrollbarWidth: 'none' }}>
                            {[...coins].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 5).map((coin, idx) => {
                                const isPositive = coin.price_change_percentage_24h >= 0;
                                return (
                                    <div
                                        key={coin.id}
                                        className="transition-all duration-200 flex-shrink-0 w-48 sm:w-auto"
                                        style={{
                                            background: '#18181b',
                                            border: '1px solid rgba(63, 63, 70,0.3)',
                                            padding: '16px',
                                            cursor: 'default',
                                            animation: `heroFadeIn 0.5s ease-out ${idx * 0.05}s both`,
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#343a36')}
                                        onMouseLeave={e => (e.currentTarget.style.background = '#18181b')}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: '50%',
                                                    border: '1px solid rgba(63, 63, 70,0.3)',
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: '#09090b',
                                                }}
                                            >
                                                <img src={coin.image} alt={coin.name} width={16} height={16} loading="lazy" style={{ borderRadius: '50%' }} />
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ ...monoStyle, fontSize: '0.68rem', color: '#fafafa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {coin.name}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: '1.2rem', fontWeight: 300, color: '#fafafa', letterSpacing: '0.02em', marginBottom: 8 }}>
                                            {fmtPrice(coin.current_price)}
                                        </div>
                                        <div style={{ display: 'inline-block', padding: '2px 6px', background: isPositive ? 'rgba(16, 185, 129,0.1)' : 'rgba(244, 63, 94,0.1)', border: `1px solid ${isPositive ? 'rgba(16, 185, 129,0.2)' : 'rgba(244, 63, 94,0.2)'}`, borderRadius: '2px' }}>
                                            <span style={{ ...monoStyle, fontSize: '0.55rem', color: isPositive ? '#10b981' : '#f43f5e', letterSpacing: '0.08em' }}>
                                                {fmtPct(coin.price_change_percentage_24h)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ ...monoStyle, fontSize: '0.6rem', color: '#71717a' }}>
                            {loading ? 'Loading trending coins...' : 'No data available'}
                        </div>
                    )}
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer style={{ borderTop: '1px solid rgba(63, 63, 70,0.3)', background: '#09090b' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6">
                        
                        {/* Brand & Tagline */}
                        <div className="text-center sm:text-left flex-1">
                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid rgba(129, 140, 248,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#818cf8', opacity: 0.8 }} />
                                </div>
                                <span style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: '1.2rem', color: '#fafafa', letterSpacing: '0.06em' }}>
                                    CypherSight
                                </span>
                            </div>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.55rem', letterSpacing: '0.12em', color: '#71717a', textTransform: 'uppercase', marginBottom: '16px' }}>
                                A refined crypto portfolio tracker.
                            </p>
                            <p style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: '0.65rem', color: '#52525b', maxWidth: '400px', margin: '0 auto sm:0' }}>
                                Disclaimer: CypherSight is for informational purposes only. The data provided is not financial, legal, or investment advice. Cryptocurrency markets are highly volatile.
                            </p>
                        </div>
                        
                        {/* Links */}
                        <div className="flex flex-wrap justify-center items-center gap-6 flex-1">
                            {isAuthenticated ? (
                                <Link to="/dashboard" style={{ fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a1a1aa', fontFamily: "'DM Mono', monospace", textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fafafa'} onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}>
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" style={{ fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a1a1aa', fontFamily: "'DM Mono', monospace", textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fafafa'} onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}>
                                        Login
                                    </Link>
                                    <Link to="/register" style={{ fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a1a1aa', fontFamily: "'DM Mono', monospace", textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fafafa'} onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}>
                                        Sign Up
                                    </Link>
                                </>
                            )}
                            <Link to="/terms" style={{ fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a1a1aa', fontFamily: "'DM Mono', monospace", textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fafafa'} onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}>
                                Terms
                            </Link>
                            <Link to="/privacy" style={{ fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a1a1aa', fontFamily: "'DM Mono', monospace", textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fafafa'} onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}>
                                Privacy
                            </Link>
                            <Link to="/forgot-password" style={{ fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a1a1aa', fontFamily: "'DM Mono', monospace", textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fafafa'} onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}>
                                Forgot Password
                            </Link>
                            <a href="https://github.com/mohanishp9/crypto_portfolio_tracker" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a1a1aa', fontFamily: "'DM Mono', monospace", textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fafafa'} onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}>
                                GitHub
                            </a>
                        </div>
                        
                        {/* Credits */}
                        <div className="text-center sm:text-right flex-1 mt-4 sm:mt-0">
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.5rem', letterSpacing: '0.1em', color: '#818cf8', textTransform: 'uppercase' }}>
                                Data provided by
                            </p>
                            <a href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '4px', fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#a1a1aa', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#8dc63f'} onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}>
                                CoinGecko
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Keyframe animations */}
            <style>{`
                @keyframes heroFadeIn {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes skeletonPulse {
                    0%, 100% { opacity: 1; }
                    50%      { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
};

// ── Sub-components ─────────────────────────────────────────────

const skeletonBlock: React.CSSProperties = {
    background: 'rgba(63, 63, 70,0.25)',
    borderRadius: 2,
};

interface StatItemProps {
    label: string;
    value: string;
    labelStyle: React.CSSProperties;
    monoStyle: React.CSSProperties;
    className?: string;
}

const StatItem = ({ label, value, labelStyle, monoStyle, className }: StatItemProps) => (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
        <span style={labelStyle}>{label}</span>
        <span style={{ ...monoStyle, color: '#a1a1aa' }}>{value}</span>
    </div>
);

// ── Static data (hoisted outside component per rendering-hoist-jsx) ──

interface Feature {
    icon: LucideIcon;
    title: string;
    description: string;
}

const FEATURES: Feature[] = [
    {
        icon: BarChart3,
        title: 'Portfolio Tracking',
        description: 'Monitor your entire crypto portfolio with real-time valuations and allocation breakdowns.',
    },
    {
        icon: Bell,
        title: 'Price Alerts',
        description: 'Set custom price thresholds and get notified when the market moves in your favour.',
    },
    {
        icon: Eye,
        title: 'Watchlist',
        description: 'Keep an eye on coins you\u2019re considering without adding them to your portfolio.',
    },
    {
        icon: ArrowLeftRight,
        title: 'Transaction History',
        description: 'A full ledger of every buy, sell, and transfer — sortable and searchable.',
    },
    {
        icon: Activity,
        title: 'Live Prices',
        description: 'Market data refreshed automatically so your portfolio value is always current.',
    },
    {
        icon: FolderInput,
        title: 'Import / Export',
        description: 'Bring in existing data or export your portfolio as JSON for backup and analysis.',
    },
];

interface Step {
    title: string;
    description: string;
}

const STEPS: Step[] = [
    {
        title: 'Create an account',
        description: 'Sign up in seconds — just an email and password. No KYC, no friction.',
    },
    {
        title: 'Add your holdings',
        description: 'Log your buys, sells, and transfers or import them from a file.',
    },
    {
        title: 'Track and get alerts',
        description: 'Watch your portfolio grow in real time and set alerts for the prices that matter.',
    },
];

// ── Extracted sub-components (per rerender-no-inline-components) ──

const FeatureCard = ({ feature, index }: { feature: Feature; index: number }) => {
    const Icon = feature.icon;
    return (
        <div
            className="transition-colors duration-200"
            style={{
                background: '#18181b',
                padding: '28px 24px',
                animation: `heroFadeIn 0.5s ease-out ${index * 0.06}s both`,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#343a36')}
            onMouseLeave={e => (e.currentTarget.style.background = '#18181b')}
        >
            <div
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '1px solid rgba(129, 140, 248,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                }}
            >
                <Icon size={16} strokeWidth={1.2} color="#818cf8" />
            </div>
            <h3
                style={{
                    fontFamily: "ui-sans-serif, system-ui, sans-serif",
                    fontSize: '1.05rem',
                    fontWeight: 400,
                    color: '#fafafa',
                    letterSpacing: '0.03em',
                    marginBottom: 8,
                }}
            >
                {feature.title}
            </h3>
            <p
                style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '0.6rem',
                    letterSpacing: '0.06em',
                    color: '#71717a',
                    lineHeight: 1.7,
                }}
            >
                {feature.description}
            </p>
        </div>
    );
};

const StepItem = ({ step, index, isLast }: { step: Step; index: number; isLast: boolean }) => (
    <div
        className="flex gap-6"
        style={{ animation: `heroFadeIn 0.5s ease-out ${index * 0.1}s both` }}
    >
        {/* Number + connector line */}
        <div className="flex flex-col items-center">
            <div
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '1px solid rgba(129, 140, 248,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "ui-sans-serif, system-ui, sans-serif",
                    fontSize: '1rem',
                    fontWeight: 300,
                    color: '#818cf8',
                    flexShrink: 0,
                }}
            >
                {index + 1}
            </div>
            {!isLast && (
                <div
                    style={{
                        width: 1,
                        flex: 1,
                        minHeight: 32,
                        background: 'rgba(63, 63, 70,0.3)',
                    }}
                />
            )}
        </div>

        {/* Content */}
        <div style={{ paddingBottom: isLast ? 0 : 32 }}>
            <h3
                style={{
                    fontFamily: "ui-sans-serif, system-ui, sans-serif",
                    fontSize: '1.15rem',
                    fontWeight: 400,
                    color: '#fafafa',
                    letterSpacing: '0.03em',
                    marginBottom: 6,
                }}
            >
                {step.title}
            </h3>
            <p
                style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '0.6rem',
                    letterSpacing: '0.06em',
                    color: '#71717a',
                    lineHeight: 1.7,
                }}
            >
                {step.description}
            </p>
        </div>
    </div>
);

export default LandingPage;
