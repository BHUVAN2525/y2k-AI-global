/**
 * Red Mode — CVE Correlator + Attack Path Simulation
 * Maps open ports/services to CVEs, generates attack chains
 */
const express = require('express');
const router = express.Router();
const axios = require('axios');
const ReconResult = require('../../models/ReconResult');
const AttackPath = require('../../models/AttackPath');
const connectDB = require('../../config/db');
// import recon router to access in-memory entries if DB down
const reconRouter = require('./recon');

// Local CVE knowledge base for common services (no API key needed)
const CVE_KNOWLEDGE = {
    'FTP': [{ id: 'CVE-2010-4221', desc: 'ProFTPD mod_sql injection', cvss: 9.8, exploit: true },
    { id: 'CVE-2011-2523', desc: 'vsftpd backdoor command execution', cvss: 10.0, exploit: true }],
    'SSH': [{ id: 'CVE-2023-38408', desc: 'OpenSSH remote code execution via agent', cvss: 9.8, exploit: true },
    { id: 'CVE-2018-15473', desc: 'OpenSSH username enumeration', cvss: 5.3, exploit: false }],
    'Telnet': [{ id: 'CVE-1999-0619', desc: 'Telnet cleartext credential exposure', cvss: 9.8, exploit: true }],
    'HTTP': [{ id: 'CVE-2021-41773', desc: 'Apache path traversal RCE', cvss: 9.8, exploit: true },
    { id: 'CVE-2021-44228', desc: 'Log4Shell JNDI injection', cvss: 10.0, exploit: true }],
    'HTTPS': [{ id: 'CVE-2014-0160', desc: 'Heartbleed OpenSSL memory disclosure', cvss: 7.5, exploit: true },
    { id: 'CVE-2021-44228', desc: 'Log4Shell JNDI injection', cvss: 10.0, exploit: true }],
    'SMB': [{ id: 'CVE-2017-0144', desc: 'EternalBlue SMB RCE (WannaCry)', cvss: 9.3, exploit: true },
    { id: 'CVE-2020-0796', desc: 'SMBGhost RCE', cvss: 10.0, exploit: true }],
    'RDP': [{ id: 'CVE-2019-0708', desc: 'BlueKeep RDP pre-auth RCE', cvss: 9.8, exploit: true },
    { id: 'CVE-2021-34535', desc: 'Remote Desktop Client RCE', cvss: 8.8, exploit: false }],
    'MySQL': [{ id: 'CVE-2012-2122', desc: 'MySQL auth bypass', cvss: 7.5, exploit: true }],
    'VNC': [{ id: 'CVE-2019-15681', desc: 'LibVNCServer memory leak', cvss: 7.5, exploit: false }],
    'NetBIOS': [{ id: 'CVE-2008-4250', desc: 'MS08-067 NetAPI RCE', cvss: 10.0, exploit: true }],
    'RPC': [{ id: 'CVE-2003-0352', desc: 'MS03-026 RPC DCOM buffer overflow', cvss: 9.8, exploit: true }],
};

// MITRE technique mapping per service
const ATTACK_TECHNIQUES = {
    'FTP': [{ id: 'T1190', name: 'Exploit Public-Facing App' }, { id: 'T1078', name: 'Valid Accounts' }],
    'SSH': [{ id: 'T1110', name: 'Brute Force' }, { id: 'T1021.004', name: 'Remote Services: SSH' }],
    'Telnet': [{ id: 'T1040', name: 'Network Sniffing' }, { id: 'T1078', name: 'Valid Accounts' }],
    'HTTP': [{ id: 'T1190', name: 'Exploit Public-Facing App' }, { id: 'T1059.007', name: 'JavaScript' }],
    'HTTPS': [{ id: 'T1190', name: 'Exploit Public-Facing App' }, { id: 'T1071.001', name: 'Web Protocols' }],
    'SMB': [{ id: 'T1021.002', name: 'SMB/Windows Admin Shares' }, { id: 'T1570', name: 'Lateral Tool Transfer' }],
    'RDP': [{ id: 'T1021.001', name: 'Remote Desktop Protocol' }, { id: 'T1110', name: 'Brute Force' }],
    'MySQL': [{ id: 'T1190', name: 'Exploit Public-Facing App' }, { id: 'T1005', name: 'Data from Local System' }],
    'VNC': [{ id: 'T1021.005', name: 'VNC' }, { id: 'T1110', name: 'Brute Force' }],
};

function getCVEsForService(service) {
    return CVE_KNOWLEDGE[service] || [];
}

function getAttackTechniques(service) {
    return ATTACK_TECHNIQUES[service] || [{ id: 'T1046', name: 'Network Service Scan' }];
}

function calcSeverity(cvss) {
    if (cvss >= 9.0) return 'critical';
    if (cvss >= 7.0) return 'high';
    if (cvss >= 4.0) return 'medium';
    return 'low';
}

