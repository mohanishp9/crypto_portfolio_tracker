import { useNavigate } from "react-router-dom";
import { User, LayoutDashboard, Activity } from "lucide-react";

interface NavbarProps {
    email?: string;
    handleLogout: () => void;
    isLoggingOut: boolean;
}

const Navbar = ({ email, handleLogout, isLoggingOut }: NavbarProps) => {
    const navigate = useNavigate();

    return (
        <nav className="sticky top-0 z-50 bg-surface-primary/95 border-b border-border-primary ">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <button
                        onClick={() => navigate("/")}
                        className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
                    >
                        <div className="w-7 h-7 rounded-md bg-accent-subtle border border-accent/20 flex items-center justify-center flex-shrink-0">
                            <Activity className="text-accent" size={16} />
                        </div>
                        <span className="text-lg font-semibold text-text-primary tracking-tight">
                            CypherSight
                        </span>
                    </button>

                    {/* Right side */}
                    <div className="flex items-center gap-4 sm:gap-6">
                        {/* Email */}
                        <span className="hidden sm:block text-xs text-text-secondary">
                            {email}
                        </span>

                        <div className="hidden sm:block w-px h-5 bg-border-primary" />

                        {/* Dashboard button */}
                        <button
                            onClick={() => navigate("/dashboard")}
                            title="View dashboard"
                            className="p-2 rounded-sm text-text-secondary hover:text-text-primary hover:bg-surface-tertiary transition-colors"
                        >
                            <LayoutDashboard size={18} strokeWidth={1.5} />
                        </button>

                        {/* Profile button */}
                        <button
                            onClick={() => navigate("/profile")}
                            title="View profile"
                            className="p-2 rounded-sm text-text-secondary hover:text-text-primary hover:bg-surface-tertiary transition-colors"
                        >
                            <User size={18} strokeWidth={1.5} />
                        </button>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="text-sm font-medium text-text-secondary hover:text-negative transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoggingOut ? "Signing out..." : "Sign out"}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
