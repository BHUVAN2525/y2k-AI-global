"""
Y2K Cyber AI — Python FastAPI Bridge
Wraps all existing ML/analysis modules and exposes them via REST API
"""

import os
import sys
import json
import hashlib
import tempfile
import logging
import shutil
from pathlib import Path
from typing import Optional, List
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Add parent directory to path to import existing modules
sys.path.insert(0, str(Path(__file__).parent.parent))

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('Y2K-Cyber-AI')

app = FastAPI(
    title="Y2K Cyber AI — Threat Intelligence API",
    description="AI-powered malware analysis engine",
    version="2.0.0"
)

# CORS for Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload directory
UPLOAD_DIR = Path(tempfile.gettempdir()) / "cerebus_uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Include sub-routers
try:
    from selfHealEngine import router as selfheal_router
    app.include_router(selfheal_router)
    logger.info("✅ Self-Heal Engine router loaded")
except Exception as e:
    logger.warning(f"⚠️ Self-Heal Engine not loaded: {e}")

try:
    from memoryForensics import router as memory_router
    app.include_router(memory_router)
    logger.info("✅ Memory Forensics router loaded")
except Exception as e:
    logger.warning(f"⚠️ Memory Forensics not loaded: {e}")

# ─── Component Initialization ────────────────────────────────────────────────

COMPONENTS = {}

def init_components():
    """Initialize all analysis components with graceful fallback"""
    global COMPONENTS

    # ML Model
    try:
        import joblib
        model_path = Path(__file__).parent.parent / "ML_model" / "malwareclassifier-V2.pkl"
        COMPONENTS['ml_model'] = joblib.load(str(model_path))
        logger.info("✅ ML model loaded")
    except Exception as e:
        COMPONENTS['ml_model'] = None
        logger.warning(f"⚠️  ML model unavailable: {e}")

    # Feature Extractor
    try:
        import feature_extraction
        COMPONENTS['feature_extractor'] = feature_extraction
        logger.info("✅ Feature extractor loaded")
    except Exception as e:
        COMPONENTS['feature_extractor'] = None
        logger.warning(f"⚠️  Feature extractor unavailable: {e}")

    # Malware Type Detector
    try:
        from malware_types import MalwareTypeDetector
        COMPONENTS['malware_type_detector'] = MalwareTypeDetector()
        logger.info("✅ Malware type detector loaded")
    except Exception as e:
        COMPONENTS['malware_type_detector'] = None
        logger.warning(f"⚠️  Malware type detector unavailable: {e}")

    # Document Analyzer
    try:
        from document_analyzer import DocumentAnalyzer
        COMPONENTS['document_analyzer'] = DocumentAnalyzer()
        logger.info("✅ Document analyzer loaded")
    except Exception as e:
        COMPONENTS['document_analyzer'] = None
        logger.warning(f"⚠️  Document analyzer unavailable: {e}")

    # VirusTotal Scanner
    try:
        from vt_api import VirusTotalScanner
        vt = VirusTotalScanner()
        COMPONENTS['vt_scanner'] = vt if vt.enabled else None
        logger.info(f"{'✅' if vt.enabled else '⚠️ '} VirusTotal scanner {'loaded' if vt.enabled else 'no API key'}")
    except Exception as e:
        COMPONENTS['vt_scanner'] = None
        logger.warning(f"⚠️  VirusTotal unavailable: {e}")

    # Dynamic Analyzer
    try:
        from dynamic_analysis import DynamicAnalyzer
        COMPONENTS['dynamic_analyzer'] = DynamicAnalyzer()
        logger.info("✅ Dynamic analyzer loaded")
    except Exception as e:
        COMPONENTS['dynamic_analyzer'] = None
        logger.warning(f"⚠️  Dynamic analyzer unavailable: {e}")

    # Model Explainer
    try:
        from model_explainer import ModelExplainer
        model_path = Path(__file__).parent.parent / "ML_model" / "malwareclassifier-V2.pkl"
        COMPONENTS['model_explainer'] = ModelExplainer(model_path=str(model_path))
        logger.info("✅ Model explainer loaded")
    except Exception as e:
        COMPONENTS['model_explainer'] = None
        logger.warning(f"⚠️  Model explainer unavailable: {e}")

init_components()

# ─── Helpers ─────────────────────────────────────────────────────────────────

def calculate_hash(file_path: str) -> dict:
    md5 = hashlib.md5()
    sha1 = hashlib.sha1()
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            md5.update(chunk)
            sha1.update(chunk)
            sha256.update(chunk)
    return {
        "md5": md5.hexdigest(),
        "sha1": sha1.hexdigest(),
        "sha256": sha256.hexdigest()
    }

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

