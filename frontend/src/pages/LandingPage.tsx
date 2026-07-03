import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { ArrowRight, Terminal, BarChart2, Shield, Zap, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

// ── Mock Data (Fallback) ───────────────────────────────────────

const MOCK_COINS: CoinMarket[] = [
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png', current_price: 65000, market_cap: 1200000000000, price_change_percentage_24h: 2.5, market_cap_rank: 1 },
    { id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png', current_price: 3500, market_cap: 400000000000, price_change_percentage_24h: -1.2, market_cap_rank: 2 },
    { id: 'tether', symbol: 'usdt', name: 'Tether', image: 'https://coin-images.coingecko.com/coins/images/325/large/Tether.png', current_price: 1, market_cap: 100000000000, price_change_percentage_24h: 0.01, market_cap_rank: 3 },
    { id: 'binancecoin', symbol: 'bnb', name: 'BNB', image: 'https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', current_price: 600, market_cap: 90000000000, price_change_percentage_24h: 5.5, market_cap_rank: 4 },
    { id: 'solana', symbol: 'sol', name: 'Solana', image: 'https://coin-images.coingecko.com/coins/images/4128/large/solana.png', current_price: 150, market_cap: 70000000000, price_change_percentage_24h: -3.5, market_cap_rank: 5 }
];

const MOCK_GLOBAL: GlobalData = {
    total_market_cap: 2500000000000,
    total_volume_24h: 100000000000,
    btc_dominance: 52.5
};

interface ChartData { timestamp: number; price: number; }
type CoinCharts = Record<string, ChartData[]>;

const CHART_COINS = [
    { id: 'bitcoin', symbol: 'BTC', color: '#F7931A' },
    { id: 'ethereum', symbol: 'ETH', color: '#627EEA' },
    { id: 'tether', symbol: 'USDT', color: '#26A17B' },
    { id: 'binancecoin', symbol: 'BNB', color: '#F3BA2F' },
    { id: 'solana', symbol: 'SOL', color: '#14F195' },
    { id: 'ripple', symbol: 'XRP', color: '#23292F' },
    { id: 'dogecoin', symbol: 'DOGE', color: '#C2A633' },
    { id: 'cardano', symbol: 'ADA', color: '#0033AD' },
    { id: 'avalanche-2', symbol: 'AVAX', color: '#E84142' },
    { id: 'chainlink', symbol: 'LINK', color: '#2A5ADA' },
];

const MOCK_CHART = Array.from({ length: 7 * 24 }, (_, i) => ({
    timestamp: Date.now() - (7 * 24 - i) * 3600000,
    price: 60000 + Math.random() * 5000
}));

const MOCK_CHARTS: CoinCharts = CHART_COINS.reduce((acc, coin, idx) => {
    // Generate a mock chart based on the index to have some visual variance
    acc[coin.id] = MOCK_CHART.map(p => ({ ...p, price: p.price * (1 / Math.pow(10, idx)) }));
    return acc;
}, {} as CoinCharts);

// ── Formatters ─────────────────────────────────────────────────

const fmtUsd = (n: number): string => {
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
};

const fmtPrice = (n: number): string =>
    n >= 1 ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;

const fmtPct = (n: number): string => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

const formatAxisDate = (ts: number) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const formatTooltipDate = (ts: number) => new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// ── Component ──────────────────────────────────────────────────

const LandingPage = () => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [coins, setCoins] = useState<CoinMarket[]>([]);
    const [globalData, setGlobalData] = useState<GlobalData | null>(null);
    const [chartData, setChartData] = useState<CoinCharts>({});
    const [chartLoading, setChartLoading] = useState(true);
    const [activeChartTab, setActiveChartTab] = useState('bitcoin');

    const fetchMarketData = useCallback(async () => {
        try {
            const [coinsRes, globalRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/market/top?limit=10`),
                fetch(`${import.meta.env.VITE_API_URL}/market/global`),
            ]);

            if (!coinsRes.ok || !globalRes.ok) throw new Error('API Error');

            const coinsJson = await coinsRes.json();
            const globalJson = await globalRes.json();

            setCoins(coinsJson.coins || coinsJson);
            setGlobalData({
                total_market_cap: globalJson.data?.total_market_cap?.usd ?? 0,
                total_volume_24h: globalJson.data?.total_volume?.usd ?? 0,
                btc_dominance: globalJson.data?.market_cap_percentage?.btc ?? 0,
            });
        } catch {
            setCoins(MOCK_COINS);
            setGlobalData(MOCK_GLOBAL);
        }
    }, []);

    useEffect(() => {
        fetchMarketData();
    }, [fetchMarketData]);

    const fetchChartsData = useCallback(async () => {
        setChartLoading(true);
        try {
            const responses = await Promise.all(
                CHART_COINS.map(c => fetch(`${import.meta.env.VITE_API_URL}/market/chart/${c.id}?days=7`))
            );
            if (responses.some(r => !r.ok)) throw new Error('API Error');
            const newChartData: CoinCharts = {};
            for (let i = 0; i < CHART_COINS.length; i++) {
                const json = await responses[i].json();
                const pricesArray = json.prices || json;
                newChartData[CHART_COINS[i].id] = pricesArray.map((p: [number, number]) => ({
                    timestamp: p[0], price: p[1]
                }));
            }
            setChartData(newChartData);
        } catch {
            setChartData(MOCK_CHARTS);
        } finally {
            setChartLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchChartsData();
    }, [fetchChartsData]);

    return (
        <div className="bg-[#f4f4f0] min-h-screen text-black overflow-x-hidden font-sans">
            {/* ── TICKER ── */}
            <div className="w-full bg-[#ccff00] border-b-4 border-black py-2 overflow-hidden whitespace-nowrap flex items-center">
                <div className="animate-marquee inline-block font-mono text-sm font-bold uppercase tracking-widest">
                    {coins.length > 0 ? [...coins, ...coins, ...coins, ...coins].map((c, i) => (
                        <span key={i} className="mx-6 inline-flex items-center gap-4">
                            <span>[{c.symbol.toUpperCase()}]</span>
                            <span>{fmtPrice(c.current_price)}</span>
                            <span className={c.price_change_percentage_24h >= 0 ? "text-blue-700" : "text-red-600"}>
                                {fmtPct(c.price_change_percentage_24h)}
                            </span>
                            <span className="mx-4">///</span>
                        </span>
                    )) : (
                        <span className="mx-6">INITIALIZING MARKET STREAM /// STAND BY /// INITIALIZING MARKET STREAM</span>
                    )}
                </div>
            </div>

            {/* ── NAVBAR ── */}
            <nav className="w-full border-b-4 border-black bg-white sticky top-0 z-50">
                <div className="max-w-[1400px] mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="font-mono text-2xl font-black tracking-tighter">
                        [ CYPHER_SIGHT ]
                    </div>
                    <div className="flex gap-4">
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="brutalist-btn bg-[#ccff00]">
                                DASHBOARD <ArrowRight size={18} />
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="brutalist-btn bg-white">
                                    LOGIN
                                </Link>
                                <Link to="/register" className="brutalist-btn bg-black text-white">
                                    SIGN UP
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="max-w-[1400px] mx-auto px-6 py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 relative">
                {/* Background grid pattern */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(90deg, #000 1px, transparent 1px), linear-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="flex flex-col justify-center z-10">
                    <h1 className="text-[clamp(4rem,8vw,7rem)] font-black leading-[0.85] tracking-tighter uppercase break-words mb-8">
                        Track <br />
                        <span className="bg-[#ccff00] px-2 border-4 border-black brutalist-shadow-sm inline-block transform -rotate-2">Wealth.</span> <br />
                        Trust <br />
                        Data.
                    </h1>
                    <p className="font-mono text-lg max-w-lg mb-10 leading-relaxed border-l-4 border-black pl-6">
                        No AI slop. No generic dashboards. Pure, raw, unfiltered control over your cryptocurrency portfolio. Built for the paranoid and precise.
                    </p>
                    <div className="flex gap-6">
                        <Link to={isAuthenticated ? "/dashboard" : "/register"} className="brutalist-btn bg-[#0055ff] text-white text-xl py-4 px-8">
                            INITIALIZE TRACKER <Terminal size={24} className="ml-2" />
                        </Link>
                    </div>
                </div>

                <div className="relative z-10 flex items-center justify-center h-[500px]">
                    {/* Fake Window 1 */}
                    <div className="absolute top-10 left-0 w-80 bg-white border-4 border-black brutalist-shadow z-20 transform -rotate-3 hover:rotate-0 transition-transform cursor-crosshair">
                        <div className="bg-black text-white px-3 py-2 font-mono text-xs flex justify-between border-b-4 border-black">
                            <span>portfolio_dump.json</span>
                            <span>[X]</span>
                        </div>
                        <div className="p-4 bg-black text-[#ccff00] font-mono text-xs overflow-hidden h-48 whitespace-pre">
                            {`{
  "user": "sysadmin",
  "total_value": "$45,210.89",
  "holdings": [
    { "asset": "BTC", "qty": 0.45 },
    { "asset": "ETH", "qty": 4.2 }
  ],
  "status": "SECURE",
  "encryption": "ACTIVE"
}`}
                        </div>
                    </div>
                    
                    {/* Fake Window 2 */}
                    <div className="absolute bottom-10 right-0 w-96 bg-[#ff4400] border-4 border-black brutalist-shadow z-30 transform rotate-2 hover:-rotate-1 transition-transform cursor-crosshair">
                        <div className="bg-white border-b-4 border-black px-3 py-2 font-mono text-xs font-bold uppercase flex justify-between">
                            <span>ALERT: VOLATILITY SPIKE</span>
                            <span>_ [] X</span>
                        </div>
                        <div className="p-6">
                            <h2 className="text-4xl font-black text-white mb-2 uppercase">Market Move</h2>
                            <p className="font-mono font-bold text-black bg-white inline-block px-2 border-2 border-black">BTC DOMINANCE: {globalData?.btc_dominance.toFixed(1) || "52.5"}%</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── ASYMMETRIC BENTO BOX FEATURES ── */}
            <section className="border-t-4 border-black bg-white">
                <div className="max-w-[1400px] mx-auto px-6 py-24">
                    <div className="mb-16 border-b-4 border-black pb-4 inline-block">
                        <h2 className="text-6xl font-black uppercase tracking-tighter">System Specs</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-[#ccff00] border-4 border-black brutalist-shadow p-8 flex flex-col md:col-span-2">
                            <div className="flex justify-between items-start mb-16">
                                <span className="font-mono text-2xl font-black border-2 border-black px-2 bg-white">01</span>
                                <BarChart2 size={48} />
                            </div>
                            <h3 className="text-4xl font-black uppercase mb-4">Granular Analytics</h3>
                            <p className="font-mono text-lg leading-relaxed max-w-md">Real-time PnL, historical cost basis, and extreme portfolio dissection. No vague metrics.</p>
                        </div>

                        <div className="bg-[#0055ff] text-white border-4 border-black brutalist-shadow p-8 flex flex-col">
                            <div className="flex justify-between items-start mb-16">
                                <span className="font-mono text-2xl font-black border-2 border-white px-2 bg-black">02</span>
                                <Zap size={48} />
                            </div>
                            <h3 className="text-3xl font-black uppercase mb-4">Zero Latency</h3>
                            <p className="font-mono text-base leading-relaxed">Direct WebSocket streams. Prices update faster than you can blink.</p>
                        </div>

                        <div className="bg-[#ff4400] text-white border-4 border-black brutalist-shadow p-8 flex flex-col">
                            <div className="flex justify-between items-start mb-16">
                                <span className="font-mono text-2xl font-black border-2 border-black text-black px-2 bg-white">03</span>
                                <Shield size={48} className="text-black" />
                            </div>
                            <h3 className="text-3xl font-black text-black uppercase mb-4">Bulletproof</h3>
                            <p className="font-mono text-base text-black leading-relaxed">Local-first caching, JWT auth, background workers. It never goes down.</p>
                        </div>

                        <div className="bg-white border-4 border-black brutalist-shadow p-8 flex flex-col md:col-span-2">
                            <div className="flex justify-between items-start mb-16">
                                <span className="font-mono text-2xl font-black border-2 border-black px-2 bg-[#ccff00]">04</span>
                                <Activity size={48} />
                            </div>
                            <h3 className="text-4xl font-black uppercase mb-4">Complete Control</h3>
                            <p className="font-mono text-lg leading-relaxed max-w-xl">Fully modular drag-and-drop dashboard. Put your data exactly where you want it. CSV/JSON export built in.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TRADING CARDS (TOP COINS) ── */}
            <section className="border-t-4 border-black bg-[#ccff00] py-24 overflow-hidden">
                <div className="max-w-[1400px] mx-auto px-6 mb-12 flex items-end justify-between">
                    <h2 className="text-6xl font-black uppercase tracking-tighter bg-white inline-block border-4 border-black brutalist-shadow-sm px-6 py-2">
                        Top Assets
                    </h2>
                    <div className="font-mono font-bold text-xl hidden md:block">
                        // LIVE_INDEX_SCAN
                    </div>
                </div>

                <div className="flex overflow-x-auto gap-8 px-6 pb-12 snap-x" style={{ scrollbarWidth: 'none' }}>
                    {coins.slice(0, 8).map((coin, idx) => {
                        const colors = ['bg-white', 'bg-black text-white', 'bg-[#0055ff] text-white', 'bg-[#ff4400] text-white'];
                        const cardStyle = colors[idx % colors.length];
                        const isPos = coin.price_change_percentage_24h >= 0;

                        return (
                            <div key={coin.id} className={`flex-shrink-0 w-80 border-4 border-black brutalist-shadow p-6 flex flex-col snap-center ${cardStyle}`}>
                                <div className="flex justify-between items-start mb-8 border-b-2 border-current pb-4">
                                    <span className="font-mono text-3xl font-black">{coin.symbol.toUpperCase()}</span>
                                    <span className="font-mono font-bold">#{coin.market_cap_rank}</span>
                                </div>
                                <div className="flex justify-center mb-8">
                                    <img src={coin.image} alt={coin.name} className="w-24 h-24 border-4 border-current bg-white object-cover brutalist-shadow-sm" />
                                </div>
                                <h3 className="text-3xl font-black uppercase mb-2 truncate">{coin.name}</h3>
                                <div className="font-mono text-2xl font-bold mb-4">{fmtPrice(coin.current_price)}</div>
                                
                                <div className={`font-mono text-lg font-black border-2 border-current px-2 py-1 inline-block self-start mb-6 ${isPos ? 'bg-[#ccff00] text-black' : 'bg-red-600 text-white'}`}>
                                    {fmtPct(coin.price_change_percentage_24h)}
                                </div>

                                <div className="mt-auto border-t-2 border-current pt-4">
                                    <div className="flex justify-between font-mono text-xs uppercase opacity-80">
                                        <span>Mkt Cap</span>
                                        <span>{fmtUsd(coin.market_cap)}</span>
                                    </div>
                                    <div className="h-8 w-full bg-current opacity-20 mt-4 flex items-center justify-center">
                                        <div className="w-full h-1/2 border-y border-current stripe-pattern"></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ── MARKET CHARTS ── */}
            <section className="border-t-4 border-black bg-white py-24">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="mb-12 border-b-4 border-black pb-4 inline-block">
                        <h2 className="text-6xl font-black uppercase tracking-tighter">7D Price History</h2>
                    </div>

                    <div className="bg-white border-4 border-black brutalist-shadow p-8 mb-8">
                        <div className="flex flex-wrap gap-4 mb-8 border-b-4 border-black pb-4">
                            {CHART_COINS.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setActiveChartTab(c.id)}
                                    className={`brutalist-btn ${activeChartTab === c.id ? 'bg-black text-white' : 'bg-white text-black'}`}
                                >
                                    <div className="w-3 h-3 border-2 border-current" style={{ backgroundColor: c.color }} />
                                    {c.symbol}
                                </button>
                            ))}
                        </div>
                        
                        <div className="h-[400px] border-4 border-black p-4 bg-[#f4f4f0]">
                            {chartLoading ? (
                                <div className="w-full h-full flex items-center justify-center font-mono font-bold text-xl uppercase animate-pulse">
                                    [ LOADING_CHART_DATA... ]
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData[activeChartTab] || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                        <XAxis dataKey="timestamp" tickFormatter={formatAxisDate} tick={{ fill: '#000', fontSize: 12, fontFamily: "'DM Mono', monospace", fontWeight: 'bold' }} axisLine={{ stroke: '#000', strokeWidth: 4 }} tickLine={{ stroke: '#000', strokeWidth: 2 }} minTickGap={50} />
                                        <YAxis tickFormatter={(val) => `$${val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val}`} tick={{ fill: '#000', fontSize: 12, fontFamily: "'DM Mono', monospace", fontWeight: 'bold' }} axisLine={{ stroke: '#000', strokeWidth: 4 }} tickLine={{ stroke: '#000', strokeWidth: 2 }} domain={['auto', 'auto']} orientation="right" />
                                        <Tooltip 
                                            contentStyle={{ background: '#fff', border: '4px solid #000', boxShadow: '4px 4px 0 #000', borderRadius: '0', fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', fontWeight: 'bold' }}
                                            labelFormatter={(l) => formatTooltipDate(l as number)}
                                            itemStyle={{ color: '#000', fontWeight: '900' }}
                                            formatter={(val: number) => [fmtPrice(val), 'PRICE']}
                                        />
                                        <Area type="step" dataKey="price" stroke="#000" fillOpacity={1} fill={CHART_COINS.find(c => c.id === activeChartTab)?.color || '#ccff00'} strokeWidth={4} isAnimationActive={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="border-t-4 border-black bg-black text-white overflow-hidden relative">
                <div className="absolute inset-0 opacity-20 stripe-pattern pointer-events-none"></div>
                <div className="max-w-[1400px] mx-auto px-6 py-32 flex flex-col items-center justify-center text-center relative z-10">
                    
                    <Link to="/register" className="group block mb-16">
                        <h2 className="text-[clamp(5rem,15vw,12rem)] font-black uppercase tracking-tighter leading-none hover:text-[#ccff00] transition-colors cursor-pointer" style={{ textShadow: '8px 8px 0 #0055ff' }}>
                            INITIALIZE
                        </h2>
                    </Link>

                    <div className="w-full border-t-4 border-white pt-8 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="font-mono text-2xl font-black tracking-tighter">
                            [ CYPHER_SIGHT ]
                        </div>
                        <div className="flex gap-8 font-mono font-bold uppercase text-sm">
                            <a href="https://github.com/mohanishp9/crypto_portfolio_tracker" target="_blank" rel="noreferrer" className="hover:text-[#ccff00] hover:underline underline-offset-4 border-2 border-transparent hover:border-[#ccff00] px-2 py-1 transition-all">Source Code</a>
                            <a href="https://coingecko.com" target="_blank" rel="noreferrer" className="hover:text-[#ccff00] hover:underline underline-offset-4 border-2 border-transparent hover:border-[#ccff00] px-2 py-1 transition-all">CoinGecko API</a>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default LandingPage;
