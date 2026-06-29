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
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" />
                        </div>
                        <h1 className="font-semibold text-xl tracking-tight text-zinc-50">
                            Cypher<span className="text-zinc-500 font-normal italic">Sight</span>
                        </h1>
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
