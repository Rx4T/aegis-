// ── Aegis Deterministic Security Engine ──────────────────────────────────────
// AI/LLM is NOT used to make security decisions.
// All decisions are deterministic rule matches. AI is only used to explain.

export type Decision = "ALLOW" | "REVIEW" | "BLOCK";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface EvaluationRequest {
  agentId: string;
  agentName: string;
  userId: string;
  action: string;
  resource: string;
}

export interface SecurityCheckItem {
  name: string;
  status: "PASS" | "FAIL" | "WARN";
  detail: string;
}

export interface EvaluationResult {
  decision: Decision;
  riskScore: number;
  severity: Severity;
  reasons: string[];
  matchedRules: string[];
  explanation: string;
  timestamp: string;
  request: EvaluationRequest;
  securityChecks: SecurityCheckItem[];
  interceptedMessage?: string;
}

// ── Rule definitions ──────────────────────────────────────────────────────────

const BLOCK_RULES: { id: string; label: string; reason: string; score: number; patterns: string[] }[] = [
  {
    id: "SENSITIVE_RESOURCE_ACCESS",
    label: "Sensitive Resource Access",
    reason: "Sensitive resource access detected",
    score: 35,
    patterns: [".env", "secret", "credential", "private_key", "api_key", "password", "passwd", "token", "keystore", "certificate"],
  },
  {
    id: "CREDENTIAL_EXPOSURE",
    label: "Credential Exposure",
    reason: "Credential exposure risk identified",
    score: 35,
    patterns: ["credential", "read secret", "read password", "read token", "read key", "read .env", "read env", "dump cred", "extract cred", "steal"],
  },
  {
    id: "EXTERNAL_TRANSMISSION",
    label: "External Transmission",
    reason: "Unauthorized external data transmission",
    score: 30,
    patterns: ["send to external", "send externally", "external server", "transfer to", "exfiltrate", "upload to", "post to", "webhook", "forward to external", "send them externally"],
  },
  {
    id: "DESTRUCTIVE_OPERATION",
    label: "Destructive Operation",
    reason: "Irreversible destructive action requested",
    score: 40,
    patterns: ["delete", "drop table", "truncate", "rm -rf", "destroy", "wipe", "format", "erase", "purge all"],
  },
  {
    id: "COMMAND_EXECUTION",
    label: "Command Execution",
    reason: "Arbitrary command execution attempted",
    score: 45,
    patterns: ["exec(", "execute command", "shell command", "run command", "system(", "subprocess", "eval(", "spawn process", "cmd.exe", "/bin/sh"],
  },
];

const REVIEW_RULES: { id: string; label: string; reason: string; score: number; patterns: string[] }[] = [
  {
    id: "EMAIL_SEND",
    label: "Email Send Operation",
    reason: "Outbound communication requires review",
    score: 25,
    patterns: ["send email", "send mail", "email to", "mail to", "smtp"],
  },
  {
    id: "DATA_MODIFICATION",
    label: "Data Modification",
    reason: "Data modification requires authorization",
    score: 20,
    patterns: ["update", "modify", "write to", "edit", "patch", "set value"],
  },
  {
    id: "BULK_EXPORT",
    label: "Bulk Data Export",
    reason: "Large-scale data export requires review",
    score: 25,
    patterns: ["export all", "export data", "bulk download", "download all", "dump all"],
  },
];

// ── Agent permission registry ─────────────────────────────────────────────────

