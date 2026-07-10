import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService: React.FC = () => {
    return (
        <div className="min-h-screen bg-surface-primary text-text-primary font-sans py-10 px-5">
            <div className="max-w-3xl mx-auto bg-surface-secondary p-10 rounded-sm border border-border-primary">
                <h1 className="text-3xl mb-6 text-positive font-semibold tracking-tight">Terms of Service</h1>
                <p className="text-text-tertiary mb-8">Last Updated: July 6, 2026</p>

                <section className="mb-8">
                    <h2 className="text-xl mb-4 text-text-primary font-semibold">1. Not Financial Advice</h2>
                    <p className="text-text-secondary leading-relaxed">
                        The information provided by CypherSight is for informational and educational purposes only and does not constitute financial, investment, legal, or other professional advice.
                        CypherSight does not recommend or endorse any specific cryptocurrency, digital asset, investment strategy, or platform.
                        You acknowledge that cryptocurrency markets are highly volatile and unpredictable. You are solely responsible for evaluating the merits and risks associated with the use of any information provided by the service before making any investment decisions.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl mb-4 text-text-primary font-semibold">2. Acceptance of Terms</h2>
                    <p className="text-text-secondary leading-relaxed">
                        By accessing or using CypherSight, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, then you may not access the service.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl mb-4 text-text-primary font-semibold">3. Data Accuracy</h2>
                    <p className="text-text-secondary leading-relaxed">
                        While we strive to provide accurate market data via third-party APIs (such as CoinGecko), we cannot guarantee the accuracy, completeness, or timeliness of the information. Pricing and portfolio valuations may be delayed or inaccurate. We shall not be held liable for any financial losses resulting from inaccurate data.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl mb-4 text-text-primary font-semibold">4. Account Security</h2>
                    <p className="text-text-secondary leading-relaxed">
                        You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password. CypherSight will not be liable for any loss or damage arising from your failure to comply with these security obligations.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl mb-4 text-text-primary font-semibold">5. Limitation of Liability</h2>
                    <p className="text-text-secondary leading-relaxed">
                        In no event shall CypherSight, its directors, employees, partners, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
                    </p>
                </section>

                <div className="mt-12 pt-6 border-t border-border-primary text-center">
                    <Link to="/" className="text-accent hover:text-accent text-sm no-underline font-medium">&larr; Return to Home</Link>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;