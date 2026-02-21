"""
Memory Forensics AI Engine — Simulated memory analysis
Process tree, DLL injection detection, hook analysis, anomaly scoring
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict
import random
import time

router = APIRouter(prefix="/memory", tags=["Memory Forensics"])


# ── Simulated Memory Analysis Data ──────────────────────────────────────────

SUSPICIOUS_DLLS = [
    "inject.dll", "hook32.dll", "keylogger.dll", "stealth.dll",
    "bypass.dll", "rootkit.dll", "payload.dll", "backdoor.dll",
]

LEGITIMATE_DLLS = [
    "kernel32.dll", "ntdll.dll", "user32.dll", "gdi32.dll",
    "advapi32.dll", "shell32.dll", "ole32.dll", "msvcrt.dll",
]

MITRE_TECHNIQUES = {
    "process_injection": {"id": "T1055", "name": "Process Injection", "severity": "critical"},
    "dll_side_loading": {"id": "T1574.002", "name": "DLL Side-Loading", "severity": "high"},
    "api_hooking": {"id": "T1056.004", "name": "API Hooking", "severity": "high"},
    "reflective_loading": {"id": "T1620", "name": "Reflective Code Loading", "severity": "critical"},
    "process_hollowing": {"id": "T1055.012", "name": "Process Hollowing", "severity": "critical"},
    "thread_hijacking": {"id": "T1055.003", "name": "Thread Execution Hijacking", "severity": "high"},
}


class MemoryDumpRequest(BaseModel):
    pid: Optional[int] = None
    process_name: Optional[str] = None
    scan_type: str = "full"  # full, process, hooks, strings


def generate_process_tree():
    """Generate a realistic simulated process tree."""
    processes = [
        {"pid": 4, "name": "System", "ppid": 0, "user": "SYSTEM", "threads": 180, "handles": 4200,
         "modules": 3, "suspicious": False, "memory_mb": 0.1},
        {"pid": 412, "name": "smss.exe", "ppid": 4, "user": "SYSTEM", "threads": 4, "handles": 52,
         "modules": 6, "suspicious": False, "memory_mb": 1.2},
        {"pid": 560, "name": "csrss.exe", "ppid": 412, "user": "SYSTEM", "threads": 14, "handles": 680,
         "modules": 75, "suspicious": False, "memory_mb": 5.8},
        {"pid": 648, "name": "wininit.exe", "ppid": 412, "user": "SYSTEM", "threads": 3, "handles": 98,
         "modules": 45, "suspicious": False, "memory_mb": 2.1},
        {"pid": 688, "name": "services.exe", "ppid": 648, "user": "SYSTEM", "threads": 8, "handles": 303,
         "modules": 68, "suspicious": False, "memory_mb": 8.5},
        {"pid": 708, "name": "lsass.exe", "ppid": 648, "user": "SYSTEM", "threads": 12, "handles": 987,
         "modules": 102, "suspicious": False, "memory_mb": 15.3},
        {"pid": 1524, "name": "svchost.exe", "ppid": 688, "user": "SYSTEM", "threads": 22, "handles": 432,
         "modules": 50, "suspicious": False, "memory_mb": 25.0},
        {"pid": 2180, "name": "explorer.exe", "ppid": 2100, "user": "user", "threads": 45, "handles": 1850,
         "modules": 230, "suspicious": False, "memory_mb": 95.2},
        {"pid": 3456, "name": "chrome.exe", "ppid": 2180, "user": "user", "threads": 55, "handles": 620,
         "modules": 180, "suspicious": False, "memory_mb": 350.0},
        # Suspicious processes
        {"pid": 6666, "name": "svchost.exe", "ppid": 2180, "user": "user", "threads": 3, "handles": 45,
         "modules": 12, "suspicious": True, "anomaly": "Unexpected parent (explorer.exe instead of services.exe)",
         "memory_mb": 42.0, "mitre": "T1055"},
        {"pid": 7777, "name": "csrss.exe", "ppid": 3456, "user": "user", "threads": 2, "handles": 18,
         "modules": 8, "suspicious": True, "anomaly": "Process masquerading — wrong parent and user context",
         "memory_mb": 8.0, "mitre": "T1036.005"},
        {"pid": 8888, "name": "rundll32.exe", "ppid": 2180, "user": "user", "threads": 5, "handles": 120,
         "modules": 25, "suspicious": True, "anomaly": "Elevated entropy in memory regions — possible packed payload",
         "memory_mb": 15.6, "mitre": "T1055.012"},
    ]
    return processes


def generate_hook_analysis():
    """Generate simulated API hook analysis results."""
    hooks = [
        {"function": "NtCreateFile", "module": "ntdll.dll", "hooked_by": "unknown_module",
         "type": "inline", "suspicious": True, "details": "JMP instruction replaced first 5 bytes"},
        {"function": "NtQuerySystemInformation", "module": "ntdll.dll", "hooked_by": "rootkit.sys",
         "type": "SSDT", "suspicious": True, "details": "System Service Dispatch Table entry modified"},
        {"function": "CreateProcessW", "module": "kernel32.dll", "hooked_by": "SecurityProduct.dll",
         "type": "inline", "suspicious": False, "details": "Known security product hook"},
        {"function": "NtReadVirtualMemory", "module": "ntdll.dll", "hooked_by": "stealth.dll",
         "type": "inline", "suspicious": True, "details": "Memory read interception — possible credential theft"},
    ]
    return hooks


def generate_injected_dlls(pid):
    """Generate simulated DLL injection results."""
    injections = []
    if random.random() > 0.5:
        injections.append({
            "dll": random.choice(SUSPICIOUS_DLLS),
            "base_address": f"0x{random.randint(0x10000000, 0x7FFFFFFF):08X}",
            "size": f"{random.randint(40, 400)} KB",
            "entry_point": f"0x{random.randint(0x10000000, 0x7FFFFFFF):08X}",
            "technique": random.choice(list(MITRE_TECHNIQUES.values())),
            "signed": False,
            "entropy": round(random.uniform(6.8, 7.99), 2),
        })
    return injections


@router.post("/analyze")
async def analyze_memory(req: MemoryDumpRequest):
    """Full memory forensics analysis."""
    start = time.time()
    
    processes = generate_process_tree()
    hooks = generate_hook_analysis()
    
    suspicious_procs = [p for p in processes if p.get("suspicious")]
    suspicious_hooks = [h for h in hooks if h.get("suspicious")]
    
    # Calculate overall threat score
    threat_score = min(100, len(suspicious_procs) * 25 + len(suspicious_hooks) * 15)
    
    # DLL injection check for suspicious processes
    injections = []
    for proc in suspicious_procs:
        inj = generate_injected_dlls(proc["pid"])
        for i in inj:
            i["target_process"] = proc["name"]
            i["target_pid"] = proc["pid"]
        injections.extend(inj)
    
    # String extraction (simulated)
    extracted_strings = [
        {"type": "url", "value": "http://evil-c2.example.com/beacon", "context": "Network callback string"},
        {"type": "file_path", "value": "C:\\Windows\\Temp\\payload.bin", "context": "Dropped file reference"},
        {"type": "registry", "value": "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "context": "Persistence key"},
        {"type": "mutex", "value": "Global\\MALWARE_MUTEX_12345", "context": "Unique malware identifier"},
        {"type": "ip", "value": "185.220.101.42", "context": "Known Tor exit node"},
    ]
    
    analysis_time = round(time.time() - start, 3)
    
    return {
        "analysis_type": req.scan_type,
        "analysis_time": f"{analysis_time}s",
        "threat_score": threat_score,
        "threat_level": "critical" if threat_score >= 75 else "high" if threat_score >= 50 else "medium" if threat_score >= 25 else "low",
        "summary": {
            "total_processes": len(processes),
            "suspicious_processes": len(suspicious_procs),
            "api_hooks_detected": len(suspicious_hooks),
            "dll_injections": len(injections),
            "suspicious_strings": len(extracted_strings),
        },
        "processes": processes,
        "suspicious_processes": suspicious_procs,
        "hooks": hooks,
        "injections": injections,
        "strings": extracted_strings,
        "mitre_mapping": [
            MITRE_TECHNIQUES.get(k) for k in MITRE_TECHNIQUES
            if any(p.get("mitre", "").startswith(MITRE_TECHNIQUES[k]["id"]) for p in suspicious_procs)
        ],
        "recommendations": [
            "Isolate host from network immediately",
            "Dump full physical memory for deeper analysis",
            "Check persistence mechanisms (registry, scheduled tasks)",
            "Cross-reference C2 IPs with threat intelligence feeds",
            "Analyze dropped files in sandbox environment",
        ]
    }


@router.get("/process-tree")
async def get_process_tree():
    """Get the current process tree."""
    return {"processes": generate_process_tree()}


@router.get("/hooks")
async def get_hooks():
    """Get API hook analysis."""
    return {"hooks": generate_hook_analysis()}
