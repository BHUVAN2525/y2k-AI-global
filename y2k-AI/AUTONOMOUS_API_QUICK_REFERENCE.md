/**
 * QUICK REFERENCE - Autonomous Operations API
 * 
 * Copy-paste examples for testing autonomous agents
 */

// ════════════════════════════════════════════════════════════════════════════
// 1. BLUE TEAM - AUTONOMOUS DEFENSE
// ════════════════════════════════════════════════════════════════════════════

/**
RUN: Start Blue Team autonomous defense
METHOD: POST
URL: http://localhost:5000/api/autonomous/blue/run

CURL:
*/
curl -X POST http://localhost:5000/api/autonomous/blue/run \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "networkLogs": "Failed login attempts from 192.168.1.100 (10 attempts), suspicious process execution from c:\\temp\\unknown.exe, DNS queries to known C2 servers",
      "systemEvents": "Administrator account accessed at 2AM, Registry modification for persistence detected, Unusual network connection to 203.0.113.5:443",
      "recentIncidents": "User reported suspicious email with malicious attachment, possible data exfiltration detected"
    }
  }'

/**
STATUS: Check Blue Agent metrics
METHOD: GET
URL: http://localhost:5000/api/autonomous/blue/status
*/
curl http://localhost:5000/api/autonomous/blue/status

// ════════════════════════════════════════════════════════════════════════════
// 2. RED TEAM - AUTONOMOUS ATTACK SIMULATION (LAB ONLY)
// ════════════════════════════════════════════════════════════════════════════

/**
RUN: Start Red Team on lab target (10.x network)
METHOD: POST
URL: http://localhost:5000/api/autonomous/red/run

CURL:
*/
curl -X POST http://localhost:5000/api/autonomous/red/run \
  -H "Content-Type: application/json" \
  -d '{
    "labTarget": {
      "ip": "10.0.0.100",
      "hostname": "lab-server-prod",
      "os": "Windows Server 2019"
    }
  }'

/**
RUN: Red Team on lab target (172.16.x network)
*/
curl -X POST http://localhost:5000/api/autonomous/red/run \
  -H "Content-Type: application/json" \
  -d '{
    "labTarget": {
      "ip": "172.16.0.50",
      "hostname": "lab-analytics-vm",
      "os": "Linux Ubuntu 20.04"
    }
  }'

/**
RUN: Red Team on lab target (192.168.x network)
*/
curl -X POST http://localhost:5000/api/autonomous/red/run \
  -H "Content-Type: application/json" \
  -d '{
    "labTarget": {
      "ip": "192.168.1.10",
      "hostname": "lab-workstation-1",
      "os": "Windows 10 Enterprise"
    }
  }'

/**
RUN: Red Team on localhost (127.0.0.1)
*/
curl -X POST http://localhost:5000/api/autonomous/red/run \
  -H "Content-Type: application/json" \
  -d '{
    "labTarget": {
      "ip": "127.0.0.1",
      "hostname": "localhost",
      "os": "Windows"
    }
  }'

/**
DANGER - This will be REJECTED (production IP):
*/
curl -X POST http://localhost:5000/api/autonomous/red/run \
  -H "Content-Type: application/json" \
  -d '{
    "labTarget": {
      "ip": "8.8.8.8",
      "hostname": "google-dns",
      "os": "Linux"
    }
  }'
# Response: 400 Bad Request - "Red Team operations ONLY work on authorized LAB ENVIRONMENTS"

/**
STATUS: Check Red Agent metrics
METHOD: GET
URL: http://localhost:5000/api/autonomous/red/status
*/
curl http://localhost:5000/api/autonomous/red/status

// ════════════════════════════════════════════════════════════════════════════
// 3. ORCHESTRATOR - FULL OPERATION (Blue + Red Simultaneous)
// ════════════════════════════════════════════════════════════════════════════

