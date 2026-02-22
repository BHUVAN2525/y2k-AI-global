/**
 * IT Infrastructure Service
 * Manages asset inventory, vulnerability tracking, and patch compliance metrics.
 */
const Asset = require('../models/Asset');
const connectDB = require('../config/db');

// In-memory fallback if MongoDB is down
let inMemoryAssets = [
    { _id: 'asset_001', hostname: 'PROD-APP-01', ip: '10.0.1.45', os: 'Ubuntu 22.04', type: 'server', status: 'online', patchLevel: 94, vulnerabilities: [{ cve: 'CVE-2024-1234', severity: 'high', description: 'Kernel vulnerability' }], lastScan: new Date().toISOString() },
    { _id: 'asset_002', hostname: 'DEV-DB-02', ip: '10.0.2.12', os: 'CentOS 7', type: 'server', status: 'maintenance', patchLevel: 45, vulnerabilities: [{ cve: 'CVE-2023-4567', severity: 'critical', description: 'Remote Code Execution' }], lastScan: new Date().toISOString() },
    { _id: 'asset_003', hostname: 'CEO-LAPTOP', ip: '192.168.1.5', os: 'macOS Sonoma', type: 'workstation', status: 'online', patchLevel: 100, vulnerabilities: [], lastScan: new Date().toISOString() }
];

const infrastructureService = {
    async getAssets() {
        if (connectDB.isConnected()) {
            try {
                return await Asset.find().sort({ updatedAt: -1 });
            } catch (err) {
                console.error('[Infra] DB fetch failed, using fallback');
            }
        }
        return inMemoryAssets;
    },

    async getVulnerabilitySummary() {
        const assets = await this.getAssets();
        const summary = { critical: 0, high: 0, medium: 0, low: 0 };
        assets.forEach(asset => {
            (asset.vulnerabilities || []).forEach(v => {
                if (summary[v.severity] !== undefined) summary[v.severity]++;
            });
        });
        return summary;
    },

    async getPatchCompliance() {
        const assets = await this.getAssets();
        if (assets.length === 0) return 100;
        const total = assets.reduce((sum, asset) => sum + (asset.patchLevel || 0), 0);
        return Math.round(total / assets.length);
    },

    async addAsset(assetData) {
        if (connectDB.isConnected()) {
            return await Asset.create(assetData);
        }
        const newAsset = { _id: `asset_${Date.now()}`, ...assetData, lastScan: new Date().toISOString() };
        inMemoryAssets.unshift(newAsset);
        return newAsset;
    }
};

module.exports = infrastructureService;
