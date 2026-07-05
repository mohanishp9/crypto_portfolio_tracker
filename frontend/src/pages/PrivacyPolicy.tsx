import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#09090b', color: '#fafafa', fontFamily: 'ui-sans-serif, system-ui, sans-serif', padding: '40px 20px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#18181b', padding: '40px', borderRadius: '16px', border: '1px solid #27272a' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '24px', color: '#10b981' }}>Privacy Policy</h1>
                <p style={{ color: '#a1a1aa', marginBottom: '32px' }}>Last Updated: July 6, 2026</p>

                <section style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#e4e4e7' }}>1. Information We Collect</h2>
                    <p style={{ color: '#d4d4d8', lineHeight: '1.6' }}>
                        When you register for a CypherSight account, we collect your name, email address, and encrypted password. 
                        As you use the service, we store the portfolio transactions (such as coin amounts, buy/sell prices, and timestamps) and watchlist items you manually enter.
                    </p>
                </section>

                <section style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#e4e4e7' }}>2. How We Use Your Information</h2>
                    <p style={{ color: '#d4d4d8', lineHeight: '1.6' }}>
                        We use the information we collect to provide, maintain, and improve the CypherSight service. 
                        Specifically, we use your transaction data to calculate portfolio performance, provide analytics, and send price alerts if you have enabled them. 
                        Your email is used strictly for essential account notifications, authentication (such as OTPs and password resets), and user-configured price alerts.
                    </p>
                </section>

                <section style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#e4e4e7' }}>3. Data Sharing and Third Parties</h2>
                    <p style={{ color: '#d4d4d8', lineHeight: '1.6' }}>
                        CypherSight does not sell, rent, or trade your personal information or portfolio data to third parties. 
                        We only share anonymized asset symbols with our data provider (CoinGecko) to fetch live market prices. We do not share your account balances or personal identity with these APIs.
                    </p>
                </section>

                <section style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#e4e4e7' }}>4. Data Security</h2>
                    <p style={{ color: '#d4d4d8', lineHeight: '1.6' }}>
                        We implement rigorous security measures, including bcrypt password hashing, secure session management, and encrypted data transmission, to protect your information. 
                        However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                    </p>
                </section>

                <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #27272a', textAlign: 'center' }}>
                    <Link to="/" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.9rem' }}>&larr; Return to Home</Link>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
