/**
 * AUTONOMOUS OPERATIONS API DOCUMENTATION
 * 
 * Complete guide for using Blue, Red, and Orchestrator autonomous agents via REST API
 */

// ════════════════════════════════════════════════════════════════════════════
// 1. BLUE TEAM AUTONOMOUS OPERATIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Run autonomous Blue Team defense operation
 * 
 * POST /api/autonomous/blue/run
 * 
 * Description:
 * - Automatically detects threats in provided context
 * - Creates containment plans for incidents
 * - Generates detection rules (SIEM/EDR/Sigma)
 * - Updates threat intelligence
 * - Recommends security hardening
 * - Generates comprehensive report
 * - ZERO user intervention required
 * 
 * Request Body:
 * {
 *   "context": {
 *     "networkLogs": "...",
 *     "systemEvents": "...",
 *     "recentIncidents": "..."
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "operationId": "12345-67890",
 *   "agentId": "blue-agent-xyz",
 *   "status": "autonomous_operation_initiated",
 *   "summary": {
 *     "threatsDetected": 5,
 *     "incidentsIdentified": 2,
 *     "detectionRulesGenerated": 8,
 *     "hardeningRecommendations": 12
 *   }
 * }
 */
POST_BLUE_RUN = {
  endpoint: '/api/autonomous/blue/run',
  method: 'POST',
  body: {
    context: {
      networkLogs: "Sample network log data or analytics",
      systemEvents: "Security events, login attempts, file access",
      recentIncidents: "Any known incidents to analyze"
    }
  },
  response: {
    operationId: "unique identifier for tracking",
    workflow: {
      threats: [
        {
          id: "threat-001",
          title: "T1087 - Account Discovery",
          severity: "high",
          confidence: 0.95
        }
      ],
      incidents: {
        "incident-001": {
          incident: { type: "Unauthorized Access", severity: "critical" },
          containment: { actions: ["Isolate system", "Block account"] },
          status: "completed"
        }
      },
      detectionRules: [
        {
          name: "Detect Account Discovery",
          type: "sigma",
          sigma_rule: "...",
          spl: "...",
          alert_threshold: 3
        }
      ],
      intelligence: [
        {
          iocs: ["192.168.1.100", "malware.exe"],
          threat_actor: "APT28",
          ttps: ["T1087", "T1566"],
          confidence: 0.92
        }
      ],
      hardening: [
        {
          measure: "Enable MFA on all accounts",
          priority: "critical",
          effort: "1 hour",
          benefit: "Prevents 60% of account compromise attacks"
        }
      ],
      report: {
        executiveReport: "Text summary",
        threatLandscape: "Tactical overview",
        nextSteps: ["Implement detection rules", "Patch vulnerable systems"]
      }
    }
  }
};

/**
 * Check Blue Agent status
 * 
 * GET /api/autonomous/blue/status
 * 
 * Returns current state, decision count, rules generated, etc.
 */
GET_BLUE_STATUS = {
  endpoint: '/api/autonomous/blue/status',
  method: 'GET',
  response: {
    success: true,
    agentId: "blue-agent-xyz",
    status: "idle|running|completed",
    metrics: {
      decisionsMade: 42,
      rulesGenerated: 8,
      threatIntelUpdates: 15,
      conversationTurns: 7
    }
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 2. RED TEAM AUTONOMOUS OPERATIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Run autonomous Red Team simulation
 * 
 * POST /api/autonomous/red/run
 * 
 * Description:
 * - Simulates 10-phase attack from reconnaissance to defense evasion
 * - Maps all techniques to MITRE ATT&CK framework
 * - Generates defense recommendations (Blue perspective)
 * - CRITICAL: Only works on AUTHORIZED LAB ENVIRONMENTS
 * - Refuses to target production systems (IP validation)
 * 
 * Request Body:
 * {
 *   "labTarget": {
 *     "ip": "10.0.0.100",
 *     "hostname": "lab-server-1",
 *     "os": "Windows Server 2019"
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "operationId": "red-op-12345",
 *   "agentId": "red-agent-xyz",
 *   "status": "red_team_simulation_complete",
 *   "summary": {
 *     "attackPhasesSimulated": 10,
 *     "defenseRecommendations": 24
 *   },
 *   "simulation": {
 *     "simulationId": "sim-12345",
 *     "phases": [
 *       { name: "Reconnaissance", techniques: [...] },
 *       { name: "Initial Access", techniques: [...] },
 *       ...
 *     ]
 *   }
 * }
 * 
 * SAFETY GUARANTEES:
 * - Only accepts lab IP ranges: 10.x, 172.16-31.x, 192.168.x, 127.x
 * - Rejects production IPs: 8.8.8.8, 1.1.1.1, etc.
 * - Returns error if targeting non-lab environment:
 *   "ERROR: Red Team operations ONLY work on authorized LAB ENVIRONMENTS"
 * - No actual exploit code generated (conceptual descriptions only)
 * - Every attack includes defense recommendations
 */
POST_RED_RUN = {
  endpoint: '/api/autonomous/red/run',
  method: 'POST',
  body: {
    labTarget: {
      ip: "10.0.0.100",
      hostname: "lab-server-1",
      os: "Windows Server 2019"
    }
  },
  validLabRanges: [
    "10.0.0.0/8",
    "172.16.0.0/12",
    "192.168.0.0/16",
    "127.0.0.0/8",
    "localhost",
    "*lab*",
    "*test*",
    "*dev*"
  ],
  response: {
    operationId: "red-op-12345",
    simulation: {
      simulationId: "sim-12345",
      phases: [
        {
          phase: "reconnaissance",
          techniques: [
            { mitre_id: "T1592", description: "Gather Victim Identity Information" }
          ],
          detections: [
            { rule: "Process reconnaissance tools", indicator: "discovery.exe" }
          ],
          preventions: [
            { control: "Segment network", effort: "high", effectiveness: "90%" }
          ]
        },
        {
          phase: "initial_access",
          techniques: [
            { mitre_id: "T1566.001", description: "Phishing - Spearphishing Attachment" }
          ]
        },
        {
          phase: "persistence",
          techniques: [
            { mitre_id: "T1547.001", description: "Boot or Logon Autostart Execution" }
          ]
        },
        {
          phase: "privilege_escalation",
          techniques: [
            { mitre_id: "T1134.004", description: "Process Injection - Token Impersonation" }
          ]
        },
        {
          phase: "lateral_movement",
          techniques: [
            { mitre_id: "T1570", description: "Lateral Tool Transfer" }
          ]
        },
        {
          phase: "exfiltration",
          techniques: [
            { mitre_id: "T1020", description: "Exfiltration Over Command and Control Channel" }
          ]
        },
        {
          phase: "defense_evasion",
          techniques: [
            { mitre_id: "T1036", description: "Masquerading" }
          ]
        },
        {
          phase: "blue_perspective",
          description: "How to detect and stop this attack",
          detections: [
            { rule: "Detect lateral movement via WMI", mitre_id: "T1570" },
            { rule: "Monitor for token impersonation", mitre_id: "T1134.004" }
          ]
        }
      ],
      report: {
        executiveReport: "10-phase attack simulation summary",
        attackChain: "Detailed chain showing how techniques connect",
        criticality: "critical",
        defendersView: {
          "T1087": "Account Discovery would be detected by: Active Directory auditing, DNS queries, LDAP calls",
          "T1566.001": "Phishing would be caught by: Email gateway, content filter, user training"
        },
        recommendations: {
          technical: ["Deploy EDR solution", "Enable command-line auditing"],
          procedural: ["Implement user training", "Update incident response plan"],
          architectural: ["Segment network", "Deploy zero-trust architecture"]
        }
      }
    }
  }
};

/**
 * Check Red Agent status
 * 
 * GET /api/autonomous/red/status
 */
GET_RED_STATUS = {
  endpoint: '/api/autonomous/red/status',
  method: 'GET',
  response: {
    success: true,
    agentId: "red-agent-xyz",
    status: "idle|running|completed",
    labEnvironmentOnly: true,
    metrics: {
      simulationsRun: 12,
      attackPlansCreated: 48,
      defenseRulesGenerated: 156,
      decisionsMade: 312
    }
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 3. ORCHESTRATOR - FULL AUTONOMOUS OPERATIONS (Blue + Red)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Execute BOTH Blue and Red autonomously SIMULTANEOUSLY
 * 
 * POST /api/autonomous/full/run
 * 
 * Description:
 * - Runs Blue Team defense AND Red Team simulation at the same time
 * - Uses Promise.all() for parallel execution
 * - After both complete, correlates results
 * - Creates rich gap analysis (what Red planned that Blue didn't detect)
 * - Generates executive summary with recommendations
 * 
 * This is the FLAGSHIP operation that creates value by showing:
 * - What threats Blue Team detects
 * - What attacks Red Team can execute
 * - Where the gap is (detection coverage failures)
 * - What rules/controls are needed to close gaps
 * 
 * Request Body:
 * {
 *   "context": { network data for Blue Team to analyze },
 *   "labTarget": { lab target for Red Team to attack }
 * }
 * 
 * Response:
 * {
 *   "operationId": "full-op-12345",
 *   "orchestratorId": "orchestrator-xyz",
 *   "executiveSummary": {
 *     "blue": {
 *       "threatsDetected": 5,
 *       "incidentsIdentified": 2,
 *       "detectionRulesGenerated": 8
 *     },
 *     "red": {
 *       "attackPhasesSimulated": 10,
 *       "defenseRecommendations": 24
 *     },
 *     "correlation": {
 *       "detectionCoverage": [...],
 *       "gapAnalysis": [
 *         {
 *           "redAttack": "T1087 - Account Discovery",
 *           "blueDetection": null,
 *           "gap": "CRITICAL - No detection rule for account discovery",
 *           "priority": "high",
 *           "recommendation": "Implement SIEM rule for LDAP/AD queries"
 *         }
 *       ],
 *       "overallSecurePosture": "adequate"
 *     }
 *   }
 * }
 */
POST_FULL_RUN = {
  endpoint: '/api/autonomous/full/run',
  method: 'POST',
  body: {
    context: {
      networkLogs: "...",
      systemEvents: "..."
    },
    labTarget: {
      ip: "10.0.0.100",
      hostname: "lab-server-1",
      os: "Windows Server 2019"
    }
  },
  response: {
    success: true,
    operationId: "full-op-12345",
    orchestratorId: "orchestrator-xyz",
    status: "full_autonomous_operation_complete",
    blueResults: {
      threatsDetected: 5,
      incidentsIdentified: 2,
      detectionRulesGenerated: 8
    },
    redResults: {
      attackPhasesSimulated: 10,
      defenseRecommendations: 24
    },
    correlation: {
      detectionCoverage: [
        {
          redAttack: "T1566.001 - Spearphishing Attachment",
          blueDetection: "Phishing email detection rule",
          coveragePercentage: 95,
          status: "covered"
        }
      ],
      detectionGaps: [
        {
          redAttack: "T1087 - Account Discovery via LDAP",
          blueDetection: null,
          gap: "No SIEM rule for LDAP enumeration",
          priority: "high",
          recommendation: "Create SIEM alert: LDAP query volume spike"
        }
      ],
      overallSecurePosture: "adequate_with_gaps"
    },
    executiveSummary: {
      security_posture: "adequate",
      threats_detected: 5,
      coverage_percentage: 78,
      critical_gaps: 2,
      recommendations: [
        "Implement 8 new detection rules",
        "Deploy EDR solution",
        "Segment network for lateral movement containment"
      ],
      next_steps: [
        "Review correlation results",
        "Prioritize high-gap detections",
        "Schedule rule implementation"
      ]
    }
  }
};

/**
 * Get Orchestrator Status
 * 
 * GET /api/autonomous/orchestrator/status
 */
GET_ORCHESTRATOR_STATUS = {
  endpoint: '/api/autonomous/orchestrator/status',
  method: 'GET',
  response: {
    orchestrator: {
      orchestratorId: "orchestrator-xyz",
      status: "ready|blue_running|red_running|full_operation",
      totalOperations: 42,
      completedOperations: 40,
      failedOperations: 2,
      blueAgent: { status: "idle", threatsDetected: 128 },
      redAgent: { status: "idle", simulationsRun: 15 }
    }
  }
};

/**
 * Get Operation History
 * 
 * GET /api/autonomous/orchestrator/history?limit=10
 */
GET_OPERATION_HISTORY = {
  endpoint: '/api/autonomous/orchestrator/history?limit=10',
  method: 'GET',
  response: {
    success: true,
    operationCount: 10,
    operations: [
      {
        operationId: "full-op-12345",
        type: "full",
        timestamp: "2025-02-21T10:30:00Z",
        duration: 45000,
        status: "completed",
        summary: {
          threatsDetected: 5,
          attackPhasesSimulated: 10,
          gapsIdentified: 2
        }
      }
    ]
  }
};

/**
 * Get Detailed Report
 * 
 * GET /api/autonomous/orchestrator/report
 */
GET_DETAILED_REPORT = {
  endpoint: '/api/autonomous/orchestrator/report',
  method: 'GET',
  response: {
    success: true,
    report: {
      totalOperations: 42,
      operationsByType: { blue: 12, red: 15, full: 15 },
      successRate: 95.2,
      averageDuration: 38000,
      threatsDetectedTotal: 128,
      rulesGeneratedTotal: 96,
      simulationsRunTotal: 15,
      averageGapCoverage: 78
    }
  }
};

/**
 * Get Specific Operation Result
 * 
 * GET /api/autonomous/orchestrator/operation/{operationId}
 */
GET_OPERATION_RESULT = {
  endpoint: '/api/autonomous/orchestrator/operation/full-op-12345',
  method: 'GET',
  response: {
    success: true,
    operation: {
      operationId: "full-op-12345",
      orchestratorId: "orchestrator-xyz",
      type: "full",
      timestamp: "2025-02-21T10:30:00Z",
      duration: 45000,
      status: "completed",
      blue: {
        threats: [...],
        incidents: {...},
        rules: [...]
      },
      red: {
        phases: [...],
        techniques: [...],
        recommendations: [...]
      },
      correlation: {
        coverage: [...],
        gaps: [...]
      }
    }
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 4. SCHEDULING - Recurring Autonomous Operations
// ════════════════════════════════════════════════════════════════════════════

/**
 * Schedule recurring autonomous operations
 * 
 * POST /api/autonomous/schedule
 * 
 * Description:
 * - Schedule Blue, Red, or Full operations to run automatically
 * - Runs at specified interval (e.g., hourly, daily, weekly)
 * - Returns next execution time
 * 
 * Request Body:
 * {
 *   "type": "blue|red|full",
 *   "interval": 86400000  // milliseconds (24 hours default)
 * }
 * 
 * Examples:
 * - 3600000 = 1 hour
 * - 86400000 = 24 hours (1 day)
 * - 604800000 = 7 days (1 week)
 */
POST_SCHEDULE = {
  endpoint: '/api/autonomous/schedule',
  method: 'POST',
  body: {
    type: "full",
    interval: 86400000
  },
  intervalExamples: {
    "3600000": "1 hour",
    "14400000": "4 hours",
    "86400000": "24 hours (1 day)",
    "604800000": "7 days (1 week)"
  },
  response: {
    success: true,
    message: "full autonomous operations scheduled",
    intervalHours: 24,
    nextExecution: "2025-02-22T10:30:00Z"
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 5. RESET - Cleanup
// ════════════════════════════════════════════════════════════════════════════

/**
 * Reset orchestrator and all agents
 * 
 * DELETE /api/autonomous/reset
 * 
 * Clears:
 * - Operation history
 * - Agent conversation state
 * - Threat intelligence cache
 * - Running operations
 */
DELETE_RESET = {
  endpoint: '/api/autonomous/reset',
  method: 'DELETE',
  response: {
    success: true,
    message: "Orchestrator reset successfully"
  }
};

// ════════════════════════════════════════════════════════════════════════════
// EXAMPLE WORKFLOWS
// ════════════════════════════════════════════════════════════════════════════

/**
 * WORKFLOW 1: Daily Security Assessment
 * 
 * Scenario: Schedule automated daily security review
 * 
 * Steps:
 * 1. Schedule full operation daily
 * 2. Every 24 hours, Blue + Red run simultaneously
 * 3. Get correlation results
 * 4. Identify detection gaps
 * 5. Generate report with recommendations
 */
WORKFLOW_DAILY_ASSESSMENT = {
  steps: [
    {
      name: "Schedule daily operation",
      method: "POST",
      endpoint: "/api/autonomous/schedule",
      body: { type: "full", interval: 86400000 }
    },
    {
      waitFor: "24 hours",
      thenCheck: "GET /api/autonomous/orchestrator/history"
    },
    {
      name: "Review latest operation",
      get: "Last operation from history",
      analyze: "Detection gaps and recommendations"
    }
  ]
};

/**
 * WORKFLOW 2: Red Team Exercise
 * 
 * Scenario: Do a 10-phase attack simulation, see what Blue detects
 * 
 * Steps:
 * 1. Run red simulation on lab server
 * 2. Collect all attack techniques and phases
 * 3. Compare with Blue detection capability
 * 4. Generate report showing what Blue missed
 */
WORKFLOW_RED_EXERCISE = {
  steps: [
    {
      name: "Run red team on lab target",
      method: "POST",
      endpoint: "/api/autonomous/red/run",
      body: {
        labTarget: { ip: "10.0.0.50", hostname: "lab-target", os: "Linux" }
      }
    },
    {
      name: "Red generates 10-phase attack",
      expects: "Recon → Initial → Persistence → PrivEsc → Lateral → Exfil → Evasion → Blue Perspective"
    },
    {
      name: "Review attack phases and defense recommendations",
      get: "simulation.phases, simulation.report"
    }
  ]
};

/**
 * WORKFLOW 3: Threat Intelligence Update
 * 
 * Scenario: Analyze current logs, extract intelligence, update threat feeds
 * 
 * Steps:
 * 1. Blue Team analyzes logs automatically
 * 2. Extracts IOCs (IPs, domains, file hashes)
 * 3. Maps to threat actors and MITRE techniques
 * 4. Generates detection rules
 * 5. Can feed back to SIEM/EDR systems
 */
WORKFLOW_THREAT_INTEL = {
  steps: [
    {
      name: "Run Blue autonomous operation",
      method: "POST",
      endpoint: "/api/autonomous/blue/run",
      body: {
        context: { networkLogs: "Sample logs here" }
      }
    },
    {
      name: "Extract intelligence",
      get: "response.workflow.intelligence",
      contains: ["iocs", "threat_actor", "ttps", "confidence"]
    },
    {
      name: "Generate detection rules",
      get: "response.workflow.detectionRules",
      types: ["sigma", "spl", "query"]
    }
  ]
};

module.exports = {
  POST_BLUE_RUN,
  GET_BLUE_STATUS,
  POST_RED_RUN,
  GET_RED_STATUS,
  POST_FULL_RUN,
  GET_ORCHESTRATOR_STATUS,
  GET_OPERATION_HISTORY,
  GET_DETAILED_REPORT,
  GET_OPERATION_RESULT,
  POST_SCHEDULE,
  DELETE_RESET,
  WORKFLOW_DAILY_ASSESSMENT,
  WORKFLOW_RED_EXERCISE,
  WORKFLOW_THREAT_INTEL
};
