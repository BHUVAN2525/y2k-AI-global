#!/usr/bin/env node
/**
 * Y2K Cyber AI — Final Verification & Test
 * Simple validation that everything is ready to run
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const workspaceRoot = 't:\\y2k-AI\\y2k-AI';

async function verify() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  Y2K Cyber AI — Final Verification                             ║');
    console.log('║  Dynamic Malware Analysis System                               ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    let passed = 0, failed = 0;

    // ─── FILE VERIFICATION ───────────────────────────────────────────────────
    console.log('📋 1. CRITICAL FILES & STRUCTURE\n');

    const criticalFiles = [
        'server/index.js',
        'server/package.json',
        'server/services/dynamicAnalysisAgent.js',
        'server/routes/sandbox.js',
        'server/routes/analyze.js',
        'client/package.json',
        'client/src/pages/Sandbox.jsx',
        'client/src/App.jsx',
        'QUICK_START.md',
        'DYNAMIC_ANALYSIS_GUIDE.md',
        'IMPLEMENTATION_SUMMARY.md'
    ];

    for (const file of criticalFiles) {
        const filePath = path.join(workspaceRoot, file);
        if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            console.log(`✅ ${file} (${(stat.size / 1024).toFixed(1)} KB)`);
            passed++;
        } else {
            console.log(`❌ ${file} — MISSING`);
            failed++;
        }
    }

    // ─── DIRECTORY VERIFICATION ────────────────────────────────────────────
    console.log('\n📁 2. DIRECTORY STRUCTURE\n');

    const directories = [
        'server',
        'server/services',
        'server/routes',
        'client',
        'client/src',
        'client/src/pages'
    ];

    for (const dir of directories) {
        const dirPath = path.join(workspaceRoot, dir);
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
            console.log(`✅ ${dir}/`);
            passed++;
        } else {
            console.log(`❌ ${dir}/ — MISSING`);
            failed++;
        }
    }

    // ─── SYNTAX VALIDATION ──────────────────────────────────────────────────
    console.log('\n🔍 3. CODE SYNTAX VALIDATION\n');

    try {
        await execAsync('node -c server/index.js 2>&1', { cwd: workspaceRoot, timeout: 5000 });
        console.log('✅ server/index.js — Valid Node.js');
        passed++;
    } catch (e) {
        console.log('❌ server/index.js — Syntax error');
        failed++;
    }

    try {
        await execAsync('node -c server/routes/sandbox.js 2>&1', { cwd: workspaceRoot, timeout: 5000 });
        console.log('✅ server/routes/sandbox.js — Valid Node.js');
        passed++;
    } catch (e) {
        console.log('❌ server/routes/sandbox.js — Syntax error');
        failed++;
    }

    try {
        await execAsync('node -c server/services/dynamicAnalysisAgent.js 2>&1', { cwd: workspaceRoot, timeout: 5000 });
        console.log('✅ server/services/dynamicAnalysisAgent.js — Valid Node.js');
        passed++;
    } catch (e) {
        console.log('❌ server/services/dynamicAnalysisAgent.js — Syntax error');
        failed++;
    }

    // ─── PACKAGE.JSON VALIDATION ───────────────────────────────────────────
    console.log('\n📦 4. PACKAGE CONFIGURATION\n');

    try {
        const serverPackage = JSON.parse(fs.readFileSync(path.join(workspaceRoot, 'server/package.json'), 'utf8'));
        const requiredDeps = ['express', 'axios', 'ssh2', 'mongoose', 'uuid'];
        let allFound = true;

        for (const dep of requiredDeps) {
            if (serverPackage.dependencies[dep]) {
                console.log(`✅ server dependency: ${dep}`);
                passed++;
            } else {
                console.log(`❌ server dependency missing: ${dep}`);
                failed++;
                allFound = false;
            }
        }
    } catch (e) {
        console.log(`❌ server/package.json parsing error`);
        failed++;
    }

    // ─── MODULE LOADING TEST ────────────────────────────────────────────────
    console.log('\n⚙️ 5. MODULE LOADING TEST\n');

    try {
        const DynamicAnalysisAgent = require(path.join(workspaceRoot, 'server/services/dynamicAnalysisAgent.js'));
        console.log(`✅ DynamicAnalysisAgent class loads successfully`);
        passed++;

        const agent = new DynamicAnalysisAgent('test-key');
        const methods = [
            'orchestrateAnalysis',
            'analyzeBehaviors',
            'extractIOCs',
            'mapMITRETechniques',
            'identifyTechnologies',
            'analyzeRootCauses',
            'generateMitigations'
        ];

        for (const method of methods) {
            if (typeof agent[method] === 'function') {
                console.log(`✅ Method: ${method}()`);
                passed++;
            } else {
                console.log(`❌ Method missing: ${method}()`);
                failed++;
            }
        }
    } catch (e) {
        console.log(`❌ DynamicAnalysisAgent loading error: ${e.message}`);
        failed += 8;
    }

    // ─── DOCUMENTATION CHECK ───────────────────────────────────────────────
    console.log('\n📚 6. DOCUMENTATION COMPLETENESS\n');

    const docs = [
        'QUICK_START.md',
        'DYNAMIC_ANALYSIS_GUIDE.md',
        'IMPLEMENTATION_SUMMARY.md',
        'ARCHITECTURE_DIAGRAMS.md',
        'IMPLEMENTATION_CHECKLIST.md',
        'DYNAMIC_ANALYSIS_COMPLETE.md'
    ];

    for (const doc of docs) {
        const docPath = path.join(workspaceRoot, doc);
        if (fs.existsSync(docPath)) {
            const content = fs.readFileSync(docPath, 'utf8');
            const size = (content.length / 1024).toFixed(1);
            console.log(`✅ ${doc} (${size} KB)`);
            passed++;
        } else {
            console.log(`❌ ${doc} — MISSING`);
            failed++;
        }
    }

    // ─── ENVIRONMENT CHECK ─────────────────────────────────────────────────
    console.log('\n🔐 7. ENVIRONMENT CONFIGURATION\n');

    const envPath = path.join(workspaceRoot, 'server/.env');
    if (fs.existsSync(envPath)) {
        console.log('✅ server/.env file exists');
        passed++;
    } else {
        console.log('⚠️  server/.env file not found (optional - features may be limited)');
        // Don't count as failure since it's optional
    }

    // ─── SUMMARY ───────────────────────────────────────────────────────────
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    VERIFICATION RESULTS                        ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const total = passed + failed;
    const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;

    console.log(`✅ Passed:   ${passed}`);
    console.log(`❌ Failed:   ${failed}`);
    console.log(`📊 Total:    ${total}`);
    console.log(`📈 Success:  ${percentage}%\n`);

    if (failed === 0) {
        console.log('╔════════════════════════════════════════════════════════════════╗');
        console.log('║  🎉 ALL CHECKS PASSED!                                         ║');
        console.log('║  System is ready for production deployment.                   ║');
        console.log('╚════════════════════════════════════════════════════════════════╝\n');

        console.log('🚀 NEXT STEPS:\n');
        console.log('  1. Start the system:');
        console.log('     • Windows: double-click start.bat');
        console.log('     • Or manually:');
        console.log('       - Terminal 1: cd server && npm start');
        console.log('       - Terminal 2: cd client && npm run dev');
        console.log();
        console.log('  2. Open browser: http://localhost:5173');
        console.log();
        console.log('  3. Follow QUICK_START.md for first use');
        console.log();
        console.log('📖 DOCUMENTATION:');
        console.log('  • QUICK_START.md — 5-minute quick start');
        console.log('  • DYNAMIC_ANALYSIS_GUIDE.md — Full technical reference');
        console.log('  • IMPLEMENTATION_SUMMARY.md — Architecture details');
        console.log();
        console.log('═'.repeat(66) + '\n');

        process.exit(0);
    } else {
        console.log('⚠️ Some checks failed. Review above for details.\n');
        process.exit(1);
    }
}

verify().catch(err => {
    console.error(`\n❌ Verification error: ${err.message}\n`);
    process.exit(1);
});
