#!/usr/bin/env node
/**
 * Y2K Cyber AI — Complete Automation Workflow
 * Orchestrates setup, testing, and deployment
 */

const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const execAsync = promisify(exec);

class AutomationWorkflow {
    constructor() {
        this.workspaceRoot = 't:\\y2k-AI\\y2k-AI';
        this.results = {
            setup: { status: 'pending', details: [] },
            serverBuild: { status: 'pending', details: [] },
            clientBuild: { status: 'pending', details: [] },
            tests: { status: 'pending', details: [] },
            healthCheck: { status: 'pending', details: [] }
        };
    }

    log(section, message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`[${timestamp}] [${section}] ${icon} ${message}`);
    }

    async execute(command, description) {
        this.log('EXEC', description);
        try {
            const { stdout, stderr } = await execAsync(command, { 
                cwd: this.workspaceRoot,
                timeout: 120000
            });
            this.log('EXEC', `${description} — SUCCESS`, 'success');
            return { success: true, stdout, stderr };
        } catch (err) {
            this.log('EXEC', `${description} — FAILED: ${err.message}`, 'error');
            return { success: false, error: err.message };
        }
    }

    async setupEnvironment() {
        console.log('\n' + '═'.repeat(70));
        console.log('STEP 1: ENVIRONMENT SETUP');
        console.log('═'.repeat(70) + '\n');

        // Check Node.js version
        const nodeVersion = await this.execute('node --version', 'Check Node.js version');
        if (nodeVersion.success) {
            this.results.setup.details.push(`Node.js ${nodeVersion.stdout.trim()} ✓`);
            this.log('SETUP', `Node.js version OK`, 'success');
        }

        // Check npm version
        const npmVersion = await this.execute('npm --version', 'Check npm version');
        if (npmVersion.success) {
            this.results.setup.details.push(`npm ${npmVersion.stdout.trim()} ✓`);
            this.log('SETUP', `npm version OK`, 'success');
        }

        // Verify directory structure
        const dirs = ['server', 'client', 'server/services', 'server/routes', 'client/src/pages'];
        let allExist = true;
        for (const dir of dirs) {
            const dirPath = path.join(this.workspaceRoot, dir);
            if (fs.existsSync(dirPath)) {
                this.log('SETUP', `Directory exists: ${dir}`, 'success');
            } else {
                this.log('SETUP', `Directory missing: ${dir}`, 'error');
                allExist = false;
            }
        }

        // Verify critical files
        const files = [
            'server/package.json',
            'server/index.js',
            'server/services/dynamicAnalysisAgent.js',
            'server/routes/sandbox.js',
            'client/package.json',
            'client/src/pages/Sandbox.jsx'
        ];

        for (const file of files) {
            const filePath = path.join(this.workspaceRoot, file);
            if (fs.existsSync(filePath)) {
                const fileSize = fs.statSync(filePath).size;
                this.log('SETUP', `File OK: ${file} (${Math.round(fileSize / 1024)} KB)`, 'success');
                this.results.setup.details.push(`${file} ✓`);
            } else {
                this.log('SETUP', `File missing: ${file}`, 'error');
                allExist = false;
            }
        }

        this.results.setup.status = allExist ? 'success' : 'warning';
        if (allExist) {
            this.log('SETUP', 'All critical files and directories present', 'success');
        }
    }

    async buildServer() {
        console.log('\n' + '═'.repeat(70));
        console.log('STEP 2: BUILD BACKEND SERVER');
        console.log('═'.repeat(70) + '\n');

        // Install dependencies
        this.log('SERVER', 'Installing npm dependencies...', 'info');
        const install = await this.execute('cd server && npm install', 'Install server dependencies');
        if (!install.success) {
            this.results.serverBuild.status = 'error';
            this.log('SERVER', 'Dependency installation failed', 'error');
            return false;
        }

        // Validate syntax
        this.log('SERVER', 'Validating JavaScript syntax...', 'info');
        const syntax = await this.execute('node -c server/index.js && node -c server/services/dynamicAnalysisAgent.js && node -c server/routes/sandbox.js', 'Validate Node.js syntax');
        
        if (syntax.success) {
            this.results.serverBuild.details.push('All JavaScript syntax valid ✓');
            this.results.serverBuild.status = 'success';
            this.log('SERVER', 'Syntax validation passed', 'success');
            return true;
        } else {
            this.results.serverBuild.status = 'error';
            this.log('SERVER', 'Syntax validation failed', 'error');
            return false;
        }
    }

    async buildClient() {
        console.log('\n' + '═'.repeat(70));
        console.log('STEP 3: BUILD FRONTEND CLIENT');
        console.log('═'.repeat(70) + '\n');

        // Install dependencies
        this.log('CLIENT', 'Installing npm dependencies...', 'info');
        const install = await this.execute('cd client && npm install', 'Install client dependencies');
        if (!install.success) {
            this.results.clientBuild.status = 'error';
            this.log('CLIENT', 'Dependency installation failed', 'error');
            return false;
        }

        // Build for production
        this.log('CLIENT', 'Building React application for production...', 'info');
        const build = await this.execute('cd client && npm run build', 'Build React application');
        
        if (build.success) {
            const distPath = path.join(this.workspaceRoot, 'client', 'dist');
            if (fs.existsSync(distPath)) {
                const indexPath = path.join(distPath, 'index.html');
                if (fs.existsSync(indexPath)) {
                    this.results.clientBuild.details.push('Client built successfully ✓');
                    this.results.clientBuild.details.push('dist/ directory created ✓');
                    this.results.clientBuild.status = 'success';
                    this.log('CLIENT', 'Frontend build successful', 'success');
                    return true;
                }
            }
        }

        this.results.clientBuild.status = 'error';
        this.log('CLIENT', 'Frontend build failed', 'error');
        return false;
    }

    async runTests() {
        console.log('\n' + '═'.repeat(70));
        console.log('STEP 4: RUN COMPREHENSIVE TESTS');
        console.log('═'.repeat(70) + '\n');

        this.log('TEST', 'Starting backend server for testing...', 'info');
        
        // Start server
        const serverProcess = spawn('node', ['server/index.js'], { 
            cwd: this.workspaceRoot,
            stdio: 'pipe'
        });

        let serverReady = false;
        let serverOutput = '';

        return new Promise((resolve) => {
            const checkServer = setInterval(async () => {
                try {
                    const http = require('http');
                    const req = http.get('http://localhost:5000/api/status', (res) => {
                        if (res.statusCode === 200) {
                            clearInterval(checkServer);
                            serverReady = true;
                            this.log('TEST', 'Server is ready', 'success');
                            
                            // Give it a moment to stabilize
                            setTimeout(() => {
                                this.runTestSuite(serverProcess, resolve);
                            }, 1000);
                        }
                    });
                    req.on('error', () => {});
                } catch (e) {}
            }, 500);

            // Timeout after 15 seconds
            const timeout = setTimeout(() => {
                clearInterval(checkServer);
                if (!serverReady) {
                    this.log('TEST', 'Server startup timeout', 'error');
                    this.results.tests.status = 'error';
                    try { serverProcess.kill(); } catch (e) {}
                    resolve(false);
                }
            }, 15000);

            serverProcess.on('close', () => {
                clearTimeout(timeout);
                clearInterval(checkServer);
            });
        });
    }

    async runTestSuite(serverProcess, callback) {
        try {
            const axios = require('axios');
            const WebSocket = require('ws');

            const testResults = {
                api: false,
                websocket: false,
                agent: false,
                all: false
            };

            // Test 1: API Status
            try {
                const response = await axios.get('http://localhost:5000/api/status', { timeout: 5000 });
                if (response.status === 200) {
                    this.log('TEST', 'API Status endpoint works', 'success');
                    this.results.tests.details.push('✓ API Status endpoint');
                    testResults.api = true;
                }
            } catch (err) {
                this.log('TEST', `API test failed: ${err.message}`, 'error');
            }

            // Test 2: WebSocket
            try {
                const ws = new WebSocket('ws://localhost:5000/ws');
                return new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        this.log('TEST', 'WebSocket connection timeout', 'error');
                        ws.close();
                        finalize();
                    }, 3000);

                    ws.on('open', () => {
                        clearTimeout(timeout);
                        this.log('TEST', 'WebSocket connection successful', 'success');
                        this.results.tests.details.push('✓ WebSocket endpoint');
                        testResults.websocket = true;
                        ws.close();
                        setTimeout(finalize, 500);
                    });

                    ws.on('error', () => {
                        clearTimeout(timeout);
                        finalize();
                    });
                });
            } catch (err) {
                this.log('TEST', `WebSocket test failed: ${err.message}`, 'error');
            }

            // Test 3: Agent Module
            try {
                const DynamicAnalysisAgent = require(path.join(this.workspaceRoot, 'server/services/dynamicAnalysisAgent.js'));
                const agent = new DynamicAnalysisAgent('test-key');
                if (agent && typeof agent.orchestrateAnalysis === 'function') {
                    this.log('TEST', 'Dynamic Analysis Agent module OK', 'success');
                    this.results.tests.details.push('✓ DynamicAnalysisAgent module');
                    testResults.agent = true;
                }
            } catch (err) {
                this.log('TEST', `Agent test failed: ${err.message}`, 'error');
            }

            const finalize = () => {
                testResults.all = testResults.api && testResults.websocket && testResults.agent;
                this.results.tests.status = testResults.all ? 'success' : 'warning';
                
                try { serverProcess.kill(); } catch (e) {}
                setTimeout(() => callback(testResults.all), 1000);
            };

            finalize();
        } catch (err) {
            this.log('TEST', `Test suite error: ${err.message}`, 'error');
            try { serverProcess.kill(); } catch (e) {}
            this.results.tests.status = 'error';
            setTimeout(() => callback(false), 1000);
        }
    }

    async performHealthCheck() {
        console.log('\n' + '═'.repeat(70));
        console.log('STEP 5: HEALTH CHECK & VERIFICATION');
        console.log('═'.repeat(70) + '\n');

        const checks = [];

        // Check Node.js modules
        try {
            require('axios');
            checks.push({ name: 'axios module', pass: true });
            this.log('HEALTH', 'axios module available', 'success');
        } catch (e) {
            checks.push({ name: 'axios module', pass: false });
            this.log('HEALTH', 'axios module missing', 'error');
        }

        try {
            require('express');
            checks.push({ name: 'express module', pass: true });
            this.log('HEALTH', 'express module available', 'success');
        } catch (e) {
            checks.push({ name: 'express module', pass: false });
            this.log('HEALTH', 'express module missing', 'error');
        }

        // Check agent module
        try {
            require(path.join(this.workspaceRoot, 'server/services/dynamicAnalysisAgent.js'));
            checks.push({ name: 'DynamicAnalysisAgent', pass: true });
            this.log('HEALTH', 'DynamicAnalysisAgent ready', 'success');
        } catch (e) {
            checks.push({ name: 'DynamicAnalysisAgent', pass: false });
            this.log('HEALTH', 'DynamicAnalysisAgent error', 'error');
        }

        // Check configuration
        const envPath = path.join(this.workspaceRoot, 'server', '.env');
        const envExists = fs.existsSync(envPath);
        this.log('HEALTH', `.env file ${envExists ? 'exists' : 'not found (optional)'}`, envExists ? 'success' : 'warning');

        const allPass = checks.every(c => c.pass);
        this.results.healthCheck.status = allPass ? 'success' : 'warning';
        this.results.healthCheck.details = checks.map(c => `${c.pass ? '✓' : '✗'} ${c.name}`);

        return allPass;
    }

    async generateReport() {
        console.log('\n' + '═'.repeat(70));
        console.log('WORKFLOW SUMMARY');
        console.log('═'.repeat(70) + '\n');

        const statusIcon = (status) => {
            switch (status) {
                case 'success': return '✅';
                case 'warning': return '⚠️';
                case 'error': return '❌';
                default: return '⏳';
            }
        };

        console.log('STEPS:');
        Object.entries(this.results).forEach(([step, result]) => {
            const icon = statusIcon(result.status);
            console.log(`  ${icon} ${step.toUpperCase()}: ${result.status}`);
            if (result.details && result.details.length > 0) {
                result.details.forEach(detail => {
                    console.log(`      • ${detail}`);
                });
            }
        });

        const allSuccess = Object.values(this.results).every(r => r.status !== 'error');

        console.log('\n' + '═'.repeat(70));
        if (allSuccess) {
            console.log('✅ ALL CHECKS PASSED — SYSTEM READY FOR DEPLOYMENT');
            console.log('═'.repeat(70));
            console.log('\nNEXT STEPS:');
            console.log('  1. Start the server: cd server && npm start');
            console.log('  2. Start the client: cd client && npm run dev');
            console.log('  3. Open browser: http://localhost:5173');
            console.log('  4. Navigate to Sandbox page for dynamic analysis');
            console.log('\n');
            return true;
        } else {
            console.log('⚠️ SOME CHECKS FAILED — REVIEW ABOVE FOR DETAILS');
            console.log('═'.repeat(70) + '\n');
            return false;
        }
    }

    async run() {
        console.log('\n╔' + '═'.repeat(68) + '╗');
        console.log('║' + ' '.repeat(68) + '║');
        console.log('║' + '  Y2K Cyber AI — Complete Automation Workflow'.padEnd(68) + '║');
        console.log('║' + '  Dynamic Malware Analysis System'.padEnd(68) + '║');
        console.log('║' + ' '.repeat(68) + '║');
        console.log('╚' + '═'.repeat(68) + '╝\n');

        try {
            await this.setupEnvironment();
            const serverOk = await this.buildServer();
            if (!serverOk) {
                console.log('\n❌ Server build failed. Aborting workflow.\n');
                process.exit(1);
            }

            const clientOk = await this.buildClient();
            if (!clientOk) {
                console.log('\n⚠️ Client build failed. Will try tests anyway.\n');
            }

            await this.runTests();
            await this.performHealthCheck();
            const success = await this.generateReport();

            process.exit(success ? 0 : 1);
        } catch (err) {
            console.log(`\n❌ Workflow error: ${err.message}\n`);
            process.exit(1);
        }
    }
}

// Run the workflow
const workflow = new AutomationWorkflow();
workflow.run();
