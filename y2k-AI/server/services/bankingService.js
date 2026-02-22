/**
 * Banking Security Service
 * Handles transaction monitoring, fraud detection rules, and financial risk scoring.
 */

const TRANSACTION_FEED = [
    { id: 'tx_982', amount: 4500.00, currency: 'USD', merchant: 'GlobalTech Ltd', location: 'UK', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), risk: 'low' },
    { id: 'tx_983', amount: 12.50, currency: 'USD', merchant: 'Coffee Shop', location: 'US', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), risk: 'low' },
    { id: 'tx_984', amount: 8900.00, currency: 'USD', merchant: 'Swift-X Crypto', location: 'KY', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), risk: 'high' },
    { id: 'tx_985', amount: 450.00, currency: 'USD', merchant: 'Express Gas', location: 'RU', timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), risk: 'medium' },
    { id: 'tx_986', amount: 12000.00, currency: 'USD', merchant: 'Shell Corp A', location: 'CH', timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), risk: 'critical' },
];

const ALERTS = [
    { id: 'alert_01', type: 'Velocity Exception', severity: 'high', description: 'Account ending in 4922 made 5 international transfers in 2 minutes.', status: 'open' },
    { id: 'alert_02', type: 'Geo-Anomaly', severity: 'critical', description: 'Login from VPN (Bulgaria) immediately followed by $12k transfer from Switzerland.', status: 'under_investigation' },
    { id: 'alert_03', type: 'Pattern Match', severity: 'medium', description: 'Batch transaction signature matching "Silver-Liner" banking trojan payload.', status: 'closed' },
];

const bankingService = {
    getTransactions() {
        return TRANSACTION_FEED;
    },

    getAlerts() {
        return ALERTS;
    },

    getRiskMetrics() {
        return {
            fraud_prevention_rate: '99.4%',
            blocked_volume_24h: '$42,500',
            active_alerts: ALERTS.filter(a => a.status !== 'closed').length,
            pci_compliance_score: 98,
            risk_trends: [12, 19, 3, 5, 2, 3, 7]
        };
    },

    async analyzeTransaction(txData) {
        let riskScore = 0;
        const reasons = [];

        if (txData.amount > 10000) {
            riskScore += 40;
            reasons.push('High value transaction');
        }

        const highRiskLocs = ['RU', 'NK', 'IR', 'KY'];
        if (highRiskLocs.includes(txData.location)) {
            riskScore += 30;
            reasons.push('High-risk jurisdiction');
        }

        if (txData.merchant.toLowerCase().includes('crypto') || txData.merchant.toLowerCase().includes('shell')) {
            riskScore += 25;
            reasons.push('High-risk merchant category');
        }

        return {
            score: riskScore,
            verdict: riskScore > 60 ? 'DENY' : riskScore > 30 ? 'FLAG' : 'ALLOW',
            reasons
        };
    },

    checkPCICompliance() {
        return {
            overall_status: 'COMPLIANT',
            score: 98,
            controls: [
                { id: '1.1', requirement: 'Firewall Configuration', status: 'PASS', details: 'Next-gen firewall active with ingress filtering' },
                { id: '3.4', requirement: 'Encryption of Data at Rest', status: 'PASS', details: 'AES-256-GCM enforced on all storage' },
                { id: '4.1', requirement: 'Encryption in Transit', status: 'PASS', details: 'TLS 1.3 enforced' },
                { id: '8.3', requirement: 'MFA Enforcement', status: 'PASS', details: 'MFA required for all administrative access' },
                { id: '10.2', requirement: 'Audit Logs', status: 'PASS', details: 'Persistent audit logging implemented' }
            ],
            timestamp: new Date().toISOString()
        };
    }
};

module.exports = bankingService;