/**
RUN: Execute Blue and Red simultaneously with correlation
METHOD: POST
URL: http://localhost:5000/api/autonomous/full/run

CURL:
*/
curl -X POST http://localhost:5000/api/autonomous/full/run \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "networkLogs": "Real-time network traffic showing potential lateral movement attempts via SMB port 445",
      "systemEvents": "WMI process creation detected, Windows Update service disabled, New local admin accounts created",
      "recentIncidents": "Initial email phish detected with macro payload, endpoint isolation attempted"
    },
    "labTarget": {
      "ip": "10.100.100.100",
      "hostname": "corp-lab-server-01",
      "os": "Windows Server 2019"
    }
  }'

/**
EXPECTED RESPONSE:
{
  "success": true,
  "operationId": "full-op-abc123",
  "orchestratorId": "orchestrator-xyz",
  "blueResults": {
    "threatsDetected": 5,
    "incidentsIdentified": 2,
    "detectionRulesGenerated": 8
  },
  "redResults": {
    "attackPhasesSimulated": 10,
    "defenseRecommendations": 24
  },
  "correlation": {
    "detectionCoverage": [...],
    "detectionGaps": [{
      "threat": "T1570 Lateral Tool Transfer",
      "gap": "No SIEM rule for SMB port 445 enumeration",
      "priority": "high",
      "recommendation": "Implement detection rule for suspicious SMB activity"
    }],
    "overallSecurePosture": "adequate_with_gaps"
  },
  "executiveSummary": {
    "security_posture": "adequate",
    "threats_detected": 5,
    "coverage_percentage": 78,
    "critical_gaps": 2,
    "recommendations": [
      "Implement 8 new detection rules (rules provided)",
      "Deploy EDR solution for endpoint monitoring",
      "Segment network to limit lateral movement",
      "Enable command-line auditing on all systems"
    ]
  }
}
*/

/**
STATUS: Check Orchestrator metrics
METHOD: GET
URL: http://localhost:5000/api/autonomous/orchestrator/status
*/
curl http://localhost:5000/api/autonomous/orchestrator/status

/**
HISTORY: Get operation history (last 10 operations)
METHOD: GET
URL: http://localhost:5000/api/autonomous/orchestrator/history?limit=10
*/
curl http://localhost:5000/api/autonomous/orchestrator/history?limit=10

/**
HISTORY: Get operation history (specific amount)
*/
curl http://localhost:5000/api/autonomous/orchestrator/history?limit=5

/**
REPORT: Get detailed accumulated analytics
METHOD: GET
URL: http://localhost:5000/api/autonomous/orchestrator/report
*/
curl http://localhost:5000/api/autonomous/orchestrator/report

/**
RETRIEVE: Get specific operation by ID
METHOD: GET
URL: http://localhost:5000/api/autonomous/orchestrator/operation/{operationId}
*/
curl http://localhost:5000/api/autonomous/orchestrator/operation/full-op-abc123

// ════════════════════════════════════════════════════════════════════════════
// 4. SCHEDULING - Recurring Autonomous Operations
// ════════════════════════════════════════════════════════════════════════════

/**
SCHEDULE: Blue Team every 24 hours
METHOD: POST
URL: http://localhost:5000/api/autonomous/schedule
*/
curl -X POST http://localhost:5000/api/autonomous/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "type": "blue",
    "interval": 86400000
  }'

/**
SCHEDULE: Red Team every 4 hours
*/
curl -X POST http://localhost:5000/api/autonomous/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "type": "red",
    "interval": 14400000
  }'

/**
SCHEDULE: Full operation (Blue + Red) every 7 days
*/
curl -X POST http://localhost:5000/api/autonomous/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "type": "full",
    "interval": 604800000
  }'

/**
INTERVAL REFERENCE:
3600000 = 1 hour
14400000 = 4 hours
86400000 = 24 hours (1 day)
604800000 = 7 days (1 week)
2592000000 = 30 days (1 month)
*/

// ════════════════════════════════════════════════════════════════════════════
// 5. MANAGEMENT ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

/**
RESET: Clear orchestrator history and reset agents
METHOD: DELETE
URL: http://localhost:5000/api/autonomous/reset
*/
curl -X DELETE http://localhost:5000/api/autonomous/reset

/**
HEALTH: Check server is running
METHOD: GET
URL: http://localhost:5000/api/health
*/
curl http://localhost:5000/api/health

