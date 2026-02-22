/**
 * Memory Forensics AI Engine — Y2K Cyber AI (Node.js Port)
 * Simulated memory analysis (Process tree, DLL injection detection, hooks)
 */

const SUSPICIOUS_DLLS = [
    "inject.dll", "hook32.dll", "keylogger.dll", "stealth.dll",
    "bypass.dll", "rootkit.dll", "payload.dll", "backdoor.dll",
];

const LEGITIMATE_DLLS = [
    "kernel32.dll", "ntdll.dll", "user32.dll", "gdi32.dll",
    "advapi32.dll", "shell32.dll", "ole32.dll", "msvcrt.dll",
];

const MITRE_TECHNIQUES = {
    "process_injection": { "id": "T1055", "name": "Process Injection", "severity": "critical" },
    "dll_side_loading": { "id": "T1574.002", "name": "DLL Side-Loading", "severity": "high" },
    "api_hooking": { "id": "T1056.004", "name": "API Hooking", "severity": "high" },
    "reflective_loading": { "id": "T1620", "name": "Reflective Code Loading", "severity": "critical" },
    "process_hollowing": { "id": "T1055.012", "name": "Process Hollowing", "severity": "critical" },
    "thread_hijacking": { "id": "T1055.003", "name": "Thread Execution Hijacking", "severity": "high" },
};

function generateProcessTree() {
    return [
        { pid: 4, name: "System", ppid: 0, user: "SYSTEM", threads: 180, handles: 4200, modules: 3, suspicious: false, memory_mb: 0.1 },
        { pid: 412, name: "smss.exe", ppid: 4, user: "SYSTEM", threads: 4, handles: 52, modules: 6, suspicious: false, memory_mb: 1.2 },
        { pid: 560, name: "csrss.exe", ppid: 412, user: "SYSTEM", threads: 14, handles: 680, modules: 75, suspicious: false, memory_mb: 5.8 },
        { pid: 648, name: "wininit.exe", ppid: 412, user: "SYSTEM", threads: 3, handles: 98, modules: 45, suspicious: false, memory_mb: 2.1 },
        { pid: 688, name: "services.exe", ppid: 648, user: "SYSTEM", threads: 8, handles: 303, modules: 68, suspicious: false, memory_mb: 8.5 },
        { pid: 708, name: "lsass.exe", ppid: 648, user: "SYSTEM", threads: 12, handles: 987, modules: 102, suspicious: false, memory_mb: 15.3 },
        { pid: 1524, name: "svchost.exe", ppid: 688, user: "SYSTEM", threads: 22, handles: 432, modules: 50, suspicious: false, memory_mb: 25.0 },
        { pid: 2180, name: "explorer.exe", ppid: 2100, user: "user", threads: 45, handles: 1850, modules: 230, suspicious: false, memory_mb: 95.2 },
        { pid: 3456, name: "chrome.exe", ppid: 2180, user: "user", threads: 55, handles: 620, modules: 180, suspicious: false, memory_mb: 350.0 },
        // Suspicious processes
        { pid: 6666, name: "svchost.exe", ppid: 2180, user: "user", threads: 3, handles: 45, modules: 12, suspicious: true, anomaly: "Unexpected parent (explorer.exe instead of services.exe)", memory_mb: 42.0, mitre: "T1055" },
        { pid: 7777, name: "csrss.exe", ppid: 3456, user: "user", threads: 2, handles: 18, modules: 8, suspicious: true, anomaly: "Process masquerading — wrong parent and user context", memory_mb: 8.0, mitre: "T1036.005" },
        { pid: 8888, name: "rundll32.exe", ppid: 2180, user: "user", threads: 5, handles: 120, modules: 25, suspicious: true, anomaly: "Elevated entropy in memory regions — possible packed payload", memory_mb: 15.6, mitre: "T1055.012" },
    ];
}