def run_static_analysis(file_path: str) -> dict:
    """Run static analysis pipeline"""
    filename = os.path.basename(file_path)
    file_category = get_file_category(filename)
    hashes = calculate_hash(file_path)
    file_size = os.path.getsize(file_path)

    result = {
        "filename": filename,
        "file_size": file_size,
        "file_category": file_category,
        "hashes": hashes,
        "is_malware": False,
        "confidence": 0.0,
        "risk_score": 0,
        "malware_type": "Unknown",
        "timestamp": datetime.utcnow().isoformat(),
        "details": {}
    }

    # ML model analysis (executables)
    if file_category == "executable" and COMPONENTS.get('ml_model') and COMPONENTS.get('feature_extractor'):
        try:
            features = COMPONENTS['feature_extractor'].extract_features(file_path)
            prediction = COMPONENTS['ml_model'].predict(features)[0]
            confidence = 0.85
            if hasattr(COMPONENTS['ml_model'], 'predict_proba'):
                confidence = float(COMPONENTS['ml_model'].predict_proba(features)[0, 1])
            result["is_malware"] = bool(prediction == 1)
            result["confidence"] = confidence
            result["details"]["ml_model"] = {
                "prediction": int(prediction),
                "confidence": confidence
            }
        except Exception as e:
            result["details"]["ml_model"] = {"error": str(e)}

    # Malware type detection
    if COMPONENTS.get('malware_type_detector'):
        try:
            type_result = COMPONENTS['malware_type_detector'].detect_malware_type(file_path)
            if type_result.get("confidence", 0) > 0.3:
                result["is_malware"] = True
                result["confidence"] = max(result["confidence"], type_result["confidence"])
                result["malware_type"] = type_result.get("detected_type", "Unknown")
            result["details"]["malware_type"] = type_result
        except Exception as e:
            result["details"]["malware_type"] = {"error": str(e)}

    # Document analysis
    if file_category == "document" and COMPONENTS.get('document_analyzer'):
        try:
            doc_result = COMPONENTS['document_analyzer'].analyze_document(file_path)
            doc_risk = doc_result.get("risk_score", {}).get("score", 0)
            result["risk_score"] = max(result["risk_score"], doc_risk)
            if doc_risk > 70 or doc_result.get("has_suspicious_objects", False):
                result["is_malware"] = True
                result["confidence"] = max(result["confidence"], doc_risk / 100)
            result["details"]["document_analysis"] = doc_result
        except Exception as e:
            result["details"]["document_analysis"] = {"error": str(e)}

    return result

# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "components": {
            k: (v is not None) for k, v in COMPONENTS.items()
        }
    }

@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    """Static analysis + ML prediction + malware type detection"""
    # Save uploaded file
    safe_name = "".join(c for c in file.filename if c.isalnum() or c in '._-')
    file_path = str(UPLOAD_DIR / safe_name)
    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        result = run_static_analysis(file_path)
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/analyze/virustotal")
async def virustotal_check(file: UploadFile = File(...)):
    """Check file hash against VirusTotal"""
    if not COMPONENTS.get('vt_scanner'):
        raise HTTPException(status_code=503, detail="VirusTotal API key not configured")

    safe_name = "".join(c for c in file.filename if c.isalnum() or c in '._-')
    file_path = str(UPLOAD_DIR / safe_name)
    try:
        with open(file_path, "wb") as f:
            f.write(await file.read())
        result = COMPONENTS['vt_scanner'].scan_file(file_path)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/analyze/dynamic")
async def dynamic_analysis(file: UploadFile = File(...), enabled: bool = False):
    """Dynamic analysis — requires VM environment, disabled by default"""
    if not enabled:
        raise HTTPException(
            status_code=403,
            detail="Dynamic analysis is disabled by default. Enable it only in a VM environment."
        )
    if not COMPONENTS.get('dynamic_analyzer'):
        raise HTTPException(status_code=503, detail="Dynamic analyzer not available")

    safe_name = "".join(c for c in file.filename if c.isalnum() or c in '._-')
    file_path = str(UPLOAD_DIR / safe_name)
    try:
        with open(file_path, "wb") as f:
            f.write(await file.read())
        result = COMPONENTS['dynamic_analyzer'].analyze_file(file_path)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/explain")
async def explain_prediction(file: UploadFile = File(...)):
    """SHAP explanation for ML prediction"""
    if not COMPONENTS.get('model_explainer') or not COMPONENTS.get('feature_extractor'):
        raise HTTPException(status_code=503, detail="Model explainer not available")

    safe_name = "".join(c for c in file.filename if c.isalnum() or c in '._-')
    file_path = str(UPLOAD_DIR / safe_name)
    try:
        with open(file_path, "wb") as f:
            f.write(await file.read())

        features = COMPONENTS['feature_extractor'].extract_features(file_path)
        # Get feature names
        feature_names = getattr(COMPONENTS['feature_extractor'], 'FEATURE_NAMES', 
                                [f"feature_{i}" for i in range(len(features[0]))])
        explanation = COMPONENTS['model_explainer'].explain_prediction(features[0], feature_names)
        return JSONResponse(content=explanation)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/batch")
async def batch_analyze(files: List[UploadFile] = File(...)):
    """Analyze multiple files"""
    results = []
    for file in files:
        safe_name = "".join(c for c in file.filename if c.isalnum() or c in '._-')
        file_path = str(UPLOAD_DIR / safe_name)
        try:
            # Safer reading and processing
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            
            result = run_static_analysis(file_path)
            results.append(result)
        except Exception as e:
            logger.error(f"Batch file error ({file.filename}): {e}")
            results.append({
                "filename": file.filename, 
                "error": str(e),
                "is_malware": False,
                "confidence": 0.0,
                "file_category": get_file_category(file.filename)
            })
        finally:
            if os.path.exists(file_path):
                try: os.remove(file_path)
                except: pass
    return JSONResponse(content={"results": results, "total": len(results)})

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
