/**
 * Y2K Cyber AI — Comprehensive Test Suite
 * Tests all critical functionality for dynamic malware analysis
 */

const axios = require('axios');
const http = require('http');

const BASE_URL = 'http://localhost:5000';
const TIMEOUT = 10000;

class TestSuite {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    async runAllTests() {
        console.log('\n╔════════════════════════════════════════════════════════════════╗');
        console.log('║  Y2K Cyber AI — Comprehensive Test Suite                       ║');
        console.log('║  Dynamic Malware Analysis System                               ║');
        console.log('╚════════════════════════════════════════════════════════════════╝\n');

        // Test 1: Server Health
        await this.testServerHealth();

        // Test 2: API Endpoints Exist
        await this.testAPIEndpoints();

        // Test 3: Request Validation
        await this.testRequestValidation();

        // Test 4: Error Handling
        await this.testErrorHandling();

        // Test 5: Response Structure
        await this.testResponseStructure();

        // Test 6: Dynamic Analysis Agent Module
        await this.testDynamicAnalysisAgent();

        // Test 7: WebSocket Connectivity
        await this.testWebSocket();

        this.printResults();
    }

    async testServerHealth() {
        console.log('📋 TEST 1: Server Health Check');
        console.log('─'.repeat(60));

        try {
            const health = await this.apiCall('/api/status');
            const checks = [
                { name: 'Server operational', result: health.services?.node_server === 'operational' },
                { name: 'Timestamp exists', result: !!health.timestamp },
                { name: 'Services object exists', result: !!health.services }
            ];

            checks.forEach(check => {
                if (check.result) {
                    this.pass(`✅ ${check.name}`);
                } else {
                    this.fail(`❌ ${check.name}`);
                }
            });
        } catch (err) {
            this.fail(`❌ Server unreachable: ${err.message}`);
        }
        console.log();
    }

    async testAPIEndpoints() {
        console.log('📋 TEST 2: API Endpoints Validation');
        console.log('─'.repeat(60));

        const endpoints = [
            { method: 'GET', path: '/api/status', expectedStatus: 200 },
            { method: 'GET', path: '/api/sandbox/sessions', expectedStatus: 200 }
        ];

        for (const ep of endpoints) {
            try {
                const response = await axios.get(`${BASE_URL}${ep.path}`, { timeout: TIMEOUT });
                if (response.status === ep.expectedStatus) {
                    this.pass(`✅ ${ep.method} ${ep.path} [${response.status}]`);
                } else {
                    this.fail(`❌ ${ep.method} ${ep.path} [Expected ${ep.expectedStatus}, got ${response.status}]`);
                }
            } catch (err) {
                this.fail(`❌ ${ep.method} ${ep.path} - ${err.message}`);
            }
        }
        console.log();
    }

    async testRequestValidation() {
        console.log('📋 TEST 3: Request Validation');
        console.log('─'.repeat(60));

        try {
            // Test missing session_id in analyze endpoint
            const response = await axios.post(`${BASE_URL}/api/sandbox/analyze`, {}, { 
                validateStatus: () => true, 
                timeout: TIMEOUT 
            });

            if (response.status === 400 || response.status === 404) {
                this.pass(`✅ Missing session_id returns error (${response.status})`);
            } else {
                this.fail(`❌ Missing session_id should return 400/404, got ${response.status}`);
            }

            // Test invalid session_id format
            const invalidResponse = await axios.post(`${BASE_URL}/api/sandbox/analyze`, 
                { session_id: 'invalid' }, 
                { validateStatus: () => true, timeout: TIMEOUT }
            );

            if (invalidResponse.status === 404) {
                this.pass(`✅ Invalid session_id returns 404`);
            } else {
                this.fail(`❌ Invalid session_id should return 404, got ${invalidResponse.status}`);
            }
        } catch (err) {
            this.fail(`❌ Request validation error: ${err.message}`);
        }
        console.log();
    }

    async testErrorHandling() {
        console.log('📋 TEST 4: Error Handling');
        console.log('─'.repeat(60));

        try {
            // Test malformed JSON
            const malformedResponse = await axios.post(`${BASE_URL}/api/sandbox/analyze`, '{bad json', {
                validateStatus: () => true,
                timeout: TIMEOUT,
                headers: { 'Content-Type': 'application/json' }
            });

            if (malformedResponse.status >= 400) {
                this.pass(`✅ Malformed JSON returns error (${malformedResponse.status})`);
            } else {
                this.fail(`❌ Malformed JSON should return 400+ error`);
            }

            // Test non-existent endpoint
            const notFoundResponse = await axios.get(`${BASE_URL}/api/nonexistent`, {
                validateStatus: () => true,
                timeout: TIMEOUT
            });

            if (notFoundResponse.status === 404) {
                this.pass(`✅ Non-existent endpoint returns 404`);
            } else {
                this.fail(`❌ Non-existent endpoint should return 404, got ${notFoundResponse.status}`);
            }
        } catch (err) {
            this.fail(`❌ Error handling test failed: ${err.message}`);
        }
        console.log();
    }