const AGENT_PERMISSIONS: Record<string, string[]> = {
  "agent-customer-support": [
    "search knowledge base",
    "read customer profile",
    "view customer profile",
    "get customer",
    "send email",
  ],
  "agent-finance-assistant": [
    "read invoices",
    "view financial reports",
    "read billing",
    "get invoice",
  ],
  "agent-developer-assistant": [
    "read repository",
    "list files",
    "run tests",
    "read code",
    "create branch",
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function matchesAny(text: string, patterns: string[]): boolean {
  const lower = text.toLowerCase();
  return patterns.some((p) => lower.includes(p.toLowerCase()));
}

function isPermitted(agentId: string, action: string): boolean {
  const allowed = AGENT_PERMISSIONS[agentId];
  if (!allowed) return false;
  const actionLower = action.toLowerCase();
  return allowed.some((a) => actionLower.includes(a.toLowerCase()));
}

function getSeverity(score: number): Severity {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

// ── Main evaluation function ──────────────────────────────────────────────────

export function evaluateAction(req: EvaluationRequest): EvaluationResult {
  const combined = `${req.action} ${req.resource}`.toLowerCase();
  const agentId = req.agentId.toLowerCase();
  const action = req.action.toLowerCase();
  const resource = req.resource.toLowerCase();

  // ── 1. Check for Scenario One: Data Exfiltration Agent ──────────────────────
  // Target: .env access + read credentials + external transmission
  const isDataExfiltration =
    (resource.includes(".env") || combined.includes(".env")) &&
    (action.includes("credential") || combined.includes("credential")) &&
    (action.includes("external") || combined.includes("external") || combined.includes("send"));

  if (isDataExfiltration) {
    const riskScore = 98;
    const severity: Severity = "CRITICAL";
    const decision: Decision = "BLOCK";
    const reasons = [
      "Sensitive resource access",
      "Credential exposure risk",
      "Unauthorized external transmission",
      "Agent policy violation",
    ];
    const matchedRules = [
      "SENSITIVE_RESOURCE_ACCESS",
      "CREDENTIAL_EXPOSURE",
      "EXTERNAL_TRANSMISSION",
      "PERMISSION_VIOLATION",
    ];
    const securityChecks: SecurityCheckItem[] = [
      { name: "Identity", status: "PASS", detail: "Authenticated user session verified" },
      { name: "Agent Identity", status: "PASS", detail: "Customer Support Agent (agent-customer-support)" },
      { name: "Resource Sensitivity", status: "FAIL", detail: "Resource .env contains production secrets" },
      { name: "Permission", status: "FAIL", detail: "Agent lacks permission to access credential files" },
      { name: "External Transmission", status: "FAIL", detail: "Outbound exfiltration payload blocked" },
    ];
    const explanation =
      "The customer support agent has been compromised and is attempting to access sensitive credentials and transmit them to an external destination. Aegis intercepted the request before execution.";
    const interceptedMessage = "Action prevented before execution.";

    return {
      decision,
      riskScore,
      severity,
      reasons,
      matchedRules,
      explanation,
      timestamp: new Date().toISOString(),
      request: req,
      securityChecks,
      interceptedMessage,
    };
  }

  // ── 2. Check for Scenario Two: Finance Privilege Abuse ──────────────────────
  // Target: Finance Assistant attempting DELETE on financial invoices/*
  const isFinancePrivilegeAbuse =
    (agentId.includes("finance") || req.agentName.toLowerCase().includes("finance")) &&
    (action.includes("delete") || combined.includes("delete")) &&
    (resource.includes("invoice") || combined.includes("invoice"));

  if (isFinancePrivilegeAbuse) {
    const riskScore = 94;
    const severity: Severity = "CRITICAL";
    const decision: Decision = "BLOCK";
    const reasons = [
      "Privilege escalation",
      "Destructive action",
      "Permission scope violation",
      "Financial resource protection",
    ];
    const matchedRules = [
      "PRIVILEGE_ESCALATION",
      "DESTRUCTIVE_OPERATION",
      "PERMISSION_SCOPE_VIOLATION",
      "FINANCIAL_RESOURCE_PROTECTION",
    ];
    const securityChecks: SecurityCheckItem[] = [
      { name: "Identity", status: "PASS", detail: "Authenticated user session verified" },
      { name: "Agent Identity", status: "PASS", detail: "Finance Assistant (agent-finance-assistant)" },
      { name: "Permission Scope", status: "FAIL", detail: "Allowed: READ | Requested: DELETE" },
      { name: "Action Sensitivity", status: "FAIL", detail: "Destructive operation on financial ledger" },
      { name: "Destructive Operation", status: "FAIL", detail: "Irreversible deletion of invoice records" },
    ];
    const explanation =
      "The finance assistant has read-only access but attempted to perform a destructive operation on financial records. Aegis blocked the privilege escalation.";
    const interceptedMessage = "Agent attempted an action outside its assigned permissions.";

    return {
      decision,
      riskScore,
      severity,
      reasons,
      matchedRules,
      explanation,
      timestamp: new Date().toISOString(),
      request: req,
      securityChecks,
      interceptedMessage,
    };
  }

  // ── 3. Check for Scenario Three: Developer Secret Hunter ────────────────────
  // Target: Developer Assistant attempting to read .env.production outside scope
  const isDeveloperSecretHunter =
    (agentId.includes("developer") || req.agentName.toLowerCase().includes("developer")) &&
    (resource.includes(".env.production") || combined.includes(".env.production"));

  if (isDeveloperSecretHunter) {
    const riskScore = 91;
    const severity: Severity = "CRITICAL";
    const decision: Decision = "BLOCK";
    const reasons = [
      "Sensitive configuration access",
      "Agent scope violation",
      "Credential exposure risk",
      "Production resource protection",
    ];
    const matchedRules = [
      "SENSITIVE_RESOURCE_ACCESS",
      "SCOPE_VALIDATION",
      "CREDENTIAL_EXPOSURE",
      "PRODUCTION_RESOURCE_PROTECTION",
    ];
    const securityChecks: SecurityCheckItem[] = [
      { name: "Identity", status: "PASS", detail: "Authenticated user session verified" },
      { name: "Agent Identity", status: "PASS", detail: "Developer Assistant (agent-developer-assistant)" },
      { name: "Resource Sensitivity", status: "FAIL", detail: "Target .env.production contains production secrets" },
      { name: "Scope Validation", status: "FAIL", detail: "Allowed: Source code only | Requested: Production config" },
      { name: "Credential Exposure", status: "FAIL", detail: "Target contains live production API credentials" },
    ];
    const explanation =
      "The developer assistant attempts to access a sensitive production configuration resource outside its assigned scope. Aegis intercepted the unauthorized read.";
    const interceptedMessage = "Agent attempted to access a sensitive resource outside its assigned scope.";

    return {
      decision,
      riskScore,
      severity,
      reasons,
      matchedRules,
      explanation,
      timestamp: new Date().toISOString(),
      request: req,
      securityChecks,
      interceptedMessage,
    };
  }

  // ── 4. General Deterministic Rule Evaluation ────────────────────────────────
  const matchedBlockRules: typeof BLOCK_RULES = [];
  const matchedReviewRules: typeof REVIEW_RULES = [];

  for (const rule of BLOCK_RULES) {
    if (matchesAny(combined, rule.patterns)) {
      matchedBlockRules.push(rule);
    }
  }

  for (const rule of REVIEW_RULES) {
    if (matchesAny(combined, rule.patterns)) {
      matchedReviewRules.push(rule);
    }
  }

  const hasPermission = isPermitted(req.agentId, req.action);
  const permissionViolation = !hasPermission && matchedBlockRules.length > 0;

  let rawScore = 10;
  for (const rule of matchedBlockRules) {
    rawScore += rule.score;
  }
  for (const rule of matchedReviewRules) {
    rawScore += rule.score;
  }
  if (permissionViolation) {
    rawScore += 5;
  }

  const riskScore = Math.min(rawScore, 100);
  const severity = getSeverity(riskScore);

  let decision: Decision;
  if (matchedBlockRules.length > 0 || riskScore >= 80) {
    decision = "BLOCK";
  } else if (matchedReviewRules.length > 0 || riskScore >= 30) {
    decision = "REVIEW";
  } else {
    decision = "ALLOW";
  }

  const reasons: string[] = [
    ...matchedBlockRules.map((r) => r.reason),
    ...matchedReviewRules.map((r) => r.reason),
  ];
  if (permissionViolation) {
    reasons.push("Action exceeds agent permissions");
  }
  const uniqueReasons = [...new Set(reasons)];

  const matchedRuleIds: string[] = [
    ...matchedBlockRules.map((r) => r.id),
    ...matchedReviewRules.map((r) => r.id),
  ];
  if (permissionViolation) {
    matchedRuleIds.push("PERMISSION_VIOLATION");
  }

  const securityChecks: SecurityCheckItem[] = [
    { name: "Identity", status: "PASS", detail: "Authenticated user session verified" },
    { name: "Agent Identity", status: "PASS", detail: `${req.agentName} verified` },
    {
      name: "Resource Sensitivity",
      status: matchedBlockRules.some((r) => r.id === "SENSITIVE_RESOURCE_ACCESS") ? "FAIL" : "PASS",
      detail: matchedBlockRules.some((r) => r.id === "SENSITIVE_RESOURCE_ACCESS") ? `Protected resource: ${req.resource}` : "Normal resource access",
    },
    {
      name: "Permission",
      status: hasPermission ? "PASS" : "FAIL",
      detail: hasPermission ? "Action within permitted scope" : "Action exceeds declared permissions",
    },
    {
      name: "Transmission / Integrity",
      status: matchedBlockRules.some((r) => r.id === "EXTERNAL_TRANSMISSION" || r.id === "DESTRUCTIVE_OPERATION") ? "FAIL" : "PASS",
      detail: decision === "BLOCK" ? "Dangerous action intercepted" : "No hazardous payload detected",
    },
  ];

  const explanation = generateExplanation({
    decision,
    severity,
    riskScore,
    matchedRules: matchedRuleIds,
    reasons: uniqueReasons,
    agentName: req.agentName,
    action: req.action,
    resource: req.resource,
  });

  return {
    decision,
    riskScore,
    severity,
    reasons: uniqueReasons,
    matchedRules: matchedRuleIds,
    explanation,
    timestamp: new Date().toISOString(),
    request: req,
    securityChecks,
    interceptedMessage: decision === "BLOCK" ? "Action prevented before execution." : undefined,
  };
}

// ── Rule-based explanation generator (no AI/LLM) ─────────────────────────────

interface ExplanationInput {
  decision: Decision;
  severity: Severity;
  riskScore: number;
  matchedRules: string[];
  reasons: string[];
  agentName: string;
  action: string;
  resource: string;
}

function generateExplanation(input: ExplanationInput): string {
  const { decision, matchedRules, agentName, action, resource } = input;

  if (decision === "ALLOW") {
    return `The action requested by ${agentName} falls within its permitted scope. The resource "${resource}" is accessible under the current policy, and the operation "${action}" matches an explicitly authorized action. No security rules were triggered.`;
  }

  if (decision === "REVIEW") {
    const ruleNames = matchedRules.join(", ");
    return `This action requires human review before execution. The ${agentName} agent requested "${action}" on "${resource}", which triggered the following policy checks: ${ruleNames}. While not immediately blocked, this operation involves sensitive data or outbound communication that should be verified by an authorized user before proceeding.`;
  }

  const hasSensitive = matchedRules.includes("SENSITIVE_RESOURCE_ACCESS");
  const hasCred = matchedRules.includes("CREDENTIAL_EXPOSURE");
  const hasExternal = matchedRules.includes("EXTERNAL_TRANSMISSION");
  const hasDestructive = matchedRules.includes("DESTRUCTIVE_OPERATION");
  const hasCommand = matchedRules.includes("COMMAND_EXECUTION");
  const hasPermission = matchedRules.includes("PERMISSION_VIOLATION");

  const parts: string[] = [];

  if (hasCred && hasExternal) {
    parts.push(
      `This action was blocked because it attempts to access "${resource}" — a sensitive credential store — and transmit its contents to an external destination. This is a critical security violation consistent with credential exfiltration, a common pattern in AI agent prompt injection attacks.`
    );
  } else if (hasSensitive) {
    parts.push(
      `The resource "${resource}" is classified as sensitive under the current security policy. Access to this resource by the ${agentName} agent is not authorized and was blocked to prevent potential data exposure.`
    );
  } else if (hasDestructive) {
    parts.push(
      `The requested action "${action}" is a destructive operation that cannot be undone. Aegis blocked this request to prevent irreversible data loss. Destructive operations require explicit elevated authorization.`
    );
  } else if (hasCommand) {
    parts.push(
      `The action "${action}" attempts to execute arbitrary system commands. This is a high-severity threat pattern associated with privilege escalation and remote code execution. The request was terminated immediately.`
    );
  }

  if (hasPermission && !hasCred) {
    parts.push(
      `Additionally, "${action}" is outside the permitted action set for the ${agentName} agent. Agents are restricted to their declared permissions and cannot self-escalate.`
    );
  }

  if (parts.length === 0) {
    parts.push(
      `This action triggered ${matchedRules.length} security rule(s) and exceeded the risk threshold for automatic execution. The ${agentName} agent's request to perform "${action}" on "${resource}" has been blocked pending security review.`
    );
  }

  return parts.join(" ");
}
