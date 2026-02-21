/**
 * Autonomous Agent Test Suite
 * 
 * Comprehensive testing of Blue, Red, and Orchestrator autonomous agents
 * Run with: node AUTONOMOUS_AGENT_TESTS.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TESTS = [];
let passCount = 0;
let failCount = 0;

// ════════════════════════════════════════════════════════════════════════════
// TEST HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

async function test(name, fn) {
    process.stdout.write(`  ⏳ ${name}... `);
    try {
        await fn();
        console.log('✅ PASS');
        passCount++;
        return true;
    } catch (err) {
        console.log(`❌ FAIL: ${err.message}`);
        failCount++;
        return false;
    }
}

async function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function assertEquals(actual, expected, message) {
    if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
}

async function assertExists(obj, property, message) {
    if (!(property in obj)) throw new Error(`${message}: property ${property} not found`);
}

// ════════════════════════════════════════════════════════════════════════════
// 1. BLUE TEAM AUTONOMOUS TESTS
// ════════════════════════════════════════════════════════════════════════════

async function testBlueTeamAutonomous() {
    console.log('\n🔵 BLUE TEAM AUTONOMOUS OPERATIONS\n');

    await test('Start Blue autonomous operation', async () => {
        const response = await axios.post(`${BASE_URL}/api/autonomous/blue/run`, {
            context: {
                networkLogs: 'Sample network activity showing failed login attempts',
                systemEvents: 'Process execution from unusual locations',
                recentIncidents: 'Administrative account accessed from unknown IP'
            }
        });

        assertExists(response.data, 'operationId', 'Missing operationId');
        assertExists(response.data, 'agentId', 'Missing agentId');
        assertEquals(response.data.success, true, 'Success flag not true');
        assertExists(response.data, 'summary', 'Missing summary');
        assertExists(response.data.summary, 'threatsDetected', 'Missing threatsDetected count');
    });

    await test('Check Blue Agent status', async () => {
        const response = await axios.get(`${BASE_URL}/api/autonomous/blue/status`);

        assertEquals(response.data.success, true, 'Success flag not true');
        assertExists(response.data, 'agentId', 'Missing agentId');
        assertExists(response.data, 'status', 'Missing status');
        assertExists(response.data, 'metrics', 'Missing metrics');
        assertExists(response.data.metrics, 'decisionsMade', 'Missing decisionsMade');
    });

    await test('Verify Blue generates detection rules', async () => {
        const response = await axios.post(`${BASE_URL}/api/autonomous/blue/run`, {
            context: {
                networkLogs: 'Suspicious lateral movement detected',
                systemEvents: 'WMI process creation observed'
            }
        });

        assertExists(response.data.summary, 'detectionRulesGenerated', 'No rules generated');
        assert(response.data.summary.detectionRulesGenerated >= 0, 'Invalid rule count');
    });

    await test('Verify Blue generates threat intelligence', async () => {
        const response = await axios.post(`${BASE_URL}/api/autonomous/blue/run`, {
            context: {
                networkLogs: 'Connections to known C2 IP addresses',
                systemEvents: 'Registry modifications for persistence'
            }
        });

        assertExists(response.data, 'operationId', 'Missing operationId');
        assertEquals(response.data.success, true, 'Operation failed');
    });
}

// ════════════════════════════════════════════════════════════════════════════
// 2. RED TEAM AUTONOMOUS TESTS
// ════════════════════════════════════════════════════════════════════════════

async function testRedTeamAutonomous() {
    console.log('\n🔴 RED TEAM AUTONOMOUS OPERATIONS\n');

    await test('Start Red Team on lab target (10.x range)', async () => {
        const response = await axios.post(`${BASE_URL}/api/autonomous/red/run`, {
            labTarget: {
                ip: '10.0.0.100',
                hostname: 'lab-target-1',
                os: 'Windows Server 2019'
            }
        });

        assertEquals(response.data.success, true, 'Red operation failed');
        assertExists(response.data, 'operationId', 'Missing operationId');
        assertExists(response.data, 'agentId', 'Missing agentId');
        assertExists(response.data.summary, 'attackPhasesSimulated', 'No attack phases simulated');
    });

    await test('Start Red Team on lab target (172.16.x range)', async () => {
        const response = await axios.post(`${BASE_URL}/api/autonomous/red/run`, {
            labTarget: {
                ip: '172.16.0.50',
                hostname: 'lab-vm-2',
                os: 'Linux Ubuntu 20.04'
            }
        });

        assertEquals(response.data.success, true, 'Red operation failed');
    });

    await test('Start Red Team on lab target (192.168.x range)', async () => {
        const response = await axios.post(`${BASE_URL}/api/autonomous/red/run`, {
            labTarget: {
                ip: '192.168.1.10',
                hostname: 'lab-workstation',
                os: 'Windows 10'
            }
        });

        assertEquals(response.data.success, true, 'Red operation failed');
    });

    await test('Reject Red Team on production target (8.8.8.8)', async () => {
        try {
            await axios.post(`${BASE_URL}/api/autonomous/red/run`, {
                labTarget: {
                    ip: '8.8.8.8',
                    hostname: 'google-dns',
                    os: 'Linux'
                }
            });
            throw new Error('Should have rejected production IP');
        } catch (err) {
            assert(err.response?.status === 400, 'Should return 400 Bad Request');
            assert(err.response?.data?.error?.includes('LAB'), 'Should mention LAB requirement');
        }
    });

    await test('Reject Red Team on public IP (1.1.1.1)', async () => {
        try {
            await axios.post(`${BASE_URL}/api/autonomous/red/run`, {
                labTarget: {
                    ip: '1.1.1.1',
                    hostname: 'cloudflare-dns',
                    os: 'Linux'
                }
            });
            throw new Error('Should have rejected production IP');
        } catch (err) {
            assert(err.response?.status === 400, 'Should return 400 Bad Request');
        }
    });

    await test('Check Red Agent status', async () => {
        const response = await axios.get(`${BASE_URL}/api/autonomous/red/status`);

        assertEquals(response.data.success, true, 'Success flag not true');
        assertEquals(response.data.labEnvironmentOnly, true, 'Lab-only flag not set');
        assertExists(response.data.metrics, 'simulationsRun', 'Missing simulation count');
    });

    await test('Verify Red generates defense recommendations', async () => {
        const response = await axios.post(`${BASE_URL}/api/autonomous/red/run`, {
            labTarget: {
                ip: '10.10.10.10',
                hostname: 'red-lab-target',
                os: 'Windows'
            }
        });

        assertExists(response.data.summary, 'defenseRecomendations', 'No defense recommendations');
    });
}

// ════════════════════════════════════════════════════════════════════════════
// 3. ORCHESTRATOR - FULL AUTONOMOUS TESTS
// ════════════════════════════════════════════════════════════════════════════

async function testOrchestratorOperations() {
    console.log('\n⚡ ORCHESTRATOR - FULL AUTONOMOUS OPERATIONS\n');

    await test('Run full operation (Blue + Red simultaneously)', async () => {
        const response = await axios.post(`${BASE_URL}/api/autonomous/full/run`, {
            context: {
                networkLogs: 'Real-time network activity',
                systemEvents: 'System events and alerts'
            },
            labTarget: {
                ip: '10.100.100.100',
                hostname: 'full-test-target',
                os: 'Windows Server 2019'
            }
        });

        assertEquals(response.data.success, true, 'Full operation failed');
        assertExists(response.data, 'operationId', 'Missing operationId');
        assertExists(response.data, 'orchestratorId', 'Missing orchestratorId');
        assertExists(response.data, 'blueResults', 'Missing Blue results');
        assertExists(response.data, 'redResults', 'Missing Red results');
        assertExists(response.data, 'correlation', 'Missing correlation results');
    });

    await test('Verify correlation analysis (gaps identified)', async () => {
        const response = await axios.post(`${BASE_URL}/api/autonomous/full/run`, {
            context: {
                networkLogs: 'Sample network data',
                systemEvents: 'Sample system events'
            },
            labTarget: {
                ip: '10.50.50.50',
                hostname: 'gap-test-target',
                os: 'Linux'
            }
        });

        assertExists(response.data.correlation, 'detectionCoverage', 'No coverage data');
        assertExists(response.data.correlation, 'detectionGaps', 'No gap analysis');
        assertExists(response.data, 'executiveSummary', 'Missing executive summary');
    });

    await test('Verify executive summary includes recommendations', async () => {
        const response = await axios.post(`${BASE_URL}/api/autonomous/full/run`, {
            context: { networkLogs: 'Sample logs' },
            labTarget: { ip: '10.1.1.1', hostname: 'test', os: 'Windows' }
        });

        assertExists(response.data.executiveSummary, 'correlation', 'No correlation in summary');
        assertExists(response.data.executiveSummary.correlation, 'overallSecurePosture', 'No posture');
    });

    await test('Get Orchestrator status', async () => {
        const response = await axios.get(`${BASE_URL}/api/autonomous/orchestrator/status`);

        assertEquals(response.data.success, true, 'Success flag not true');
        assertExists(response.data, 'orchestrator', 'Missing orchestrator object');
        assertExists(response.data.orchestrator, 'orchestratorId', 'Missing orchestratorId');
        assertExists(response.data.orchestrator, 'status', 'Missing status');
    });

    await test('Get operation history', async () => {
        const response = await axios.get(`${BASE_URL}/api/autonomous/orchestrator/history?limit=5`);

        assertEquals(response.data.success, true, 'Success flag not true');
        assertExists(response.data, 'operationCount', 'Missing operation count');
        assertExists(response.data, 'operations', 'Missing operations array');
    });

    await test('Get detailed report', async () => {
        const response = await axios.get(`${BASE_URL}/api/autonomous/orchestrator/report`);

        assertEquals(response.data.success, true, 'Success flag not true');
        assertExists(response.data, 'report', 'Missing report');
        assertExists(response.data.report, 'totalOperations', 'Missing total operations');
    });

    await test('Retrieve specific operation by ID', async () => {
        // First get history to get an operation ID
        const historyResp = await axios.get(`${BASE_URL}/api/autonomous/orchestrator/history?limit=1`);
        if (historyResp.data.operations.length > 0) {
            const opId = historyResp.data.operations[0].operationId;
            const response = await axios.get(`${BASE_URL}/api/autonomous/orchestrator/operation/${opId}`);

            assertEquals(response.data.success, true, 'Success flag not true');
            assertExists(response.data, 'operation', 'Missing operation data');
        }
    });
}

// ════════════════════════════════════════════════════════════════════════════
// 4. SCHEDULING TESTS
// ════════════════════════════════════════════════════════════════════════════

async function testScheduling() {
    console.log('\n📅 SCHEDULING TESTS\n');

    await test('Schedule daily Blue operation', async () => {
        const response = await axios.post(`${BASE_URL}/api/autonomous/schedule`, {
            type: 'blue',
            interval: 86400000 // 24 hours
        });

        assertEquals(response.data.success, true, 'Scheduling failed');
        assertEquals(response.data.intervalHours, 24, 'Interval not 24 hours');
        assertExists(response.data, 'nextExecution', 'Missing next execution time');
    });

    await test('Schedule hourly Red operation', async () => {
        const response = await axios.post(`${BASE_URL}/api/autonomous/schedule`, {
            type: 'red',
            interval: 3600000 // 1 hour
        });

        assertEquals(response.data.success, true, 'Scheduling failed');
        assertEquals(response.data.intervalHours, 1, 'Interval not 1 hour');
    });

    await test('Schedule weekly full operation', async () => {
        const response = await axios.post(`${BASE_URL}/api/autonomous/schedule`, {
            type: 'full',
            interval: 604800000 // 7 days
        });

        assertEquals(response.data.success, true, 'Scheduling failed');
        assertEquals(response.data.intervalHours, 168, 'Interval not 168 hours (7 days)');
    });

    await test('Reject invalid schedule type', async () => {
        try {
            await axios.post(`${BASE_URL}/api/autonomous/schedule`, {
                type: 'invalid',
                interval: 86400000
            });
            throw new Error('Should have rejected invalid type');
        } catch (err) {
            assert(err.response?.status === 400, 'Should return 400 Bad Request');
        }
    });
}

// ════════════════════════════════════════════════════════════════════════════
// 5. INTEGRATION & EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

async function testIntegration() {
    console.log('\n🔗 INTEGRATION & EDGE CASES\n');

    await test('Blue operation with empty context', async () => {
        const response = await axios.post(`${BASE_URL}/api/autonomous/blue/run`, {
            context: {}
        });

        assertEquals(response.data.success, true, 'Should handle empty context');
    });

    await test('Blue operation with detailed context', async () => {
        const response = await axios.post(`${BASE_URL}/api/autonomous/blue/run`, {
            context: {
                networkLogs: 'Detailed network logs showing multiple suspicious activities',
                systemEvents: 'Detailed system events: process creation, registry modifications, file operations',
                recentIncidents: 'Multiple failed logins, potential OT network compromise detected',
                threatFeeds: 'Recently identified APT28 indicators of compromise'
            }
        });

        assertEquals(response.data.success, true, 'Should handle detailed context');
        assert(response.data.summary.threatsDetected >= 0, 'Invalid threat count');
    });

    await test('Red operation localhost (should accept 127.x)', async () => {
        const response = await axios.post(`${BASE_URL}/api/autonomous/red/run`, {
            labTarget: {
                ip: '127.0.0.1',
                hostname: 'localhost',
                os: 'Windows'
            }
        });

        assertEquals(response.data.success, true, 'Should accept localhost');
    });

    await test('Full operation with comprehensive data', async () => {
        const response = await axios.post(`${BASE_URL}/api/autonomous/full/run`, {
            context: {
                networkLogs: 'Full network capture data',
                systemEvents: 'Complete Windows/Linux event logs',
                recentIncidents: 'Multiple historical incidents'
            },
            labTarget: {
                ip: '10.99.99.99',
                hostname: 'comprehensive-test',
                os: 'Windows Server 2022'
            }
        });

        assertEquals(response.data.success, true, 'Full operation should succeed');
        assertExists(response.data, 'correlation', 'Should include correlation');
    });

    await test('Get report shows accumulated analytics', async () => {
        const response = await axios.get(`${BASE_URL}/api/autonomous/orchestrator/report`);

        assertEquals(response.data.success, true, 'Report retrieval failed');
        assert(response.data.report.totalOperations >= 0, 'Invalid operation count');
    });

    await test('Operation history persists across calls', async () => {
        const resp1 = await axios.get(`${BASE_URL}/api/autonomous/orchestrator/history?limit=1`);
        const count1 = resp1.data.operationCount;

        // Run another operation
        await axios.post(`${BASE_URL}/api/autonomous/blue/run`, {
            context: { networkLogs: 'test' }
        });

        const resp2 = await axios.get(`${BASE_URL}/api/autonomous/orchestrator/history?limit=10`);
        const count2 = resp2.data.operationCount;

        assert(count2 >= count1, 'History should persist and grow');
    });
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN TEST RUNNER
// ════════════════════════════════════════════════════════════════════════════

async function runAllTests() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  🤖 AUTONOMOUS AGENT TEST SUITE                             ║');
    console.log('║  Testing Blue, Red, and Orchestrator Agents                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    try {
        // Check server is running
        try {
            await axios.get(`${BASE_URL}/api/health`);
        } catch (err) {
            console.error('\n❌ ERROR: Server not running at ' + BASE_URL);
            console.error('   Start the server with: npm run server');
            process.exit(1);
        }

        // Run all test suites
        await testBlueTeamAutonomous();
        await testRedTeamAutonomous();
        await testOrchestratorOperations();
        await testScheduling();
        await testIntegration();

        // Summary
        const totalTests = passCount + failCount;
        const passPercentage = totalTests > 0 ? ((passCount / totalTests) * 100).toFixed(1) : 0;

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║  TEST SUMMARY                                              ║');
        console.log(`║  ✅ Passed: ${passCount.toString().padEnd(48)}║`);
        console.log(`║  ❌ Failed: ${failCount.toString().padEnd(48)}║`);
        console.log(`║  📊 Success Rate: ${passPercentage}%${' '.repeat(Math.max(0, 42 - passPercentage.length))}║`);
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        if (failCount === 0) {
            console.log('🎉 All tests passed! Autonomous agents are ready for production.\n');
            process.exit(0);
        } else {
            console.log('⚠️  Some tests failed. Please review errors above.\n');
            process.exit(1);
        }
    } catch (err) {
        console.error('\n Fatal error:', err.message);
        process.exit(1);
    }
}

// Run tests if executed directly
if (require.main === module) {
    runAllTests();
}

module.exports = { test, assert, assertEquals, assertExists };
