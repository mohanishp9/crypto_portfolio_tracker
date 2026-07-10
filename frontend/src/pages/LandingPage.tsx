import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { BarChart3, Bell, Eye, ArrowLeftRight, Activity, FolderInput } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LabelList } from 'recharts';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

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

// ── Module-level cache ──

const CACHE_TTL = 5 * 60 * 1000;

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
            if (Date.now() - parsed.timestamp < CACHE_TTL) return parsed;
        }
    } catch { /* ignore */ }
    return null;
}

function setCachedItem<T>(key: string, data: CacheEntry<T>) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
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
                fetch(`${import.meta.env.VITE_API_URL}/market/top?limit=10`),
                fetch(`${import.meta.env.VITE_API_URL}/market/global`),
            ]);

            if (!coinsRes.ok || !globalRes.ok) throw new Error('Backend API returned an error for market data');

            const coinsJson = await coinsRes.json();
            const globalJson = await globalRes.json();

            const coinsArray = coinsJson.coins || coinsJson;
            const parsedCoins: CoinMarket[] = coinsArray.map((c: Record<string, unknown>) => ({
                id: c.id, symbol: c.symbol, name: c.name, image: c.image,
                current_price: c.current_price ?? 0, market_cap: c.market_cap ?? 0,
                price_change_percentage_24h: c.price_change_percentage_24h ?? 0,
                market_cap_rank: c.market_cap_rank ?? 0,
            }));

            const parsedGlobal: GlobalData = {
                total_market_cap: globalJson.data?.total_market_cap?.usd ?? 0,
                total_volume_24h: globalJson.data?.total_volume?.usd ?? 0,
                btc_dominance: globalJson.data?.market_cap_percentage?.btc ?? 0,
            };

            const now = Date.now();
            coinsCache = { data: parsedCoins, timestamp: now };
            globalCache = { data: parsedGlobal, timestamp: now };
            setCachedItem('cyphersight_coins', coinsCache);
            setCachedItem('cyphersight_global', globalCache);

            setCoins(parsedCoins);
            setGlobalData(parsedGlobal);
        } catch (err) {
            console.warn('Failed to fetch market data, using fallback data', err);
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

    useEffect(() => { fetchMarketData(); }, [fetchMarketData]);

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

            if (responses.some(r => !r.ok)) throw new Error('Backend API returned an error for chart data');

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

    useEffect(() => { fetchChartsData(); }, [fetchChartsData]);

    // ── Render ──────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-surface-primary text-text-primary">

            {/* ─── Navbar ─── */}
            <nav className="sticky top-0 z-50 bg-surface-primary/95 border-b border-border-primary ">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity no-underline">
                            <div className="w-7 h-7 rounded-md bg-accent-subtle border border-accent/20 flex items-center justify-center">
                                <Activity className="text-accent" size={16} />
                            </div>
                            <span className="text-lg font-semibold text-text-primary tracking-tight">
                                CypherSight
                            </span>
                        </Link>

                        {/* Nav actions */}
                        <div className="flex items-center gap-3">
                            {isAuthenticated ? (
                                <Link to="/dashboard">
                                    <Button variant="primary" size="sm">Dashboard</Button>
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login">
                                        <Button variant="ghost" size="sm">Sign in</Button>
                                    </Link>
                                    <Link to="/register">
                                        <Button variant="primary" size="sm">Get started</Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* ─── Market Stats Bar ─── */}
            <div className="border-b border-border-primary bg-surface-secondary">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center gap-6 sm:gap-10 py-2.5 overflow-x-auto">
                        {loading ? (
                            <>
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-14 h-2.5 rounded-sm bg-surface-tertiary animate-pulse" />
                                        <div className="w-20 h-3 rounded-sm bg-surface-tertiary animate-pulse" />
                                    </div>
                                ))}
                            </>
                        ) : error ? (
                            <span className="text-xs text-negative font-medium">
                                Market data unavailable
                            </span>
                        ) : globalData ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-text-secondary">Market cap</span>
                                    <span className="font-mono text-sm text-text-secondary">{fmtUsd(globalData.total_market_cap)}</span>
                                </div>
                                <div className="w-px h-4 bg-border-primary" />
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-text-secondary">24h volume</span>
                                    <span className="font-mono text-sm text-text-secondary">{fmtUsd(globalData.total_volume_24h)}</span>
                                </div>
                                <div className="hidden sm:block w-px h-4 bg-border-primary" />
                                <div className="hidden sm:flex items-center gap-2">
                                    <span className="text-xs font-medium text-text-secondary">BTC dominance</span>
                                    <span className="font-mono text-sm text-text-secondary">{globalData.btc_dominance.toFixed(1)}%</span>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* ─── Hero ─── */}
            <section className="flex flex-col items-center justify-center px-4 py-20 sm:py-28">
                {/* Brand mark */}
                <div className="mb-8 flex items-center justify-center animate-fade-in">
                    <div className="w-16 h-16 rounded-md bg-accent-subtle border border-accent/20 flex items-center justify-center">
                        <Activity className="text-accent" size={28} />
                    </div>
                </div>

                {/* Headline */}
                <h1 className="font-bold text-center text-3xl sm:text-4xl text-text-primary tracking-tight max-w-2xl leading-tight animate-fade-in">
                    Track your{' '}
                    <span className="text-accent italic">crypto</span>
                    <br />
                    portfolio with clarity
                </h1>

                {/* Subheadline */}
                <p className="text-center mt-5 text-sm text-text-secondary max-w-lg leading-relaxed animate-fade-in">
                    Monitor holdings, track real-time prices, and watch your digital assets grow — all in one quiet, refined space.
                </p>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row items-center gap-3 mt-10 animate-fade-in">
                    {isAuthenticated ? (
                        <Link to="/dashboard">
                            <Button variant="primary" size="md">Go to dashboard</Button>
                        </Link>
                    ) : (
                        <>
                            <Link to="/register" id="hero-cta-register">
                                <Button variant="primary" size="md">Get started</Button>
                            </Link>
                            <Link to="/login" id="hero-cta-login">
                                <Button variant="secondary" size="md">Sign in</Button>
                            </Link>
                        </>
                    )}
                </div>
            </section>

            {/* ─── Top 10 Coins Table ─── */}
            <section className="px-4 pb-20">
                <div className="max-w-5xl mx-auto">
                    {/* Section header */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-text-primary tracking-tight">
                            Top <span className="text-accent">10</span> by market cap
                        </h2>
                        <p className="text-sm text-text-secondary mt-1">Leading cryptocurrencies ranked by market capitalization</p>
                    </div>

                    {/* Error */}
                    {error && !loading && (
                        <Card elevation="raised" className="mb-6">
                            <div className="p-4 text-center">
                                <p className="text-sm text-negative mb-3">{error}</p>
                                <button onClick={fetchMarketData}>
                                    <Button variant="secondary" size="sm">Retry</Button>
                                </button>
                            </div>
                        </Card>
                    )}

                    {/* Loading skeleton */}
                    {loading && (
                        <Card elevation="raised" className="overflow-x-auto custom-scrollbar">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-border-primary bg-surface-tertiary/50">
                                        <th className="px-4 py-3 text-xs font-medium text-text-secondary text-left w-16">#</th>
                                        <th className="px-4 py-3 text-xs font-medium text-text-secondary text-left">Name</th>
                                        <th className="px-4 py-3 text-xs font-medium text-text-secondary text-right">Price</th>
                                        <th className="px-4 py-3 text-xs font-medium text-text-secondary text-right">24h change</th>
                                        <th className="px-4 py-3 text-xs font-medium text-text-secondary text-right">Market cap</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-primary">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.08}s` }}>
                                            <td className="px-4 py-4"><div className="w-5 h-3 rounded-sm bg-surface-tertiary" /></td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-surface-tertiary" />
                                                    <div className="w-20 h-3 rounded-sm bg-surface-tertiary" />
                                                </div>
                                            </td>
                                            <td className="px-4 py-4"><div className="w-16 h-3 rounded-sm bg-surface-tertiary ml-auto" /></td>
                                            <td className="px-4 py-4"><div className="w-12 h-3 rounded-sm bg-surface-tertiary ml-auto" /></td>
                                            <td className="px-4 py-4"><div className="w-20 h-3 rounded-sm bg-surface-tertiary ml-auto" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    )}

                    {/* Coin table */}
                    {!loading && !error && coins.length > 0 && (
                        <Card elevation="raised" className="overflow-x-auto custom-scrollbar">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-border-primary bg-surface-tertiary/50">
                                        <th className="px-4 py-3 text-xs font-medium text-text-secondary text-left w-16">#</th>
                                        <th className="px-4 py-3 text-xs font-medium text-text-secondary text-left">Name</th>
                                        <th className="px-4 py-3 text-xs font-medium text-text-secondary text-right">Price</th>
                                        <th className="px-4 py-3 text-xs font-medium text-text-secondary text-right">24h change</th>
                                        <th className="px-4 py-3 text-xs font-medium text-text-secondary text-right">Market cap</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-primary">
                                    {coins.map((coin, idx) => {
                                        const isPositive = coin.price_change_percentage_24h >= 0;
                                        return (
                                            <tr
                                                key={coin.id}
                                                className="transition-colors duration-150 hover:bg-surface-tertiary"
                                                style={{ animation: `heroFadeIn 0.5s ease-out ${idx * 0.04}s both` }}
                                            >
                                                <td className="px-4 py-4 font-mono text-sm text-text-secondary tabular-nums">
                                                    {coin.market_cap_rank}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded-full border border-border-primary bg-surface-primary flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            <img src={coin.image} alt={coin.name} width={16} height={16} loading="lazy" />
                                                        </div>
                                                        <div className="flex items-baseline gap-2 min-w-0">
                                                            <span className="text-sm text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                                                                {coin.name}
                                                            </span>
                                                            <span className="text-xs text-text-tertiary font-mono">
                                                                {coin.symbol.toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right font-mono text-sm text-text-primary tabular-nums">
                                                    {fmtPrice(coin.current_price)}
                                                </td>
                                                <td className={`px-4 py-4 text-right font-mono text-sm tabular-nums ${isPositive ? 'text-positive' : 'text-negative'}`}>
                                                    {fmtPct(coin.price_change_percentage_24h)}
                                                </td>
                                                <td className="px-4 py-4 text-right font-mono text-sm text-text-secondary tabular-nums">
                                                    {fmtUsd(coin.market_cap)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Card>
                    )}
                </div>
            </section>

            {/* ─── Live Market Charts ─── */}
            <section className="border-t border-border-primary px-4 py-20">
                <div className="max-w-5xl mx-auto">
                    {/* Section header */}
                    <div className="mb-10">
                        <h2 className="text-xl font-semibold text-text-primary tracking-tight">
                            Live market <span className="text-accent">overview</span>
                        </h2>
                        <p className="text-sm text-text-secondary mt-1">7-day price trends for the top 5 cryptocurrencies</p>
                    </div>

                    {/* 7-day Area Chart */}
                    <Card elevation="raised" className="p-6 mb-6">
                        <div className="flex flex-wrap gap-2 mb-6 border-b border-border-primary pb-4">
                            {CHART_COINS.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setActiveChartTab(c.id)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono transition-all duration-150 ${
                                        activeChartTab === c.id
                                            ? 'bg-surface-tertiary border border-border-secondary text-text-primary'
                                            : 'bg-transparent border border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-tertiary'
                                    }`}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                                    {c.symbol}
                                </button>
                            ))}
                        </div>
                        <div className="h-[300px] overflow-x-auto custom-scrollbar">
                            {chartLoading ? (
                                <div className="w-full h-full flex items-center justify-center bg-surface-tertiary rounded-sm animate-pulse">
                                    <span className="text-sm text-text-tertiary">Loading chart data...</span>
                                </div>
                            ) : (
                                <div className="min-w-[600px] h-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData[activeChartTab] || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={CHART_COINS.find(c => c.id === activeChartTab)?.color || '#4263eb'} stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor={CHART_COINS.find(c => c.id === activeChartTab)?.color || '#4263eb'} stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="timestamp" tickFormatter={formatAxisDate} tick={{ fill: '#868e96', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={30} />
                                            <YAxis tickFormatter={(val) => `$${val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val}`} tick={{ fill: '#868e96', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                                            <Tooltip
                                                contentStyle={{ background: 'var(--surface-primary)', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '0.8rem' }}
                                                labelFormatter={(l) => formatTooltipDate(l as number)}
                                                itemStyle={{ color: 'var(--text-primary)' }}
                                                formatter={(val: number) => [fmtPrice(val), 'Price']}
                                            />
                                            <Area type="monotone" dataKey="price" stroke={CHART_COINS.find(c => c.id === activeChartTab)?.color || '#4263eb'} fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} isAnimationActive={true} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Donut + Bar Charts */}
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Donut */}
                        <Card elevation="raised" className="p-6 flex-1">
                            <h3 className="text-base font-semibold text-text-primary mb-4">Market cap distribution</h3>
                            <div className="flex items-center justify-center h-[250px]">
                                {!loading && coins.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={coins.map(coin => ({ ...coin, value: coin.market_cap }))}
                                                dataKey="value"
                                                nameKey="symbol"
                                                cx="50%" cy="50%"
                                                innerRadius={50} outerRadius={80}
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
                                                contentStyle={{ background: 'var(--surface-primary)', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '0.8rem' }}
                                                itemStyle={{ color: 'var(--text-primary)' }}
                                                formatter={(val: number, name: string) => [fmtUsd(val), name.toUpperCase()]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full rounded-sm bg-surface-tertiary animate-pulse" />
                                )}
                            </div>
                        </Card>

                        {/* Bar */}
                        <Card elevation="raised" className="p-6 flex-1">
                            <h3 className="text-base font-semibold text-text-primary mb-4">24h performance</h3>
                            <div className="h-[250px]">
                                {!loading && coins.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart layout="vertical" data={coins} margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                                            <XAxis type="number" hide domain={['dataMin - 2', 'dataMax + 2']} />
                                            <YAxis type="category" dataKey="symbol" tickFormatter={(val) => val.toUpperCase()} tick={{ fill: '#868e96', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                                            <Tooltip
                                                cursor={{ fill: 'var(--surface-tertiary)' }}
                                                contentStyle={{ background: 'var(--surface-primary)', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '0.8rem' }}
                                                formatter={(val: number) => [fmtPct(val), '24h Change']}
                                            />
                                            <Bar dataKey="price_change_percentage_24h" radius={[0, 4, 4, 0]} isAnimationActive={true} barSize={12}>
                                                {coins.map((coin, index) => (
                                                    <Cell key={`cell-${index}`} fill={coin.price_change_percentage_24h >= 0 ? '#2b8a3e' : '#c92a2a'} />
                                                ))}
                                                <LabelList
                                                    dataKey="price_change_percentage_24h"
                                                    position="right"
                                                    formatter={(val: unknown) => fmtPct(Number(val))}
                                                    style={{ fill: 'var(--color-text-tertiary)', fontSize: 10 }}
                                                />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full rounded-sm bg-surface-tertiary animate-pulse" />
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </section>

            {/* ─── Features ─── */}
            <section className="border-t border-border-primary px-4 py-20">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-4">
                        <span className="text-xs font-medium text-text-secondary">What you get</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-text-primary tracking-tight mb-12">
                        Everything to <span className="text-accent">grow</span> your portfolio
                    </h2>

                    {/* Feature cards */}
                    <div className="grid gap-px bg-border-primary" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                        {FEATURES.map((feat, idx) => (
                            <FeatureCard key={feat.title} feature={feat} index={idx} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── How It Works ─── */}
            <section className="border-t border-border-primary px-4 py-20">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-14">
                        <span className="inline-block text-xs font-medium text-text-secondary mb-3">
                            How it works
                        </span>
                        <h2 className="text-2xl font-semibold text-text-primary tracking-tight">
                            Three steps to <span className="text-accent">clarity</span>
                        </h2>
                    </div>

                    <div className="flex flex-col gap-0">
                        {STEPS.map((step, idx) => (
                            <StepItem key={step.title} step={step} index={idx} isLast={idx === STEPS.length - 1} />
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="flex flex-col items-center mt-14">
                        <Link to={isAuthenticated ? "/dashboard" : "/register"} id="how-it-works-cta">
                            <Button variant="primary" size="md">
                                {isAuthenticated ? "Go to dashboard" : "Start tracking free"}
                            </Button>
                        </Link>
                        <div className="mt-10 w-10 h-px bg-accent/25" />
                        <p className="mt-4 text-xs text-text-tertiary">
                            Free to use · No credit card required
                        </p>
                    </div>
                </div>
            </section>

            {/* ─── Trending Movers ─── */}
            <section className="border-t border-border-primary px-4 py-20">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-text-primary tracking-tight">
                            Trending <span className="text-accent">movers</span>
                        </h2>
                        <p className="text-sm text-text-secondary mt-1">Coins with the strongest 24h momentum</p>
                    </div>

                    {!loading && !error && coins.length > 0 ? (
                        <div className="flex overflow-x-auto gap-4 pb-4 sm:grid sm:grid-cols-5 sm:overflow-visible sm:pb-0 [scrollbar-width:none]">
                            {[...coins].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 5).map((coin, idx) => {
                                const isPositive = coin.price_change_percentage_24h >= 0;
                                return (
                                    <Card
                                        key={coin.id}
                                        elevation="raised"
                                        className="flex-shrink-0 w-48 sm:w-auto p-4 transition-colors duration-150 hover:bg-surface-tertiary cursor-default"
                                        style={{ animation: `heroFadeIn 0.5s ease-out ${idx * 0.05}s both` }}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-7 h-7 rounded-full border border-border-primary bg-surface-primary flex items-center justify-center overflow-hidden flex-shrink-0">
                                                <img src={coin.image} alt={coin.name} width={16} height={16} loading="lazy" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                                                    {coin.name}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-lg font-semibold text-text-primary mb-2">
                                            {fmtPrice(coin.current_price)}
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-mono border ${
                                            isPositive
                                                ? 'text-positive bg-positive-subtle border-positive/20'
                                                : 'text-negative bg-negative-subtle border-negative/20'
                                        }`}>
                                            {fmtPct(coin.price_change_percentage_24h)}
                                        </span>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-text-tertiary">
                            {loading ? 'Loading trending coins...' : 'No data available'}
                        </p>
                    )}
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="border-t border-border-primary bg-surface-secondary">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6">
                        {/* Brand */}
                        <div className="text-center sm:text-left flex-1">
                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                <Activity className="text-accent" size={16} />
                                <span className="text-lg font-semibold text-text-primary">CypherSight</span>
                            </div>
                            <p className="text-xs text-text-secondary mb-4">
                                A refined crypto portfolio tracker
                            </p>
                            <p className="text-xs text-text-tertiary max-w-sm mx-auto sm:mx-0">
                                Disclaimer: CypherSight is for informational purposes only. The data provided is not financial, legal, or investment advice. Cryptocurrency markets are highly volatile.
                            </p>
                        </div>

                        {/* Links */}
                        <div className="flex flex-wrap justify-center items-center gap-4 flex-1">
                            {isAuthenticated ? (
                                <Link to="/dashboard" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                                        Sign in
                                    </Link>
                                    <Link to="/register" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                                        Sign up
                                    </Link>
                                </>
                            )}
                            <Link to="/terms" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                                Terms
                            </Link>
                            <Link to="/privacy" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                                Privacy
                            </Link>
                            <Link to="/forgot-password" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                                Forgot password
                            </Link>
                            <a href="https://github.com/mohanishp9/crypto_portfolio_tracker" target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                                GitHub
                            </a>
                        </div>

                        {/* Credits */}
                        <div className="text-center sm:text-right flex-1 mt-4 sm:mt-0">
                            <p className="text-xs text-text-tertiary">
                                Data provided by
                            </p>
                            <a href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer" className="inline-block mt-1 text-sm text-text-secondary hover:text-positive transition-colors">
                                CoinGecko
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Keyframe — heroFadeIn for staggered card/row entrances */}
            <style>{`
                @keyframes heroFadeIn {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

// ── Sub-components ─────────────────────────────────────────────

interface Feature {
    icon: LucideIcon;
    title: string;
    description: string;
}

const FEATURES: Feature[] = [
    { icon: BarChart3, title: 'Portfolio tracking', description: 'Monitor your entire crypto portfolio with real-time valuations and allocation breakdowns.' },
    { icon: Bell, title: 'Price alerts', description: 'Set custom price thresholds and get notified when the market moves in your favour.' },
    { icon: Eye, title: 'Watchlist', description: 'Keep an eye on coins you’re considering without adding them to your portfolio.' },
    { icon: ArrowLeftRight, title: 'Transaction history', description: 'A full ledger of every buy, sell, and transfer — sortable and searchable.' },
    { icon: Activity, title: 'Live prices', description: 'Market data refreshed automatically so your portfolio value is always current.' },
    { icon: FolderInput, title: 'Import / export', description: 'Bring in existing data or export your portfolio as JSON for backup and analysis.' },
];

interface Step {
    title: string;
    description: string;
}

const STEPS: Step[] = [
    { title: 'Create an account', description: 'Sign up in seconds — just an email and password. No KYC, no friction.' },
    { title: 'Add your holdings', description: 'Log your buys, sells, and transfers or import them from a file.' },
    { title: 'Track and get alerts', description: 'Watch your portfolio grow in real time and set alerts for the prices that matter.' },
];

const FeatureCard = ({ feature, index }: { feature: Feature; index: number }) => {
    const Icon = feature.icon;
    return (
        <Card
            elevation="raised"
            className="p-6 transition-colors duration-150 hover:bg-surface-tertiary"
            style={{ animation: `heroFadeIn 0.5s ease-out ${index * 0.06}s both` }}
        >
            <div className="w-9 h-9 rounded-full bg-accent-subtle border border-accent/20 flex items-center justify-center mb-4">
                <Icon size={16} strokeWidth={1.2} className="text-accent" />
            </div>
            <h3 className="text-base font-medium text-text-primary mb-2">
                {feature.title}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
                {feature.description}
            </p>
        </Card>
    );
};

const StepItem = ({ step, index, isLast }: { step: Step; index: number; isLast: boolean }) => (
    <div
        className="flex gap-6"
        style={{ animation: `heroFadeIn 0.5s ease-out ${index * 0.1}s both` }}
    >
        {/* Number + connector line */}
        <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-full border border-accent/30 flex items-center justify-center text-base font-light text-accent flex-shrink-0">
                {index + 1}
            </div>
            {!isLast && (
                <div className="w-px flex-1 min-h-8 bg-border-primary" />
            )}
        </div>

        {/* Content */}
        <div className={isLast ? 'pb-0' : 'pb-8'}>
            <h3 className="text-lg font-medium text-text-primary mb-1.5">
                {step.title}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
                {step.description}
            </p>
        </div>
    </div>
);

export default LandingPage;