// ════════════════════════════════════════════════════════════════════════════
// TESTING WORKFLOW
// ════════════════════════════════════════════════════════════════════════════

/**
COMPLETE TEST SEQUENCE:

1. Verify server is running
curl http://localhost:5000/api/health

2. Run Blue Team operation
curl -X POST http://localhost:5000/api/autonomous/blue/run \
  -H "Content-Type: application/json" \
  -d '{"context": {"networkLogs": "sample logs"}}'

3. Check Blue status
curl http://localhost:5000/api/autonomous/blue/status

4. Run Red Team on lab (10.x)
curl -X POST http://localhost:5000/api/autonomous/red/run \
  -H "Content-Type: application/json" \
  -d '{"labTarget": {"ip": "10.0.0.100", "hostname": "lab-1", "os": "Windows"}}'

5. Check Red status
curl http://localhost:5000/api/autonomous/red/status

6. Run full operation (Blue + Red)
curl -X POST http://localhost:5000/api/autonomous/full/run \
  -H "Content-Type: application/json" \
  -d '{
    "context": {"networkLogs": "sample"},
    "labTarget": {"ip": "10.10.10.10", "hostname": "lab-2", "os": "Windows"}
  }'

7. Get operation history
curl http://localhost:5000/api/autonomous/orchestrator/history?limit=5

8. Get detailed report
curl http://localhost:5000/api/autonomous/orchestrator/report

EXPECTED RESULT: All 8 calls succeed with meaningful responses
*/

// ════════════════════════════════════════════════════════════════════════════
// POSTMAN IMPORT
// ════════════════════════════════════════════════════════════════════════════

/**
For Postman users, import this collection:

{
  "info": {
    "name": "Y2K Autonomous Operations",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Blue - Run",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "url": {"raw": "http://localhost:5000/api/autonomous/blue/run", "protocol": "http", "host": ["localhost"], "port": "5000", "path": ["api", "autonomous", "blue", "run"]},
        "body": {"mode": "raw", "raw": "{\"context\": {\"networkLogs\": \"sample logs\"}}"}
      }
    },
    {
      "name": "Blue - Status",
      "request": {
        "method": "GET",
        "url": {"raw": "http://localhost:5000/api/autonomous/blue/status", "protocol": "http", "host": ["localhost"], "port": "5000", "path": ["api", "autonomous", "blue", "status"]}
      }
    },
    {
      "name": "Red - Run (Lab)",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "url": {"raw": "http://localhost:5000/api/autonomous/red/run", "protocol": "http", "host": ["localhost"], "port": "5000", "path": ["api", "autonomous", "red", "run"]},
        "body": {"mode": "raw", "raw": "{\"labTarget\": {\"ip\": \"10.0.0.100\", \"hostname\": \"lab-1\", \"os\": \"Windows\"}}"}
      }
    },
    {
      "name": "Red - Status",
      "request": {
        "method": "GET",
        "url": {"raw": "http://localhost:5000/api/autonomous/red/status", "protocol": "http", "host": ["localhost"], "port": "5000", "path": ["api", "autonomous", "red", "status"]}
      }
    },
    {
      "name": "Full - Run (Blue + Red)",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "url": {"raw": "http://localhost:5000/api/autonomous/full/run", "protocol": "http", "host": ["localhost"], "port": "5000", "path": ["api", "autonomous", "full", "run"]},
        "body": {"mode": "raw", "raw": "{\"context\": {\"networkLogs\": \"sample\"}, \"labTarget\": {\"ip\": \"10.0.0.100\", \"hostname\": \"lab-1\", \"os\": \"Windows\"}}"}
      }
    },
    {
      "name": "Orchestrator - Status",
      "request": {
        "method": "GET",
        "url": {"raw": "http://localhost:5000/api/autonomous/orchestrator/status", "protocol": "http", "host": ["localhost"], "port": "5000", "path": ["api", "autonomous", "orchestrator", "status"]}
      }
    },
    {
      "name": "Orchestrator - History",
      "request": {
        "method": "GET",
        "url": {"raw": "http://localhost:5000/api/autonomous/orchestrator/history?limit=10", "protocol": "http", "host": ["localhost"], "port": "5000", "path": ["api", "autonomous", "orchestrator", "history"], "query": [{"key": "limit", "value": "10"}]}
      }
    },
    {
      "name": "Orchestrator - Report",
      "request": {
        "method": "GET",
        "url": {"raw": "http://localhost:5000/api/autonomous/orchestrator/report", "protocol": "http", "host": ["localhost"], "port": "5000", "path": ["api", "autonomous", "orchestrator", "report"]}
      }
    }
  ]
}
*/

