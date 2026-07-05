import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService: React.FC = () => {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#09090b', color: '#fafafa', fontFamily: 'ui-sans-serif, system-ui, sans-serif', padding: '40px 20px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#18181b', padding: '40px', borderRadius: '16px', border: '1px solid #27272a' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '24px', color: '#10b981' }}>Terms of Service</h1>
                <p style={{ color: '#a1a1aa', marginBottom: '32px' }}>Last Updated: {new Date().toLocaleDateString()}</p>

                <section style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#e4e4e7' }}>1. Not Financial Advice</h2>
                    <p style={{ color: '#d4d4d8', lineHeight: '1.6' }}>
                        The information provided by CypherSight is for informational and educational purposes only and does not constitute financial, investment, legal, or other professional advice. 
                        CypherSight does not recommend or endorse any specific cryptocurrency, digital asset, investment strategy, or platform. 
                        You acknowledge that cryptocurrency markets are highly volatile and unpredictable. You are solely responsible for evaluating the merits and risks associated with the use of any information provided by the service before making any investment decisions.
                    </p>
                </section>

                <section style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#e4e4e7' }}>2. Acceptance of Terms</h2>
                    <p style={{ color: '#d4d4d8', lineHeight: '1.6' }}>
                        By accessing or using CypherSight, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, then you may not access the service.
                    </p>
                </section>

                <section style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#e4e4e7' }}>3. Data Accuracy</h2>
                    <p style={{ color: '#d4d4d8', lineHeight: '1.6' }}>
                        While we strive to provide accurate market data via third-party APIs (such as CoinGecko), we cannot guarantee the accuracy, completeness, or timeliness of the information. Pricing and portfolio valuations may be delayed or inaccurate. We shall not be held liable for any financial losses resulting from inaccurate data.
                    </p>
                </section>

                <section style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#e4e4e7' }}>4. Account Security</h2>
                    <p style={{ color: '#d4d4d8', lineHeight: '1.6' }}>
                        You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password. CypherSight will not be liable for any loss or damage arising from your failure to comply with these security obligations.
                    </p>
                </section>
                
                <section style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#e4e4e7' }}>5. Limitation of Liability</h2>
                    <p style={{ color: '#d4d4d8', lineHeight: '1.6' }}>
                        In no event shall CypherSight, its directors, employees, partners, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
                    </p>
                </section>

                <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #27272a', textAlign: 'center' }}>
                    <Link to="/" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.9rem' }}>&larr; Return to Home</Link>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
