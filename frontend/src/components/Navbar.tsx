import { useNavigate } from "react-router-dom";
import { User, LayoutDashboard } from "lucide-react";

interface NavbarProps {
    email?: string;
    handleLogout: () => void;
    isLoggingOut: boolean;
}

const Navbar = ({ email, handleLogout, isLoggingOut }: NavbarProps) => {
    const navigate = useNavigate();

    return (
        <nav className="sticky top-0 z-50 bg-zinc-950/70 backdrop-blur-md border-b border-zinc-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <button 
                        onClick={() => navigate("/")}
                        className="flex items-center gap-3 transition-opacity hover:opacity-80"
                    >
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
                                fontSize: '1.25rem', // Fixed size for navbar instead of clamp to prevent jumps
                                color: '#fafafa',
                                letterSpacing: '0.06em',
                            }}
                        >
                            CypherSight{' '}
                            <span style={{ color: '#818cf8', fontStyle: 'italic' }}>Portfolio</span>
                        </span>
                    </button>

                    {/* Right side */}
                    <div className="flex items-center gap-4 sm:gap-6">
                        {/* Email */}
                        <span className="hidden sm:block text-xs font-mono text-zinc-400">
                            {email}
                        </span>

                        <div className="hidden sm:block w-px h-5 bg-zinc-800" />

                        {/* Dashboard button */}
                        <button
                            onClick={() => navigate("/dashboard")}
                            title="View dashboard"
                            className="p-2 rounded-md text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50 transition-colors"
                        >
                            <LayoutDashboard size={18} strokeWidth={1.5} />
                        </button>

                        {/* Profile button */}
                        <button
                            onClick={() => navigate("/profile")}
                            title="View profile"
                            className="p-2 rounded-md text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50 transition-colors"
                        >
                            <User size={18} strokeWidth={1.5} />
                        </button>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="text-xs uppercase tracking-wider font-semibold text-zinc-500 hover:text-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoggingOut ? "Leaving..." : "Logout"}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
