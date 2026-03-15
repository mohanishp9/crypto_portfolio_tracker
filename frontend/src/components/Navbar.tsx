import { useNavigate } from "react-router-dom";

interface NavbarProps {
    email?: string;
    handleLogout: () => void;
    isLoggingOut: boolean;
}

const Navbar = ({ email, handleLogout, isLoggingOut }: NavbarProps) => {
    const navigate = useNavigate();

    return (
        <nav
            style={{
                background: "rgba(26,28,26,0.92)",
                backdropFilter: "blur(12px)",
                borderBottom: "1px solid rgba(61,74,62,0.3)",
                position: "sticky",
                top: 0,
                zIndex: 50,
            }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <button 
                        onClick={() => navigate("/")}
                        className="flex items-center gap-3 transition-opacity hover:opacity-80"
                        style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                    >
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                border: "1px solid rgba(196,136,90,0.5)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <div
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: "#c4885a",
                                    opacity: 0.8,
                                }}
                            />
                        </div>

                        <h1
                            className="font-light tracking-wide"
                            style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)",
                                color: "#ede8dd",
                                letterSpacing: "0.06em",
                            }}
                        >
                            Grove{" "}
                            <span style={{ color: "#c4885a", fontStyle: "italic" }}>
                                Portfolio
                            </span>
                        </h1>
                    </button>

                    {/* Right side */}
                    <div className="flex items-center gap-5">

                        {/* Email */}
                        <span
                            className="hidden sm:block"
                            style={{
                                fontSize: "0.6rem",
                                letterSpacing: "0.2em",
                                textTransform: "uppercase",
                                color: "#6b7c6a",
                            }}
                        >
                            {email}
                        </span>

                        <div
                            className="hidden sm:block"
                            style={{
                                width: 1,
                                height: 20,
                                background: "rgba(61,74,62,0.5)",
                            }}
                        />

                        {/* Dashboard button */}
                        <button
                            onClick={() => navigate("/")}
                            title="View dashboard"
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                border: "1px solid rgba(107,124,106,0.3)",
                                background: "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(107,124,106,0.15)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9aab97" strokeWidth="1.2">
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="14" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" />
                            </svg>
                        </button>

                        {/* Profile button */}
                        <button
                            onClick={() => navigate("/profile")}
                            title="View profile"
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                border: "1px solid rgba(107,124,106,0.3)",
                                background: "#2a3d2e",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                            }}
                        >
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#9aab97"
                                strokeWidth="1.2"
                            >
                                <circle cx="12" cy="8" r="4" />
                                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                            </svg>
                        </button>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            style={{
                                background: "transparent",
                                border: "none",
                                fontSize: "0.6rem",
                                letterSpacing: "0.25em",
                                textTransform: "uppercase",
                                color: isLoggingOut ? "#3d4a3e" : "#8b5e3c",
                                fontFamily: "'DM Mono', monospace",
                                cursor: isLoggingOut ? "not-allowed" : "pointer",
                                padding: "6px 0",
                            }}
                        >
                            {isLoggingOut ? "leaving..." : "Logout"}
                        </button>

                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
