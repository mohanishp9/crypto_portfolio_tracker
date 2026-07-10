import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-surface-primary text-text-primary font-sans py-10 px-5">
            <div className="max-w-3xl mx-auto bg-surface-secondary p-10 rounded-sm border border-border-primary">
                <h1 className="text-3xl mb-6 text-positive font-semibold tracking-tight">Privacy Policy</h1>
                <p className="text-text-tertiary mb-8">Last Updated: July 6, 2026</p>

                <section className="mb-8">
                    <h2 className="text-xl mb-4 text-text-primary font-semibold">1. Information We Collect</h2>
                    <p className="text-text-secondary leading-relaxed">
                        When you register for a CypherSight account, we collect your name, email address, and encrypted password.
                        As you use the service, we store the portfolio transactions (such as coin amounts, buy/sell prices, and timestamps) and watchlist items you manually enter.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl mb-4 text-text-primary font-semibold">2. How We Use Your Information</h2>
                    <p className="text-text-secondary leading-relaxed">
                        We use the information we collect to provide, maintain, and improve the CypherSight service.
                        Specifically, we use your transaction data to calculate portfolio performance, provide analytics, and send price alerts if you have enabled them.
                        Your email is used strictly for essential account notifications, authentication (such as OTPs and password resets), and user-configured price alerts.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl mb-4 text-text-primary font-semibold">3. Data Sharing and Third Parties</h2>
                    <p className="text-text-secondary leading-relaxed">
                        CypherSight does not sell, rent, or trade your personal information or portfolio data to third parties.
                        We only share anonymized asset symbols with our data provider (CoinGecko) to fetch live market prices. We do not share your account balances or personal identity with these APIs.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl mb-4 text-text-primary font-semibold">4. Data Security</h2>
                    <p className="text-text-secondary leading-relaxed">
                        We implement rigorous security measures, including bcrypt password hashing, secure session management, and encrypted data transmission, to protect your information.
                        However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                    </p>
                </section>

                <div className="mt-12 pt-6 border-t border-border-primary text-center">
                    <Link to="/" className="text-accent hover:text-accent text-sm no-underline font-medium">&larr; Return to Home</Link>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;