// POST /api/red/correlate — correlate recon results with CVEs
router.post('/correlate', async (req, res) => {
    try {
        const { recon_id, open_ports } = req.body;
        let ports = open_ports;

        if (recon_id) {
            const recon = await ReconResult.findById(recon_id);
            if (!recon) return res.status(404).json({ error: 'Recon not found' });
            ports = recon.open_ports;
        }

        if (!ports?.length) return res.status(400).json({ error: 'No open ports to correlate' });

        const correlations = ports.map(p => {
            const cves = getCVEsForService(p.service);
            const techniques = getAttackTechniques(p.service);
            const maxCvss = cves.reduce((m, c) => Math.max(m, c.cvss), 0);
            return {
                port: p.port, service: p.service,
                cves: cves.map(c => ({ ...c, severity: calcSeverity(c.cvss) })),
                techniques,
                max_cvss: maxCvss,
                severity: calcSeverity(maxCvss),
                exploit_available: cves.some(c => c.exploit),
                attack_likelihood: maxCvss >= 9 ? 'Very High' : maxCvss >= 7 ? 'High' : maxCvss >= 4 ? 'Medium' : 'Low'
            };
        });

        // Update recon with CVE summary
        if (recon_id) {
            const cveSummary = correlations.flatMap(c => c.cves.map(cve => ({
                cve_id: cve.id, description: cve.desc, cvss_score: cve.cvss,
                severity: cve.severity, affected_service: c.service, exploit_available: cve.exploit
            })));
            await ReconResult.findByIdAndUpdate(recon_id, { cve_summary: cveSummary });
        }

        res.json({ correlations, total_cves: correlations.reduce((s, c) => s + c.cves.length, 0) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/red/attack-path — generate attack path simulation
router.post('/attack-path', async (req, res) => {
    try {
        const { recon_id, target, open_ports, session_id } = req.body;
        let ports = open_ports;
        let resolvedTarget = target;

        if (recon_id) {
            if (connectDB.isConnected()) {
                const recon = await ReconResult.findById(recon_id);
                if (recon) { ports = recon.open_ports; resolvedTarget = recon.target; }
            } else {
                const recon = reconRouter.getInMemory
                    ? reconRouter.getInMemory(recon_id)
                    : null;
                if (recon) { ports = recon.open_ports; resolvedTarget = recon.target; }
            }
        }

        if (!ports?.length) return res.status(400).json({ error: 'No open ports provided' });

        // Build attack graph nodes
        const nodes = [
            { id: 'attacker', label: 'Attacker', type: 'entry', service: 'External', ip: '0.0.0.0', port: 0 }
        ];
        const edges = [];
        const attackChain = [];
        let step = 1;

        // Sort by exploitability
        const sortedPorts = [...ports].sort((a, b) => {
            const aRisk = { critical: 4, high: 3, medium: 2, low: 1, info: 0 }[a.risk] || 0;
            const bRisk = { critical: 4, high: 3, medium: 2, low: 1, info: 0 }[b.risk] || 0;
            return bRisk - aRisk;
        });

        let entryNode = 'attacker';
        for (const p of sortedPorts.slice(0, 6)) {
            const nodeId = `${p.service}_${p.port}`;
            const cves = getCVEsForService(p.service);
            const techniques = getAttackTechniques(p.service);
            const topCve = cves[0];
            const topTech = techniques[0];
            const successProb = topCve ? Math.min(0.95, topCve.cvss / 10) : 0.3;

            nodes.push({
                id: nodeId, label: `${p.service}:${p.port}`,
                type: p.risk === 'critical' ? 'target' : 'pivot',
                service: p.service, ip: resolvedTarget, port: p.port
            });

            edges.push({
                from: entryNode, to: nodeId,
                technique: topCve ? `Exploit ${topCve.id}` : `${topTech.name}`,
                mitre_id: topTech.id,
                success_probability: successProb,
                description: topCve ? topCve.desc : `Attack via ${p.service}`
            });

            attackChain.push({
                step, action: `Exploit ${p.service} on port ${p.port}`,
                technique: topTech.name, mitre_id: topTech.id,
                target_node: nodeId, success_probability: successProb
            });

            if (p.risk === 'critical' || p.risk === 'high') entryNode = nodeId;
            step++;
        }

        // Add exfil node
        if (nodes.length > 1) {
            nodes.push({ id: 'exfil', label: 'Data Exfiltration', type: 'exfil', service: 'C2', ip: '0.0.0.0', port: 443 });
            edges.push({ from: entryNode, to: 'exfil', technique: 'Exfiltration Over C2', mitre_id: 'T1041', success_probability: 0.7, description: 'Exfiltrate data via encrypted channel' });
            attackChain.push({ step, action: 'Exfiltrate data', technique: 'Exfiltration Over C2', mitre_id: 'T1041', target_node: 'exfil', success_probability: 0.7 });
        }

        const overallRisk = sortedPorts[0]?.risk || 'medium';
        let attackPath;
        if (connectDB.isConnected()) {
            attackPath = await AttackPath.create({
                recon_id, target: resolvedTarget, session_id,
                nodes, edges, attack_chain: attackChain,
                overall_risk: overallRisk,
                estimated_time: overallRisk === 'critical' ? '1-2 hours' : overallRisk === 'high' ? '2-6 hours' : '6-24 hours'
            });

            if (recon_id) {
                await ReconResult.findByIdAndUpdate(recon_id, { $push: { attack_paths: attackPath._id } });
            }
        } else {
            // if no DB we just return result without saving
            attackPath = { recon_id, target: resolvedTarget, session_id, nodes, edges, attack_chain: attackChain, overall_risk: overallRisk, estimated_time: overallRisk === 'critical' ? '1-2 hours' : overallRisk === 'high' ? '2-6 hours' : '6-24 hours' };
        }

        res.json(attackPath);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/red/attack-path/:id
router.get('/attack-path/:id', async (req, res) => {
    try {
        const path = await AttackPath.findById(req.params.id);
        if (!path) return res.status(404).json({ error: 'Not found' });
        res.json(path);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