    async testResponseStructure() {
        console.log('📋 TEST 5: Response Structure');
        console.log('─'.repeat(60));

        try {
            const response = await axios.get(`${BASE_URL}/api/status`, { timeout: TIMEOUT });
            const data = response.data;

            const checks = [
                { name: 'timestamp field', result: typeof data.timestamp === 'string' },
                { name: 'services object', result: typeof data.services === 'object' },
                { name: 'services.node_server', result: !!data.services?.node_server },
                { name: 'services.database', result: 'database' in data.services },
                { name: 'JSON serializable', result: typeof JSON.stringify(data) === 'string' }
            ];

            checks.forEach(check => {
                if (check.result) {
                    this.pass(`✅ ${check.name}`);
                } else {
                    this.fail(`❌ ${check.name}`);
                }
            });
        } catch (err) {
            this.fail(`❌ Response structure test failed: ${err.message}`);
        }
        console.log();
    }

    async testDynamicAnalysisAgent() {
        console.log('📋 TEST 6: Dynamic Analysis Agent Module');
        console.log('─'.repeat(60));

        try {
            // Try loading the module
            const DynamicAnalysisAgent = require('./server/services/dynamicAnalysisAgent.js');

            // Check if it's a class
            if (typeof DynamicAnalysisAgent === 'function') {
                this.pass(`✅ DynamicAnalysisAgent is a class`);
            } else {
                this.fail(`❌ DynamicAnalysisAgent should be a class`);
                return;
            }

            // Check if constructor works
            const agent = new DynamicAnalysisAgent('test-key');
            if (agent) {
                this.pass(`✅ Constructor instantiates agent`);
            } else {
                this.fail(`❌ Constructor failed to instantiate agent`);
                return;
            }

            // Check if methods exist
            const methods = [
                'orchestrateAnalysis',
                'analyzeBehaviors',
                'extractIOCs',
                'mapMITRETechniques',
                'identifyTechnologies',
                'analyzeRootCauses',
                'generateMitigations'
            ];

            methods.forEach(method => {
                if (typeof agent[method] === 'function') {
                    this.pass(`✅ Method ${method} exists`);
                } else {
                    this.fail(`❌ Method ${method} missing`);
                }
            });

            // Check if private methods exist
            const privateCheck = typeof agent.callGemini === 'function' || typeof agent.buildLocalReport === 'function';
            if (privateCheck) {
                this.pass(`✅ Private helper methods exist`);
            } else {
                this.fail(`❌ Private helper methods missing`);
            }
        } catch (err) {
            this.fail(`❌ Module loading failed: ${err.message}`);
        }
        console.log();
    }

    async testWebSocket() {
        console.log('📋 TEST 7: WebSocket Connectivity');
        console.log('─'.repeat(60));

        try {
            const WebSocket = require('ws');
            const ws = new WebSocket(`ws://localhost:5000/ws`, { timeout: TIMEOUT });

            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    this.fail(`❌ WebSocket connection timeout`);
                    ws.close();
                    resolve();
                }, TIMEOUT);

                ws.on('open', () => {
                    this.pass(`✅ WebSocket connection successful`);
                    clearTimeout(timeout);
                    ws.close();
                    resolve();
                });

                ws.on('error', (err) => {
                    this.fail(`❌ WebSocket error: ${err.message}`);
                    clearTimeout(timeout);
                    resolve();
                });
            });
        } catch (err) {
            this.fail(`❌ WebSocket test failed: ${err.message}`);
        }
        console.log();
    }

    async apiCall(path) {
        const response = await axios.get(`${BASE_URL}${path}`, { timeout: TIMEOUT });
        return response.data;
    }

    pass(message) {
        console.log(message);
        this.results.passed++;
    }

    fail(message) {
        console.log(message);
        this.results.failed++;
        this.results.errors.push(message);
    }

    printResults() {
        console.log('\n╔════════════════════════════════════════════════════════════════╗');
        console.log('║                         TEST RESULTS                            ║');
        console.log('╚════════════════════════════════════════════════════════════════╝\n');

        const total = this.results.passed + this.results.failed;
        const percentage = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;

        console.log(`✅ Passed:  ${this.results.passed}`);
        console.log(`❌ Failed:  ${this.results.failed}`);
        console.log(`📊 Total:   ${total}`);
        console.log(`📈 Success: ${percentage}%\n`);

        if (this.results.failed > 0) {
            console.log('Failed Tests:');
            this.results.errors.forEach(err => console.log(`  ${err}`));
        }

        console.log('\n' + '═'.repeat(66) + '\n');

        if (this.results.failed === 0) {
            console.log('🎉 ALL TESTS PASSED! System is ready for production.\n');
            process.exit(0);
        } else {
            console.log(`⚠️  ${this.results.failed} test(s) failed. Review above for details.\n`);
            process.exit(1);
        }
    }
}

// Run tests
const suite = new TestSuite();
suite.runAllTests();