// ════════════════════════════════════════════════════════════════════════════
// INTEGRATION SNIPPET (JavaScript/Node.js)
// ════════════════════════════════════════════════════════════════════════════

/**
// In your Node.js/Express application:

const axios = require('axios');

// Run full autonomous operation
async function runFullSecurityAssessment() {
  try {
    const response = await axios.post('http://localhost:5000/api/autonomous/full/run', {
      context: {
        networkLogs: 'Your network logs here',
        systemEvents: 'Your system events here'
      },
      labTarget: {
        ip: '10.0.0.100',
        hostname: 'lab-target',
        os: 'Windows Server 2019'
      }
    });

    console.log('Operation ID:', response.data.operationId);
    console.log('Blue Results:', response.data.blueResults);
    console.log('Red Results:', response.data.redResults);
    console.log('Correlation:', response.data.correlation);
    console.log('Security Posture:', response.data.executiveSummary.correlation.overallSecurePosture);
    console.log('Recommendations:', response.data.executiveSummary.nextActionsRecommended);

    return response.data;
  } catch (error) {
    console.error('Operation failed:', error.response?.data || error.message);
  }
}

// Get operation history
async function getOperationHistory() {
  try {
    const response = await axios.get('http://localhost:5000/api/autonomous/orchestrator/history?limit=10');
    console.log('Recent operations:', response.data.operations);
    return response.data.operations;
  } catch (error) {
    console.error('Failed to get history:', error.message);
  }
}

// Schedule daily operations
async function scheduleDailySecurityAssessment() {
  try {
    const response = await axios.post('http://localhost:5000/api/autonomous/schedule', {
      type: 'full',
      interval: 86400000  // 24 hours
    });
    console.log('Scheduled!', response.data.nextExecution);
  } catch (error) {
    console.error('Scheduling failed:', error.message);
  }
}

// Run scheduled jobs
runFullSecurityAssessment();
// getOperationHistory();
// scheduleDailySecurityAssessment();
*/

// ════════════════════════════════════════════════════════════════════════════
// INTEGRATION SNIPPET (Python)
// ════════════════════════════════════════════════════════════════════════════

/**
# In your Python application:

import requests
import json

BASE_URL = 'http://localhost:5000'

# Run full autonomous operation
def run_full_security_assessment():
    response = requests.post(f'{BASE_URL}/api/autonomous/full/run', json={
        'context': {
            'networkLogs': 'Your network logs here',
            'systemEvents': 'Your system events here'
        },
        'labTarget': {
            'ip': '10.0.0.100',
            'hostname': 'lab-target',
            'os': 'Windows Server 2019'
        }
    })
    
    result = response.json()
    print('Operation ID:', result['operationId'])
    print('Blue Results:', result['blueResults'])
    print('Red Results:', result['redResults'])
    print('Correlation:', result['correlation'])
    print('Security Posture:', result['executiveSummary']['correlation']['overallSecurePosture'])
    
    return result

# Get operation history
def get_operation_history():
    response = requests.get(f'{BASE_URL}/api/autonomous/orchestrator/history?limit=10')
    operations = response.json()['operations']
    print('Recent operations:', json.dumps(operations, indent=2))
    return operations

# Schedule daily operations
def schedule_daily_assessment():
    response = requests.post(f'{BASE_URL}/api/autonomous/schedule', json={
        'type': 'full',
        'interval': 86400000  # 24 hours
    })
    print('Scheduled!', response.json()['nextExecution'])

# run_full_security_assessment()
# get_operation_history()
# schedule_daily_assessment()
*/

module.exports = { QUICK_REFERENCE: true };
