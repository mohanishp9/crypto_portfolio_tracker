import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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

const MOCK_COINS: CoinMarket[] = [
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png', current_price: 65000, market_cap: 1200000000000, price_change_percentage_24h: 2.5, market_cap_rank: 1 },
    { id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png', current_price: 3500, market_cap: 400000000000, price_change_percentage_24h: 1.2, market_cap_rank: 2 },
    { id: 'tether', symbol: 'usdt', name: 'Tether', image: 'https://coin-images.coingecko.com/coins/images/325/large/Tether.png', current_price: 1, market_cap: 100000000000, price_change_percentage_24h: 0.01, market_cap_rank: 3 },
    { id: 'binancecoin', symbol: 'bnb', name: 'BNB', image: 'https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', current_price: 600, market_cap: 90000000000, price_change_percentage_24h: -1.5, market_cap_rank: 4 },
    { id: 'solana', symbol: 'sol', name: 'Solana', image: 'https://coin-images.coingecko.com/coins/images/4128/large/solana.png', current_price: 150, market_cap: 70000000000, price_change_percentage_24h: 5.5, market_cap_rank: 5 },
    { id: 'usd-coin', symbol: 'usdc', name: 'USDC', image: 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png', current_price: 1, market_cap: 32000000000, price_change_percentage_24h: -0.01, market_cap_rank: 6 },
    { id: 'ripple', symbol: 'xrp', name: 'XRP', image: 'https://coin-images.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', current_price: 0.6, market_cap: 30000000000, price_change_percentage_24h: 0.5, market_cap_rank: 7 },
    { id: 'steth', symbol: 'steth', name: 'Lido Staked Ether', image: 'https://coin-images.coingecko.com/coins/images/13442/large/steth_logo.png', current_price: 3500, market_cap: 25000000000, price_change_percentage_24h: 1.2, market_cap_rank: 8 },
    { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', image: 'https://coin-images.coingecko.com/coins/images/5/large/dogecoin.png', current_price: 0.15, market_cap: 22000000000, price_change_percentage_24h: 10.2, market_cap_rank: 9 },
    { id: 'toncoin', symbol: 'ton', name: 'Toncoin', image: 'https://coin-images.coingecko.com/coins/images/17980/large/ton_symbol.png', current_price: 6.5, market_cap: 20000000000, price_change_percentage_24h: 3.1, market_cap_rank: 10 }
];

const MOCK_GLOBAL: GlobalData = {
    total_market_cap: 2500000000000,
    total_volume_24h: 100000000000,
    btc_dominance: 52.5
};

const MOCK_CHART = Array.from({ length: 7 * 24 }, (_, i) => ({
    timestamp: Date.now() - (7 * 24 - i) * 3600000,
    price: 60000 + Math.random() * 5000
}));

const MOCK_CHARTS: CoinCharts = {
    bitcoin: MOCK_CHART,
    ethereum: MOCK_CHART.map(p => ({ ...p, price: p.price * 0.05 })),
    solana: MOCK_CHART.map(p => ({ ...p, price: p.price * 0.002 })),
    binancecoin: MOCK_CHART.map(p => ({ ...p, price: p.price * 0.01 })),
    ripple: MOCK_CHART.map(p => ({ ...p, price: p.price * 0.00001 }))
};

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
    } catch (e) {
        // ignore
    }
    return null;
}

function setCachedItem<T>(key: string, data: CacheEntry<T>) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
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
    const [coins, setCoins] = useState<CoinMarket[]>([]);
    const [globalData, setGlobalData] = useState<GlobalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [chartData, setChartData] = useState<CoinCharts>({});
    const [chartLoading, setChartLoading] = useState(true);
    const [activeChartTab, setActiveChartTab] = useState('bitcoin');

    const fetchMarketData = useCallback(async () => {
        let cachedCoins = coinsCache || getCachedItem<CoinMarket[]>('grove_coins');
        let cachedGlobal = globalCache || getCachedItem<GlobalData>('grove_global');

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
                    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false'
                ),
                fetch('https://api.coingecko.com/api/v3/global'),
            ]);

            if (!coinsRes.ok || !globalRes.ok) {
                throw new Error('CoinGecko API returned an error');
            }

            const coinsJson = await coinsRes.json();
            const globalJson = await globalRes.json();

            const parsedCoins: CoinMarket[] = coinsJson.map((c: any) => ({
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
            setCachedItem('grove_coins', coinsCache);
            setCachedItem('grove_global', globalCache);

            setCoins(parsedCoins);
            setGlobalData(parsedGlobal);
        } catch (err) {
            console.warn('Failed to fetch market data, using fallback data', err);
            // Fallback to cache (even if stale) or mock data
            if (cachedCoins && cachedGlobal) {
                setCoins((cachedCoins as CacheEntry<CoinMarket[]>).data);
                setGlobalData((cachedGlobal as CacheEntry<GlobalData>).data);
            } else {
                setCoins(MOCK_COINS);
                setGlobalData(MOCK_GLOBAL);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMarketData();
    }, [fetchMarketData]);

    const fetchChartsData = useCallback(async () => {
        let cachedCharts = chartsCache || getCachedItem<CoinCharts>('grove_charts');
        
        if (isFresh(cachedCharts)) {
            chartsCache = cachedCharts;
            setChartData(cachedCharts.data);
            setChartLoading(false);
            return;
        }
        setChartLoading(true);
        try {
            const responses = await Promise.all(
                CHART_COINS.map(c => fetch(`https://api.coingecko.com/api/v3/coins/${c.id}/market_chart?vs_currency=usd&days=7`))
            );
            
            if (responses.some(r => !r.ok)) {
                throw new Error('CoinGecko API returned an error for chart data');
            }

            const newChartData: CoinCharts = {};
            for (let i = 0; i < CHART_COINS.length; i++) {
                const json = await responses[i].json();
                newChartData[CHART_COINS[i].id] = json.prices.map((p: [number, number]) => ({
                    timestamp: p[0], price: p[1]
                }));
            }
            chartsCache = { data: newChartData, timestamp: Date.now() };
            setCachedItem('grove_charts', chartsCache);
            setChartData(newChartData);
        } catch (err) {
            console.warn('Failed to fetch chart data, using fallback data', err);
            if (cachedCharts) {
                setChartData((cachedCharts as CacheEntry<CoinCharts>).data);
            } else {
                setChartData(MOCK_CHARTS);
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
        color: '#587560',
    };

    const monoStyle: React.CSSProperties = {
        fontFamily: "'DM Mono', monospace",
        fontSize: '0.68rem',
        letterSpacing: '0.08em',
    };

    // ── Render ──────────────────────────────────────────────────

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

            {/* ─── Market Stats Bar ─── */}
            <div
                style={{
                    borderBottom: '1px solid rgba(61,74,62,0.2)',
                    background: 'rgba(42,61,46,0.12)',
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
                            <span style={{ ...monoStyle, color: '#8b5e3c', fontSize: '0.55rem' }}>
                                Market data unavailable
                            </span>
                        ) : globalData ? (
                            <>
                                <StatItem label="Market Cap" value={fmtUsd(globalData.total_market_cap)} labelStyle={labelStyle} monoStyle={monoStyle} />
                                <div style={{ width: 1, height: 16, background: 'rgba(61,74,62,0.3)' }} />
                                <StatItem label="24h Volume" value={fmtUsd(globalData.total_volume_24h)} labelStyle={labelStyle} monoStyle={monoStyle} />
                                <div className="hidden sm:block" style={{ width: 1, height: 16, background: 'rgba(61,74,62,0.3)' }} />
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
                        background: 'radial-gradient(circle, rgba(196,136,90,0.06) 0%, transparent 70%)',
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
            </section>

            {/* ─── Top 10 Coins Section ─── */}
            <section className="relative px-4 pb-20">
                <div className="max-w-5xl mx-auto">

                    {/* Section header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div style={{ width: 24, height: 1, background: 'rgba(196,136,90,0.3)' }} />
                        <h2
                            className="font-light"
                            style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: '1.5rem',
                                color: '#ede8dd',
                                letterSpacing: '0.04em',
                            }}
                        >
                            Top <span style={{ fontStyle: 'italic', color: '#c4885a' }}>10</span> by Market Cap
                        </h2>
                        <div style={{ flex: 1, height: 1, background: 'rgba(61,74,62,0.2)' }} />
                    </div>

                    {/* Error state */}
                    {error && !loading && (
                        <div
                            style={{
                                padding: '16px 20px',
                                background: 'rgba(139,94,60,0.1)',
                                border: '1px solid rgba(139,94,60,0.25)',
                                ...monoStyle,
                                fontSize: '0.6rem',
                                color: '#8b5e3c',
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
                                    border: '1px solid rgba(139,94,60,0.35)',
                                    color: '#c4885a',
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
                        <div style={{ background: '#2e3330', border: '1px solid rgba(61,74,62,0.3)', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(61,74,62,0.3)', background: 'rgba(42,61,46,0.15)' }}>
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
                                                borderBottom: '1px solid rgba(61,74,62,0.15)',
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
                        <div style={{ background: '#2e3330', border: '1px solid rgba(61,74,62,0.3)', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(61,74,62,0.3)', background: 'rgba(42,61,46,0.15)' }}>
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
                                                    borderBottom: '1px solid rgba(61,74,62,0.15)',
                                                    animation: `heroFadeIn 0.5s ease-out ${idx * 0.04}s both`,
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(61,74,62,0.1)')}
                                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                            >
                                                {/* Rank */}
                                                <td style={{ padding: '16px', ...monoStyle, color: '#6b7c6a' }}>
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
                                                                border: '1px solid rgba(61,74,62,0.25)',
                                                                overflow: 'hidden',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                background: '#1a1c1a',
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
                                                                    fontFamily: "'Cormorant Garamond', serif",
                                                                    fontSize: '0.9rem',
                                                                    color: '#ede8dd',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                }}
                                                            >
                                                                {coin.name}
                                                            </span>
                                                            <span style={{ ...labelStyle, fontSize: '0.45rem', color: '#6b7c6a' }}>
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
                                                        color: '#ede8dd',
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
                                                        color: isPositive ? '#6b9a6b' : '#a85c4a',
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
                                                        color: '#9aab97',
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
            <section className="relative px-4 py-20" style={{ borderTop: '1px solid rgba(61,74,62,0.15)' }}>
                <div className="max-w-5xl mx-auto">
                    {/* Section header */}
                    <div className="flex items-center gap-4 mb-10">
                        <div style={{ width: 24, height: 1, background: 'rgba(196,136,90,0.3)' }} />
                        <h2 className="font-light" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', color: '#ede8dd', letterSpacing: '0.04em' }}>
                            Live Market <span style={{ fontStyle: 'italic', color: '#c4885a' }}>Overview</span>
                        </h2>
                        <div style={{ flex: 1, height: 1, background: 'rgba(61,74,62,0.2)' }} />
                    </div>

                    {/* Top Row: 7-day Line Chart */}
                    <div style={{ background: '#2e3330', border: '1px solid rgba(61,74,62,0.3)', padding: '24px', marginBottom: '24px' }}>
                        <div className="flex flex-wrap gap-2 mb-6 border-b border-[rgba(61,74,62,0.3)] pb-4">
                            {CHART_COINS.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setActiveChartTab(c.id)}
                                    style={{
                                        background: activeChartTab === c.id ? 'rgba(61,74,62,0.3)' : 'transparent',
                                        border: `1px solid ${activeChartTab === c.id ? c.color : 'rgba(61,74,62,0.2)'}`,
                                        color: activeChartTab === c.id ? '#ede8dd' : '#9aab97',
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
                        <div style={{ height: 300 }}>
                            {chartLoading ? (
                                <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(61,74,62,0.1)', animation: 'skeletonPulse 1.6s ease-in-out infinite' }}>
                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#6b7c6a' }}>Loading chart...</span>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData[activeChartTab] || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={CHART_COINS.find(c => c.id === activeChartTab)?.color || '#c4885a'} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={CHART_COINS.find(c => c.id === activeChartTab)?.color || '#c4885a'} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="timestamp" tickFormatter={formatAxisDate} tick={{ fill: '#6b7c6a', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} minTickGap={30} />
                                        <YAxis tickFormatter={(val) => `$${val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val}`} tick={{ fill: '#6b7c6a', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                                        <Tooltip 
                                            contentStyle={{ background: '#1a1c1a', border: '1px solid rgba(61,74,62,0.5)', borderRadius: '4px', fontFamily: "'DM Mono', monospace", fontSize: '0.7rem' }}
                                            labelFormatter={(l) => formatTooltipDate(l as number)}
                                            itemStyle={{ color: '#ede8dd' }}
                                            formatter={(val: number) => [fmtPrice(val), 'Price']}
                                        />
                                        <Area type="monotone" dataKey="price" stroke={CHART_COINS.find(c => c.id === activeChartTab)?.color || '#c4885a'} fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} isAnimationActive={true} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Bottom Row: Donut & Bar Charts */}
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Donut Chart: Market Cap */}
                        <div style={{ background: '#2e3330', border: '1px solid rgba(61,74,62,0.3)', padding: '24px', flex: 1 }}>
                            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', color: '#ede8dd', letterSpacing: '0.04em', marginBottom: '16px' }}>Market Cap Distribution</h3>
                            <div style={{ height: 250 }}>
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
                                                innerRadius={60}
                                                outerRadius={90}
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
                                                contentStyle={{ background: '#1a1c1a', border: '1px solid rgba(61,74,62,0.5)', borderRadius: '4px', fontFamily: "'DM Mono', monospace", fontSize: '0.7rem' }}
                                                itemStyle={{ color: '#ede8dd' }}
                                                formatter={(val: number, name: string) => [fmtUsd(val), name.toUpperCase()]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(61,74,62,0.1)', animation: 'skeletonPulse 1.6s ease-in-out infinite' }} />
                                )}
                            </div>
                        </div>

                        {/* Bar Chart: 24h Performance */}
                        <div style={{ background: '#2e3330', border: '1px solid rgba(61,74,62,0.3)', padding: '24px', flex: 1 }}>
                            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', color: '#ede8dd', letterSpacing: '0.04em', marginBottom: '16px' }}>24h Performance</h3>
                            <div style={{ height: 250 }}>
                                {!loading && coins.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart layout="vertical" data={coins} margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                                            <XAxis type="number" hide domain={['dataMin - 2', 'dataMax + 2']} />
                                            <YAxis type="category" dataKey="symbol" tickFormatter={(val) => val.toUpperCase()} tick={{ fill: '#6b7c6a', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} width={40} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(61,74,62,0.2)' }}
                                                contentStyle={{ background: '#1a1c1a', border: '1px solid rgba(61,74,62,0.5)', borderRadius: '4px', fontFamily: "'DM Mono', monospace", fontSize: '0.7rem' }}
                                                formatter={(val: number) => [fmtPct(val), '24h Change']}
                                            />
                                            <Bar dataKey="price_change_percentage_24h" radius={[0, 4, 4, 0]} isAnimationActive={true} barSize={12}>
                                                {coins.map((coin, index) => (
                                                    <Cell key={`cell-${index}`} fill={coin.price_change_percentage_24h >= 0 ? '#6b9a6b' : '#a85c4a'} />
                                                ))}
                                                <LabelList 
                                                    dataKey="price_change_percentage_24h" 
                                                    position="right" 
                                                    formatter={(val: any) => fmtPct(Number(val))} 
                                                    style={{ fill: '#9aab97', fontSize: 9, fontFamily: "'DM Mono', monospace" }}
                                                />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(61,74,62,0.1)', animation: 'skeletonPulse 1.6s ease-in-out infinite' }} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Features Section ─── */}
            <section className="relative px-4 py-20" style={{ borderTop: '1px solid rgba(61,74,62,0.15)' }}>
                <div className="max-w-5xl mx-auto">

                    {/* Section header */}
                    <div className="flex items-center gap-4 mb-4">
                        <div style={{ width: 24, height: 1, background: 'rgba(196,136,90,0.3)' }} />
                        <span style={{ fontSize: '0.5rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: '#587560' }}>
                            What you get
                        </span>
                    </div>
                    <h2
                        className="font-light mb-12"
                        style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                            color: '#ede8dd',
                            letterSpacing: '0.04em',
                        }}
                    >
                        Everything to <span style={{ fontStyle: 'italic', color: '#c4885a' }}>grow</span> your portfolio
                    </h2>

                    {/* Feature cards grid */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '1px',
                            background: 'rgba(61,74,62,0.15)',
                        }}
                    >
                        {FEATURES.map((feat, idx) => (
                            <FeatureCard key={feat.title} feature={feat} index={idx} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── How It Works Section ─── */}
            <section className="relative px-4 py-20" style={{ borderTop: '1px solid rgba(61,74,62,0.15)' }}>
                <div className="max-w-3xl mx-auto">

                    {/* Section header */}
                    <div className="text-center mb-14">
                        <span
                            style={{
                                display: 'inline-block',
                                padding: '6px 16px',
                                border: '1px solid rgba(61,74,62,0.35)',
                                background: 'rgba(42,61,46,0.25)',
                                fontSize: '0.5rem',
                                letterSpacing: '0.35em',
                                textTransform: 'uppercase',
                                color: '#587560',
                                marginBottom: '16px',
                            }}
                        >
                            How it works
                        </span>
                        <h2
                            className="font-light"
                            style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                                color: '#ede8dd',
                                letterSpacing: '0.04em',
                            }}
                        >
                            Three steps to <span style={{ fontStyle: 'italic', color: '#c4885a' }}>clarity</span>
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
                            to="/register"
                            id="how-it-works-cta"
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
                            Start Tracking Free
                        </Link>

                        <div className="mt-10" style={{ width: 40, height: 1, background: 'rgba(196,136,90,0.25)' }} />
                        <p
                            className="mt-4"
                            style={{
                                fontSize: '0.5rem',
                                letterSpacing: '0.4em',
                                textTransform: 'uppercase',
                                color: '#3d4a3e',
                            }}
                        >
                            Free to use · No credit card required
                        </p>
                    </div>
                </div>
            </section>

            {/* ─── Trending Coins Section ─── */}
            <section className="relative px-4 py-20" style={{ borderTop: '1px solid rgba(61,74,62,0.15)' }}>
                <div className="max-w-5xl mx-auto">
                    {/* Section header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div style={{ width: 24, height: 1, background: 'rgba(196,136,90,0.3)' }} />
                        <h2
                            className="font-light"
                            style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: '1.5rem',
                                color: '#ede8dd',
                                letterSpacing: '0.04em',
                            }}
                        >
                            Trending <span style={{ fontStyle: 'italic', color: '#c4885a' }}>Movers</span>
                        </h2>
                        <div style={{ flex: 1, height: 1, background: 'rgba(61,74,62,0.2)' }} />
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
                                            background: '#2e3330',
                                            border: '1px solid rgba(61,74,62,0.3)',
                                            padding: '16px',
                                            cursor: 'default',
                                            animation: `heroFadeIn 0.5s ease-out ${idx * 0.05}s both`,
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#343a36')}
                                        onMouseLeave={e => (e.currentTarget.style.background = '#2e3330')}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: '50%',
                                                    border: '1px solid rgba(61,74,62,0.3)',
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: '#1a1c1a',
                                                }}
                                            >
                                                <img src={coin.image} alt={coin.name} width={16} height={16} loading="lazy" style={{ borderRadius: '50%' }} />
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ ...monoStyle, fontSize: '0.68rem', color: '#ede8dd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {coin.name}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', fontWeight: 300, color: '#ede8dd', letterSpacing: '0.02em', marginBottom: 8 }}>
                                            {fmtPrice(coin.current_price)}
                                        </div>
                                        <div style={{ display: 'inline-block', padding: '2px 6px', background: isPositive ? 'rgba(107,154,107,0.1)' : 'rgba(168,92,74,0.1)', border: `1px solid ${isPositive ? 'rgba(107,154,107,0.2)' : 'rgba(168,92,74,0.2)'}`, borderRadius: '2px' }}>
                                            <span style={{ ...monoStyle, fontSize: '0.55rem', color: isPositive ? '#6b9a6b' : '#a85c4a', letterSpacing: '0.08em' }}>
                                                {fmtPct(coin.price_change_percentage_24h)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ ...monoStyle, fontSize: '0.6rem', color: '#6b7c6a' }}>
                            {loading ? 'Loading trending coins...' : 'No data available'}
                        </div>
                    )}
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer style={{ borderTop: '1px solid rgba(61,74,62,0.3)', background: '#1a1c1a' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6">
                        
                        {/* Brand & Tagline */}
                        <div className="text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid rgba(196,136,90,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#c4885a', opacity: 0.8 }} />
                                </div>
                                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', color: '#ede8dd', letterSpacing: '0.06em' }}>
                                    Grove
                                </span>
                            </div>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.55rem', letterSpacing: '0.12em', color: '#6b7c6a', textTransform: 'uppercase' }}>
                                A refined crypto portfolio tracker.
                            </p>
                        </div>
                        
                        {/* Links */}
                        <div className="flex items-center gap-6">
                            <Link to="/login" style={{ fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9aab97', fontFamily: "'DM Mono', monospace", textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ede8dd'} onMouseLeave={e => e.currentTarget.style.color = '#9aab97'}>
                                Login
                            </Link>
                            <Link to="/register" style={{ fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9aab97', fontFamily: "'DM Mono', monospace", textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ede8dd'} onMouseLeave={e => e.currentTarget.style.color = '#9aab97'}>
                                Sign Up
                            </Link>
                            <a href="https://github.com/mohanishp9/crypto_portfolio_tracker" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9aab97', fontFamily: "'DM Mono', monospace", textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ede8dd'} onMouseLeave={e => e.currentTarget.style.color = '#9aab97'}>
                                GitHub
                            </a>
                        </div>
                        
                        {/* Credits */}
                        <div className="text-center sm:text-right mt-2 sm:mt-0">
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.5rem', letterSpacing: '0.1em', color: '#587560', textTransform: 'uppercase' }}>
                                Data provided by
                            </p>
                            <a href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '4px', fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#9aab97', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#8dc63f'} onMouseLeave={e => e.currentTarget.style.color = '#9aab97'}>
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
    background: 'rgba(61,74,62,0.25)',
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
        <span style={{ ...monoStyle, color: '#9aab97' }}>{value}</span>
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
                background: '#2e3330',
                padding: '28px 24px',
                animation: `heroFadeIn 0.5s ease-out ${index * 0.06}s both`,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#343a36')}
            onMouseLeave={e => (e.currentTarget.style.background = '#2e3330')}
        >
            <div
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '1px solid rgba(196,136,90,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                }}
            >
                <Icon size={16} strokeWidth={1.2} color="#c4885a" />
            </div>
            <h3
                style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '1.05rem',
                    fontWeight: 400,
                    color: '#ede8dd',
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
                    color: '#6b7c6a',
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
                    border: '1px solid rgba(196,136,90,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '1rem',
                    fontWeight: 300,
                    color: '#c4885a',
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
                        background: 'rgba(61,74,62,0.3)',
                    }}
                />
            )}
        </div>

        {/* Content */}
        <div style={{ paddingBottom: isLast ? 0 : 32 }}>
            <h3
                style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '1.15rem',
                    fontWeight: 400,
                    color: '#ede8dd',
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
                    color: '#6b7c6a',
                    lineHeight: 1.7,
                }}
            >
                {step.description}
            </p>
        </div>
    </div>
);

export default LandingPage;
