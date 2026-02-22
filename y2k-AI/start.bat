@echo off
setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     Y2K Cyber AI — Dynamic Malware Analysis System            ║
echo ║     Complete Start Script                                     ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected
echo ✅ npm detected
echo.

REM Clean up any existing processes
echo 🧹 Cleaning up existing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak

echo.
echo 📊 Step 1/2: Starting Node.js Backend Server (port 5000)
echo ────────────────────────────────────────────────────────────────
cd /d "%~dp0server"
start "Y2K Backend" cmd /k "call npm start"
timeout /t 5 /nobreak

echo.
echo 🎨 Step 2/2: Starting React Frontend Dev Server (port 5173)
echo ────────────────────────────────────────────────────────────────
cd /d "%~dp0client"
start "Y2K Frontend" cmd /k "call npm run dev"
timeout /t 3 /nobreak

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                   ✅ SYSTEM STARTED                              ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 📊 Backend (Node/Express/MongoDB): http://localhost:5000
echo 🎨 Frontend (React/Vite):         http://localhost:5173
echo.
echo 🚀 QUICK START:
echo    1. Open browser: http://localhost:5173
echo    2. Click "Sandbox" in left sidebar
echo    3. Enter your VM SSH credentials
echo    4. Upload malware sample
echo    5. Click Execute, then Analyze
echo    6. Review comprehensive report
echo.
echo 📚 DOCUMENTATION:
echo    Quick Start:           QUICK_START.md
echo    Full Reference:        DYNAMIC_ANALYSIS_GUIDE.md
echo    Architecture Guide:    IMPLEMENTATION_SUMMARY.md
echo    System Diagrams:       ARCHITECTURE_DIAGRAMS.md
echo.
echo ✨ NEW FEATURES:
echo    • Agentic AI orchestration (6-step analysis pipeline)
echo    • IOC extraction (IPs, domains, files, registry, URLs)
echo    • MITRE ATT&CK technique mapping
echo    • Technology/framework identification
echo    • Root cause and attack chain analysis
echo    • Response playbook generation
echo    • Consolidated verdict with confidence scoring
echo.
echo 💡 TIPS:
echo    • Each analysis takes 30-45 seconds
echo    • Requires API keys: GEMINI_API_KEY, VT_API_KEY
echo    • Works without API keys (uses heuristic fallback)
echo    • MongoDB optional (uses in-memory fallback)
echo.
echo 🛑 To stop servers: Close the command windows or press Ctrl+C
echo.
pause