function generateHookAnalysis() {
    return [
        { function: "NtCreateFile", module: "ntdll.dll", hooked_by: "unknown_module", type: "inline", suspicious: true, details: "JMP instruction replaced first 5 bytes" },
        { function: "NtQuerySystemInformation", module: "ntdll.dll", hooked_by: "rootkit.sys", type: "SSDT", suspicious: true, details: "System Service Dispatch Table entry modified" },
        { function: "CreateProcessW", module: "kernel32.dll", hooked_by: "SecurityProduct.dll", type: "inline", suspicious: false, details: "Known security product hook" },
        { function: "NtReadVirtualMemory", module: "ntdll.dll", hooked_by: "stealth.dll", type: "inline", suspicious: true, details: "Memory read interception — possible credential theft" },
    ];
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomHex(length = 8) {
    return "0x" + [...Array(length)].map(() => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('');
}

function generateInjectedDlls(pid) {
    const injections = [];
    if (Math.random() > 0.5) {
        const mitreKeys = Object.values(MITRE_TECHNIQUES);

        injections.push({
            dll: randomChoice(SUSPICIOUS_DLLS),
            base_address: randomHex(),
            size: `${randomInt(40, 400)} KB`,
            entry_point: randomHex(),
            technique: randomChoice(mitreKeys),
            signed: false,
            entropy: Number((Math.random() * (7.99 - 6.8) + 6.8).toFixed(2)),
        });
    }
    return injections;
}

async function analyzeMemory(scanType = "full", reqData = {}) {
    const start = Date.now();

    const processes = generateProcessTree();
    const hooks = generateHookAnalysis();

    const suspiciousProcs = processes.filter(p => p.suspicious);
    const suspiciousHooks = hooks.filter(h => h.suspicious);

    const threatScore = Math.min(100, (suspiciousProcs.length * 25) + (suspiciousHooks.length * 15));

    let injections = [];
    for (const proc of suspiciousProcs) {
        const inj = generateInjectedDlls(proc.pid).map(i => ({ ...i, target_process: proc.name, target_pid: proc.pid }));
        injections = injections.concat(inj);
    }

    const extractedStrings = [
        { type: "url", value: "http://evil-c2.example.com/beacon", context: "Network callback string" },
        { type: "file_path", value: "C:\\Windows\\Temp\\payload.bin", context: "Dropped file reference" },
        { type: "registry", value: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", context: "Persistence key" },
        { type: "mutex", value: "Global\\MALWARE_MUTEX_12345", context: "Unique malware identifier" },
        { type: "ip", value: "185.220.101.42", context: "Known Tor exit node" },
    ];

    const analysisTime = ((Date.now() - start) / 1000).toFixed(3);

    // Evaluate Mitre mapping based on what processes triggered
    const mappedMitre = [];
    for (const key in MITRE_TECHNIQUES) {
        const t = MITRE_TECHNIQUES[key];
        if (suspiciousProcs.some(p => (p.mitre || "").startsWith(t.id))) {
            mappedMitre.push(t);
        }
    }

    return {
        analysis_type: scanType,
        analysis_time: `${analysisTime}s`,
        threat_score: threatScore,
        threat_level: threatScore >= 75 ? "critical" : threatScore >= 50 ? "high" : threatScore >= 25 ? "medium" : "low",
        summary: {
            total_processes: processes.length,
            suspicious_processes: suspiciousProcs.length,
            api_hooks_detected: suspiciousHooks.length,
            dll_injections: injections.length,
            suspicious_strings: extractedStrings.length,
        },
        processes,
        suspicious_processes: suspiciousProcs,
        hooks,
        injections,
        strings: extractedStrings,
        mitre_mapping: mappedMitre,
        recommendations: [
            "Isolate host from network immediately",
            "Dump full physical memory for deeper analysis",
            "Check persistence mechanisms (registry, scheduled tasks)",
            "Cross-reference C2 IPs with threat intelligence feeds",
            "Analyze dropped files in sandbox environment",
        ]
    };
}

module.exports = {
    analyzeMemory,
    generateProcessTree,
    generateHookAnalysis
};
