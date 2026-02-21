/**
 * Threat Intelligence Service — Aggregates and Correlates Threat Feeds
 * 
 * Integrates: VirusTotal, AbuseIPDB, AlienVault OTX, Abuse.ch
 * Provides: IOC enrichment, feed aggregation, correlation engine
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.join(__dirname, '..', 'config', 'settings.json');

function loadSettings() {
    try { return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')); }
    catch { return {}; }
}

// In-memory cache for feed results (TTL: 15 minutes)
const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000;

function getCached(key) {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
    cache.delete(key);
    return null;
}

function setCache(key, data) {
    cache.set(key, { data, ts: Date.now() });
    // Evict old entries
    if (cache.size > 500) {
        const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
        cache.delete(oldest[0]);
    }
}

const threatIntelService = {
    /**
     * Enrich a hash (MD5/SHA1/SHA256) against all available feeds
     */
    async enrichHash(hash) {
        const cacheKey = `hash:${hash}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        const results = { hash, sources: {}, threat_level: 'unknown', timestamp: new Date().toISOString() };

        // VirusTotal
        const settings = loadSettings();
        const vtKey = settings.vt_api_key;
        if (vtKey) {
            try {
                const res = await axios.get(`https://www.virustotal.com/api/v3/files/${hash}`, {
                    headers: { 'x-apikey': vtKey }, timeout: 10000
                });
                const attrs = res.data.data.attributes;
                const stats = attrs.last_analysis_stats || {};
                results.sources.virustotal = {
                    available: true,
                    detections: stats.malicious || 0,
                    total_engines: (stats.malicious || 0) + (stats.undetected || 0),
                    detection_rate: stats.malicious ? `${stats.malicious}/${(stats.malicious + (stats.undetected || 0))}` : '0/0',
                    file_type: attrs.type_description,
                    first_seen: attrs.first_submission_date,
                    tags: attrs.tags || [],
                    popular_threat_classification: attrs.popular_threat_classification || null,
                };
            } catch (err) {
                results.sources.virustotal = {
                    available: false,
                    error: err.response?.status === 404 ? 'Hash not found' : err.message
                };
            }
        } else {
            results.sources.virustotal = { available: false, error: 'No API key configured' };
        }

        // Calculate threat level
        const vtDetections = results.sources.virustotal?.detections || 0;
        if (vtDetections >= 10) results.threat_level = 'critical';
        else if (vtDetections >= 5) results.threat_level = 'high';
        else if (vtDetections >= 1) results.threat_level = 'medium';
        else if (results.sources.virustotal?.available) results.threat_level = 'low';

        setCache(cacheKey, results);
        return results;
    },

    /**
     * Enrich an IP address against threat feeds
     */
    async enrichIP(ip) {
        const cacheKey = `ip:${ip}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        const results = { ip, sources: {}, threat_level: 'unknown', timestamp: new Date().toISOString() };
        const settings = loadSettings();

        // AbuseIPDB
        const abuseKey = settings.abuseipdb_key;
        if (abuseKey) {
            try {
                const res = await axios.get('https://api.abuseipdb.com/api/v2/check', {
                    params: { ipAddress: ip, maxAgeInDays: 90 },
                    headers: { Key: abuseKey, Accept: 'application/json' },
                    timeout: 10000
                });
                const data = res.data.data;
                results.sources.abuseipdb = {
                    available: true,
                    abuse_confidence_score: data.abuseConfidenceScore,
                    total_reports: data.totalReports,
                    country: data.countryCode,
                    isp: data.isp,
                    domain: data.domain,
                    is_tor: data.isTor,
                    is_whitelisted: data.isWhitelisted,
                    last_reported: data.lastReportedAt,
                };
            } catch (err) {
                results.sources.abuseipdb = { available: false, error: err.message };
            }
        } else {
            results.sources.abuseipdb = { available: false, error: 'No API key configured' };
        }

        // VirusTotal IP check
        const vtKey = settings.vt_api_key;
        if (vtKey) {
            try {
                const res = await axios.get(`https://www.virustotal.com/api/v3/ip_addresses/${ip}`, {
                    headers: { 'x-apikey': vtKey }, timeout: 10000
                });
                const attrs = res.data.data.attributes;
                const stats = attrs.last_analysis_stats || {};
                results.sources.virustotal = {
                    available: true,
                    malicious: stats.malicious || 0,
                    suspicious: stats.suspicious || 0,
                    harmless: stats.harmless || 0,
                    country: attrs.country,
                    as_owner: attrs.as_owner,
                    network: attrs.network,
                };
            } catch (err) {
                results.sources.virustotal = { available: false, error: err.message };
            }
        }

        // Calculate threat level
        const abuseScore = results.sources.abuseipdb?.abuse_confidence_score || 0;
        const vtMalicious = results.sources.virustotal?.malicious || 0;
        if (abuseScore >= 80 || vtMalicious >= 5) results.threat_level = 'critical';
        else if (abuseScore >= 50 || vtMalicious >= 2) results.threat_level = 'high';
        else if (abuseScore >= 20 || vtMalicious >= 1) results.threat_level = 'medium';
        else results.threat_level = 'low';

        setCache(cacheKey, results);
        return results;
    },

    /**
     * Get open threat feed summaries
     */
    async getOpenFeeds() {
        const cacheKey = 'feeds:summary';
        const cached = getCached(cacheKey);
        if (cached) return cached;

        const feeds = {
            timestamp: new Date().toISOString(),
            sources: []
        };

        // Abuse.ch — URLhaus recent URLs
        try {
            const res = await axios.get('https://urlhaus-api.abuse.ch/v1/urls/recent/', {
                timeout: 10000, params: { limit: 10 }
            });
            feeds.sources.push({
                name: 'URLhaus (Abuse.ch)',
                type: 'malicious_urls',
                count: res.data.urls?.length || 0,
                sample: (res.data.urls || []).slice(0, 5).map(u => ({
                    url: u.url,
                    threat: u.threat,
                    tags: u.tags,
                    date_added: u.date_added
                })),
                status: 'operational'
            });
        } catch {
            feeds.sources.push({ name: 'URLhaus (Abuse.ch)', status: 'unavailable' });
        }

        // Abuse.ch — Feodo Tracker (banking trojans)
        try {
            const res = await axios.get('https://feodotracker.abuse.ch/downloads/ipblocklist_recommended.json', {
                timeout: 10000
            });
            const data = Array.isArray(res.data) ? res.data : [];
            feeds.sources.push({
                name: 'Feodo Tracker',
                type: 'c2_servers',
                count: data.length,
                sample: data.slice(0, 5).map(e => ({
                    ip: e.ip_address,
                    port: e.port,
                    malware: e.malware,
                    first_seen: e.first_seen,
                    last_online: e.last_online
                })),
                status: 'operational'
            });
        } catch {
            feeds.sources.push({ name: 'Feodo Tracker', status: 'unavailable' });
        }

        setCache(cacheKey, feeds);
        return feeds;
    },

    /**
     * Correlate a local scan result with global threat data
     */
    async correlate(scanResult) {
        const correlations = {
            scan_id: scanResult._id || 'unknown',
            filename: scanResult.filename,
            correlations: [],
            timestamp: new Date().toISOString()
        };

        // Enrich hashes
        if (scanResult.hashes?.sha256) {
            const hashEnrichment = await this.enrichHash(scanResult.hashes.sha256);
            if (hashEnrichment.threat_level !== 'unknown') {
                correlations.correlations.push({
                    type: 'hash_match',
                    source: 'VirusTotal',
                    threat_level: hashEnrichment.threat_level,
                    details: hashEnrichment.sources.virustotal
                });
            }
        }

        return correlations;
    },

    /**
     * Get feed status summary
     */
    getStatus() {
        return {
            cache_size: cache.size,
            cache_ttl_minutes: CACHE_TTL / 60000,
            feeds_available: ['VirusTotal', 'AbuseIPDB', 'URLhaus', 'Feodo Tracker'],
            timestamp: new Date().toISOString()
        };
    }
};

module.exports = threatIntelService;
