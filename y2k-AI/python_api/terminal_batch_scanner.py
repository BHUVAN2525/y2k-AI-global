#!/usr/bin/env python3
"""
Y2K Cyber AI — Terminal Batch Scanner
A high-performance standalone script to recursively scan directories for malware
using the existing ML and Static Analysis models.
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# Add the parent directory to the path so we can import the models
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from document_analyzer import DocumentAnalyzer
from malware_types import MalwareTypeDetector
from feature_extraction import extract_features
import joblib

# ANSI Colors for Terminal
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

# Initialize the global components once to save time
COMPONENTS = {}

def init_components():
    print(f"{Colors.CYAN}Initializing AI Analysis Engines...{Colors.ENDC}")
    
    # 1. Document Analyzer
    try:
        COMPONENTS['doc'] = DocumentAnalyzer()
        print(f"  [{Colors.GREEN}OK{Colors.ENDC}] Document Analyzer")
    except Exception as e:
        print(f"  [{Colors.WARNING}WARN{Colors.ENDC}] Document Analyzer: {e}")
        COMPONENTS['doc'] = None

    # 2. Malware Type Detector
    try:
        COMPONENTS['type'] = MalwareTypeDetector()
        print(f"  [{Colors.GREEN}OK{Colors.ENDC}] Signature Engine")
    except Exception as e:
        print(f"  [{Colors.WARNING}WARN{Colors.ENDC}] Signature Engine: {e}")
        COMPONENTS['type'] = None

    # 3. Machine Learning Model (for Executables)
    try:
        model_path = project_root / "ML_model" / "malwareclassifier-V2.pkl"
        COMPONENTS['ml'] = joblib.load(str(model_path))
        print(f"  [{Colors.GREEN}OK{Colors.ENDC}] Deep Learning Model")
    except Exception as e:
        print(f"  [{Colors.WARNING}WARN{Colors.ENDC}] Deep Learning Model: {e}")
        COMPONENTS['ml'] = None

def get_file_category(filename: str) -> str:
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    categories = {
        'executable': {'exe', 'dll', 'sys', 'ocx', 'com', 'scr'},
        'document': {'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'rtf'},
        'script': {'js', 'py', 'ps1', 'vbs', 'bat', 'sh', 'cmd'},
        'archive': {'zip', 'rar', '7z', 'tar', 'gz'}
    }
    for cat, exts in categories.items():
        if ext in exts:
            return cat
    return 'unknown'

def analyze_single_file(file_path: str):
    """Core analysis logic for a single file"""
    import hashlib
    
    filename = os.path.basename(file_path)
    file_category = get_file_category(filename)
    
    # Base Result Structure
    result = {
        "file_path": file_path,
        "filename": filename,
        "category": file_category,
        "size_bytes": os.path.getsize(file_path),
        "is_malware": False,
        "confidence": 0.0,
        "risk_score": 0,
        "malware_type": "None",
        "error": None
    }
    
    # Calculate simple SHA256
    try:
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256.update(chunk)
        result["sha256"] = sha256.hexdigest()
    except Exception as e:
        result["error"] = f"Hash error: {e}"
        return result

    try:
        # Route 1: EXECUTABLES go to the Machine Learning Model
        if file_category == "executable" and COMPONENTS.get('ml'):
            features = extract_features(file_path)
            prediction = COMPONENTS['ml'].predict(features)[0]
            
            if hasattr(COMPONENTS['ml'], 'predict_proba'):
                confidence = float(COMPONENTS['ml'].predict_proba(features)[0, 1])
            else:
                confidence = 0.85 if prediction == 1 else 0.15
                
            result["is_malware"] = bool(prediction == 1)
            result["confidence"] = confidence
            result["risk_score"] = int(confidence * 100)
            
            if result["is_malware"] and COMPONENTS.get('type'):
                type_res = COMPONENTS['type'].detect_malware_type(file_path)
                result["malware_type"] = type_res.get("detected_type", "Generic Trojan")

        # Route 2: DOCUMENTS go to the Document Analyzer
        elif file_category == "document" and COMPONENTS.get('doc'):
            doc_res = COMPONENTS['doc'].analyze_document(file_path)
            risk = doc_res.get("risk_score", {}).get("score", 0)
            result["risk_score"] = risk
            
            if risk > 70 or doc_res.get("has_suspicious_objects", False):
                result["is_malware"] = True
                result["confidence"] = risk / 100.0
                result["malware_type"] = "Malicious Document"

        # Route 3: SCRIPTS / OTHERS go through basic signatures
        elif COMPONENTS.get('type'):
            type_res = COMPONENTS['type'].detect_malware_type(file_path)
            if type_res.get("confidence", 0) > 0.4:
                result["is_malware"] = True
                result["confidence"] = type_res["confidence"]
                result["malware_type"] = type_res.get("detected_type", "Suspicious Script")
                result["risk_score"] = int(type_res["confidence"] * 100)

    except Exception as e:
        result["error"] = str(e)
        
    return result

def print_result_line(result, current, total):
    """Prints a single line of output for a file scan"""
    prefix = f"[{current}/{total}] "
    name = result['filename'][:30].ljust(30)
    
    if result.get("error"):
        print(f"{prefix}{name} {Colors.WARNING}ERROR: {result['error'][:40]}{Colors.ENDC}")
        return

    if result["is_malware"]:
        conf = f"{result['confidence']*100:.0f}%"
        status = f"{Colors.FAIL}MALWARE DETECTED{Colors.ENDC}"
        details = f"(Type: {result['malware_type']} | Score: {result['risk_score']})"
        print(f"{prefix}{name} {status} - {details}")
    else:
        status = f"{Colors.GREEN}CLEAN{Colors.ENDC}"
        print(f"{prefix}{name} {status} - (Score: {result['risk_score']})")

def main():
    parser = argparse.ArgumentParser(description="Y2K Cyber AI — High-Speed Bulk Malware Scanner")
    parser.add_argument("directory", help="Directory path to scan")
    parser.add_argument("-t", "--threads", type=int, default=4, help="Number of concurrent scanner threads (default 4)")
    parser.add_argument("-o", "--output", help="Save detailed JSON report to this file")
    args = parser.parse_args()

    scan_dir = Path(args.directory)
    if not scan_dir.exists() or not scan_dir.is_dir():
        print(f"{Colors.FAIL}Error: {scan_dir} is not a valid directory.{Colors.ENDC}")
        sys.exit(1)

    print(f"\n{Colors.HEADER}{Colors.BOLD}============================================================{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}           Y2K CYBER AI - BATCH DIRECTORY SCANNER           {Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}============================================================{Colors.ENDC}\n")

    init_components()

    # Find all files
    print(f"\n{Colors.CYAN}Indexing files in {scan_dir}...{Colors.ENDC}")
    all_files = []
    for root, _, files in os.walk(scan_dir):
        for file in files:
            all_files.append(os.path.join(root, file))
            
    total_files = len(all_files)
    print(f"Found {total_files} files to scan.\n")
    
    if total_files == 0:
        print("Nothing to do.")
        sys.exit(0)

    # Scan with ThreadPool
    results = []
    malware_count = 0
    clean_count = 0
    error_count = 0
    
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=args.threads) as executor:
        # Map futures to file paths
        future_to_file = {executor.submit(analyze_single_file, f): f for f in all_files}
        
        count = 0
        for future in as_completed(future_to_file):
            count += 1
            file_path = future_to_file[future]
            try:
                res = future.result()
                results.append(res)
                
                if res.get("error"):
                    error_count += 1
                elif res["is_malware"]:
                    malware_count += 1
                else:
                    clean_count += 1
                    
                print_result_line(res, count, total_files)
                
            except Exception as exc:
                print(f"[{count}/{total_files}] {os.path.basename(file_path)} {Colors.FAIL}FATAL EXCEPTION: {exc}{Colors.ENDC}")
                error_count += 1

    elapsed = time.time() - start_time
    
    # Save Report
    report_file = args.output
    if not report_file:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = f"y2k_batch_report_{timestamp}.json"
        
    report_data = {
        "scan_directory": str(scan_dir),
        "timestamp": datetime.now().isoformat(),
        "elapsed_seconds": round(elapsed, 2),
        "total_files": total_files,
        "summary": {
            "malware_detected": malware_count,
            "clean_files": clean_count,
            "errors": error_count
        },
        "results": results
    }
    
    try:
        with open(report_file, 'w') as f:
            json.dump(report_data, f, indent=4)
    except Exception as e:
        print(f"\n{Colors.WARNING}Failed to save JSON report: {e}{Colors.ENDC}")

    # Final Summary
    print(f"\n{Colors.HEADER}======================= SCAN COMPLETE ======================={Colors.ENDC}")
    print(f"Time Elapsed   : {elapsed:.2f} seconds ({total_files/elapsed:.1f} files/sec)")
    print(f"Total Scanned  : {total_files}")
    print(f"Errors/Skipped : {error_count}")
    print(f"Clean Files    : {Colors.GREEN}{clean_count}{Colors.ENDC}")
    print(f"Malware Found  : {Colors.FAIL}{Colors.BOLD}{malware_count}{Colors.ENDC}")
    print(f"Detailed Report: {Colors.CYAN}{os.path.abspath(report_file)}{Colors.ENDC}")
    print(f"{Colors.HEADER}============================================================={Colors.ENDC}\n")

if __name__ == "__main__":
    main()
