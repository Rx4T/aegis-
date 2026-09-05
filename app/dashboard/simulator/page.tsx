"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { EvaluationResult, SecurityCheckItem } from "@/lib/security-engine";

const STORAGE_KEY = "aegis_events";

interface AttackScenario {
  id: string;
  name: string;
  badge?: string;
  agentName: string;
  agentId: string;
  agentStatus: "COMPROMISED" | "SUSPICIOUS";
  assignedScope: string;
  attackDescription: string;
  action: string;
  resource: string;
  expectedScore: number;
  expectedSeverity: "CRITICAL";
  expectedDecision: "BLOCKED";
  interceptedMessage: string;
  attackChain: string[];
}

const ATTACK_SCENARIOS: AttackScenario[] = [
  {
    id: "data-exfiltration",
    name: "Data Exfiltration Agent",
    badge: "PRIMARY DEMO",
    agentName: "Customer Support Agent",
    agentId: "agent-customer-support",
    agentStatus: "COMPROMISED",
    assignedScope: "Knowledge base search & customer profile lookup only",
    attackDescription:
      "The customer support agent has been compromised and is attempting to access sensitive credentials and transmit them to an external destination.",
    action: "Read credentials and send them externally",
    resource: ".env",
    expectedScore: 98,
    expectedSeverity: "CRITICAL",
    expectedDecision: "BLOCKED",
    interceptedMessage: "Action prevented before execution.",
    attackChain: [
      "Customer Support Agent requests access to \".env\"",
      "Attempts to read credentials from environment secrets",
      "Attempts to transmit the extracted data externally",
      "Aegis Firewall intercepts and terminates the request",
    ],
  },
  {
    id: "finance-privilege-abuse",
    name: "Finance Privilege Abuse",
    badge: "PRIVILEGE ESCALATION",
    agentName: "Finance Assistant",
    agentId: "agent-finance-assistant",
    agentStatus: "COMPROMISED",
    assignedScope: "Read-only access to invoices and billing reports",
    attackDescription:
      "The finance assistant has read-only access but attempts to perform a destructive operation on financial records.",
    action: "DELETE invoices/*",
    resource: "invoices/*",
    expectedScore: 94,
    expectedSeverity: "CRITICAL",
    expectedDecision: "BLOCKED",
    interceptedMessage: "Agent attempted an action outside its assigned permissions.",
    attackChain: [
      "Finance Assistant authenticates with READ-only privileges",
      "Requests elevated DELETE permission on financial ledger",
      "Attempts irreversible bulk deletion of invoices/* records",
      "Aegis Firewall detects privilege escalation and blocks execution",
    ],
  },
  {
    id: "developer-secret-hunter",
    name: "Developer Secret Hunter",
    badge: "SCOPE VIOLATION",
    agentName: "Developer Assistant",
    agentId: "agent-developer-assistant",
    agentStatus: "SUSPICIOUS",
    assignedScope: "Project source code repository and branch management only",
    attackDescription:
      "The developer assistant attempts to access a sensitive production configuration resource outside its assigned scope.",
    action: "READ",
    resource: ".env.production",
    expectedScore: 91,
    expectedSeverity: "CRITICAL",
    expectedDecision: "BLOCKED",
    interceptedMessage: "Agent attempted to access a sensitive resource outside its assigned scope.",
    attackChain: [
      "Developer Assistant operates within project source scope",
      "Initiates out-of-scope query targeting production deployment",
      "Attempts read access on protected .env.production secrets",
      "Aegis Firewall detects scope boundary breach and halts read",
    ],
  },
];

const EVAL_STEPS = [
  { label: "AGENT REQUEST", detail: "Intercepted inbound action payload" },
  { label: "IDENTITY CHECK", detail: "Validating user session & agent ID" },
  { label: "PERMISSION CHECK", detail: "Comparing declared scope vs requested action" },
  { label: "RESOURCE CHECK", detail: "Analyzing target resource sensitivity" },
  { label: "RISK ANALYSIS", detail: "Executing deterministic risk calculation matrix" },
  { label: "AEGIS DECISION", detail: "Enforcing security policy verdict" },
];

function saveEvent(result: EvaluationResult) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: EvaluationResult[] = raw ? JSON.parse(raw) : [];
    existing.push(result);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    window.dispatchEvent(new Event("storage"));
  } catch {
    /* ignore */
  }
}

function loadRecentEvents(): EvaluationResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function AttackLabPage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("data-exfiltration");
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentEvents, setRecentEvents] = useState<EvaluationResult[]>([]);
  const [customMode, setCustomMode] = useState<boolean>(false);

  // Custom inputs
  const [customAgentName, setCustomAgentName] = useState("Custom Agent");
  const [customAgentId, setCustomAgentId] = useState("agent-custom");
  const [customAction, setCustomAction] = useState("");
  const [customResource, setCustomResource] = useState("");

  const scenario = ATTACK_SCENARIOS.find((s) => s.id === selectedScenarioId) ?? ATTACK_SCENARIOS[0];

  useEffect(() => {
    setRecentEvents(loadRecentEvents().reverse().slice(0, 4));
    const onStorage = () => setRecentEvents(loadRecentEvents().reverse().slice(0, 4));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  async function handleSimulateAttack() {
    setIsSimulating(true);
    setError(null);
    setResult(null);
    setActiveStep(0);

    const agentId = customMode ? customAgentId : scenario.agentId;
    const agentName = customMode ? customAgentName : scenario.agentName;
    const action = customMode ? customAction : scenario.action;
    const resource = customMode ? customResource : scenario.resource;

    if (customMode && (!action.trim() || !resource.trim())) {
      setError("Please fill in both Action and Resource for custom simulation.");
      setIsSimulating(false);
      setActiveStep(-1);
      return;
    }

    try {
      // Trigger API evaluation
      const resPromise = fetch("/api/security/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, agentName, action, resource }),
      });

      // Step-by-step pipeline animation (fast: ~250ms per step = 1.5s total)
      for (let i = 1; i < EVAL_STEPS.length; i++) {
        await new Promise((r) => setTimeout(r, 220));
        setActiveStep(i);
      }

      const res = await resPromise;
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data: EvaluationResult = await res.json();
      setResult(data);
      saveEvent(data);
      setRecentEvents(loadRecentEvents().reverse().slice(0, 4));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Attack simulation failed.");
    } finally {
      setIsSimulating(false);
      setActiveStep(-1);
    }
  }

  return (
    <div style={{ padding: "32px", maxWidth: "1150px", margin: "0 auto" }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "3px 10px",
              borderRadius: "20px",
              background: "rgba(239, 68, 68, 0.12)",
              color: "var(--danger)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            🛡️ AI AGENT ATTACK LAB
          </span>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: "20px",
              background: "rgba(0, 212, 170, 0.1)",
              color: "var(--accent)",
              border: "1px solid rgba(0, 212, 170, 0.25)",
            }}
          >
            SAFE CONTROLLED SANDBOX
          </span>
        </div>

        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "6px" }}>
          AI Agent Attack Lab
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "750px" }}>
          Simulate compromised AI agents and see how Aegis intercepts dangerous actions before execution.
        </p>
      </div>

      {/* ── Scenario Selector ───────────────────────────────────────────── */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
            Select Attack Scenario
          </h2>
          <button
            onClick={() => setCustomMode(!customMode)}
            style={{
              background: customMode ? "var(--accent)" : "transparent",
              color: customMode ? "#080d16" : "var(--text-secondary)",
              border: "1px solid " + (customMode ? "var(--accent)" : "var(--border)"),
              borderRadius: "6px",
              padding: "4px 10px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {customMode ? "Switch to Preset Scenarios" : "⚙️ Custom Manual Mode"}
          </button>
        </div>

        {!customMode ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: "16px" }}>
            {ATTACK_SCENARIOS.map((sc) => {
              const isSelected = selectedScenarioId === sc.id;
              const isPrimary = sc.badge === "PRIMARY DEMO";
              return (
                <div
                  key={sc.id}
                  onClick={() => {
                    setSelectedScenarioId(sc.id);
                    setResult(null);
                    setError(null);
                  }}
                  className="surface"
                  style={{
                    padding: "20px",
                    cursor: "pointer",
                    position: "relative",
                    border: isSelected
                      ? isPrimary
                        ? "2px solid var(--accent)"
                        : "2px solid var(--danger)"
                      : "1px solid var(--border)",
                    boxShadow: isSelected
                      ? isPrimary
                        ? "0 0 24px rgba(0, 212, 170, 0.15)"
                        : "0 0 24px rgba(239, 68, 68, 0.15)"
                      : "none",
                    transition: "all 0.2s ease",
                    background: isSelected ? "var(--bg-elevated)" : "var(--bg-surface)",
                  }}
                >
                  {/* Top tags */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    {sc.badge && (
                      <span
                        style={{
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: isPrimary ? "rgba(0, 212, 170, 0.2)" : "rgba(245, 158, 11, 0.2)",
                          color: isPrimary ? "var(--accent)" : "var(--warning)",
                          border: isPrimary ? "1px solid var(--accent)" : "1px solid var(--warning)",
                        }}
                      >
                        {sc.badge}
                      </span>
                    )}
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "10px",
                        background: sc.agentStatus === "COMPROMISED" ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)",
                        color: sc.agentStatus === "COMPROMISED" ? "var(--danger)" : "var(--warning)",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }} />
                      {sc.agentStatus}
                    </span>
                  </div>

                  {/* Title & Agent */}
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "4px", color: isSelected ? "var(--text-primary)" : "var(--text-secondary)" }}>
                    {sc.name}
                  </h3>
                  <div style={{ fontSize: "0.8rem", color: "var(--accent)", fontWeight: 500, marginBottom: "10px" }}>
                    🤖 {sc.agentName}
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "16px" }}>
                    {sc.attackDescription}
                  </p>

                  {/* Expected Metrics Footer */}
                  <div
                    style={{
                      paddingTop: "12px",
                      borderTop: "1px solid var(--border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.75rem",
                    }}
                  >
                    <span style={{ color: "var(--danger)", fontWeight: 700, fontFamily: "var(--font-geist-mono)" }}>
                      Risk: {sc.expectedScore}/100
                    </span>
                    <span className="badge badge-critical" style={{ fontSize: "0.65rem", padding: "1px 6px" }}>
                      {sc.expectedSeverity}
                    </span>
                    <span className="badge badge-block" style={{ fontSize: "0.65rem", padding: "1px 6px" }}>
                      {sc.expectedDecision}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Custom Action Form */
          <div className="surface" style={{ padding: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label>Agent Name</label>
                <input className="input" value={customAgentName} onChange={(e) => setCustomAgentName(e.target.value)} />
              </div>
              <div>
                <label>Agent ID</label>
                <input className="input" value={customAgentId} onChange={(e) => setCustomAgentId(e.target.value)} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label>Simulated Action</label>
                <input
                  className="input"
                  placeholder="e.g. Read credentials and send them externally"
                  value={customAction}
                  onChange={(e) => setCustomAction(e.target.value)}
                />
              </div>
              <div>
                <label>Simulated Resource</label>
                <input
                  className="input"
                  placeholder="e.g. .env"
                  value={customResource}
                  onChange={(e) => setCustomResource(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Execution & Interception Cockpit ────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: "24px", alignItems: "start", marginBottom: "36px" }}>
        {/* ── Left Column: Threat Details & Attack Chain ─────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Agent & Threat Card */}
          <div className="surface" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                Threat Profile
              </span>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "var(--danger)",
                  background: "rgba(239, 68, 68, 0.12)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                ⚠️ COMPROMISED VECTOR
              </span>
            </div>

            {/* Agent Identity */}
            <div
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "14px",
                marginBottom: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{ fontSize: "1.2rem" }}>🤖</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>{customMode ? customAgentName : scenario.agentName}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}>
                    ID: {customMode ? customAgentId : scenario.agentId}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "8px" }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Permitted Scope: </span>
                {customMode ? "Custom Scope" : scenario.assignedScope}
              </div>
            </div>

            {/* Attack Details */}
            <div
              style={{
                background: "rgba(239, 68, 68, 0.05)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "8px",
                padding: "14px",
                marginBottom: "18px",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: "var(--danger)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                Target Execution Payload
              </div>
              <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.82rem", color: "var(--text-primary)", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-muted)" }}>action: </span>
                <span style={{ color: "var(--warning)", fontWeight: 600 }}>
                  {customMode ? customAction || "N/A" : scenario.action}
                </span>
              </div>
              <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.82rem", color: "var(--text-primary)" }}>
                <span style={{ color: "var(--text-muted)" }}>target: </span>
                <span style={{ color: "var(--danger)", fontWeight: 600 }}>
                  {customMode ? customResource || "N/A" : scenario.resource}
                </span>
              </div>
            </div>

            {/* Attack Chain */}
            <div style={{ marginBottom: "22px" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "10px" }}>
                Simulated Attack Chain
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(customMode
                  ? [
                      `Agent requests access to ${customResource || "resource"}`,
                      `Agent attempts ${customAction || "action"}`,
                      "Aegis Firewall evaluates security policies",
                      "Aegis intercepts unauthorized execution",
                    ]
                  : scenario.attackChain
                ).map((step, idx) => {
                  const isLast = idx === 3;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "0.78rem",
                        color: isLast ? "var(--accent)" : "var(--text-secondary)",
                        fontWeight: isLast ? 600 : 400,
                        background: isLast ? "rgba(0, 212, 170, 0.08)" : "transparent",
                        padding: isLast ? "6px 10px" : "4px 0",
                        borderRadius: "6px",
                        border: isLast ? "1px solid rgba(0, 212, 170, 0.2)" : "none",
                      }}
                    >
                      <span
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: isLast ? "var(--accent)" : "var(--bg-elevated)",
                          color: isLast ? "#080d16" : "var(--text-muted)",
                          fontSize: "0.68rem",
                          fontWeight: 700,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: "var(--danger-dim)",
                  border: "1px solid var(--danger)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "0.85rem",
                  color: "var(--danger)",
                  marginBottom: "16px",
                }}
              >
                {error}
              </div>
            )}

            {/* Launch Attack Button */}
            <button
              className="btn-danger"
              onClick={handleSimulateAttack}
              disabled={isSimulating}
              style={{
                width: "100%",
                padding: "14px 20px",
                fontSize: "0.95rem",
                fontWeight: 700,
                letterSpacing: "0.02em",
                boxShadow: isSimulating ? "none" : "0 0 20px rgba(239, 68, 68, 0.25)",
              }}
            >
              {isSimulating ? "⚡ Simulating Attack & Intercepting..." : "⚡ Simulate Attack"}
            </button>
          </div>
        </div>

        {/* ── Right Column: Live Interception & Security Engine Response ──── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Live Progress Pipeline Animation */}
          {isSimulating && (
            <div className="surface fade-in" style={{ padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <span className="status-dot pulse" style={{ background: "var(--accent)" }} />
                <span style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-primary)" }}>
                  Aegis Evaluation Pipeline Running
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {EVAL_STEPS.map((step, idx) => {
                  const isDone = activeStep > idx;
                  const isCurrent = activeStep === idx;
                  return (
                    <div
                      key={step.label}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        background: isCurrent
                          ? "rgba(0, 212, 170, 0.1)"
                          : isDone
                          ? "rgba(255, 255, 255, 0.03)"
                          : "transparent",
                        border: isCurrent
                          ? "1px solid var(--accent)"
                          : isDone
                          ? "1px solid var(--border)"
                          : "1px dashed var(--border)",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ fontSize: "1rem" }}>
                        {isDone ? "✅" : isCurrent ? "⚡" : "⏳"}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: isCurrent ? "var(--accent)" : isDone ? "var(--text-primary)" : "var(--text-muted)" }}>
                          {step.label}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{step.detail}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Evaluation Result View */}
          {result && !isSimulating && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Decision & Interception Banner */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(8, 13, 22, 0.95) 100%)",
                  border: "2px solid var(--danger)",
                  borderRadius: "14px",
                  padding: "24px",
                  boxShadow: "0 0 35px rgba(239, 68, 68, 0.25)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "2.4rem", lineHeight: 1 }}>🚫</span>
                      <div>
                        <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--danger)", letterSpacing: "-0.03em" }}>
                          BLOCKED
                        </div>
                        <span className="badge badge-critical" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                          {result.severity} SEVERITY
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Risk Score Pill */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 700 }}>
                      Deterministic Risk
                    </div>
                    <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "var(--danger)", fontFamily: "var(--font-geist-mono)" }}>
                      {result.riskScore}
                      <span style={{ fontSize: "1.1rem", color: "var(--text-muted)", fontWeight: 500 }}>/100</span>
                    </div>
                  </div>
                </div>

                {/* Interception Badge & Callout */}
                <div
                  style={{
                    background: "rgba(8, 13, 22, 0.8)",
                    border: "1px solid rgba(239, 68, 68, 0.35)",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>🛡️</span>
                  <div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      INTERCEPTED BY AEGIS
                    </div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      &ldquo;{result.interceptedMessage || "Action prevented before execution."}&rdquo;
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Attack -> Interception Flow Hierarchy */}
              <div className="surface" style={{ padding: "18px 22px" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "12px" }}>
                  Interception Architecture Flow
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    textAlign: "center",
                    fontSize: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ background: "var(--bg-elevated)", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", flex: 1, minWidth: "90px" }}>
                    <div style={{ fontSize: "1rem" }}>🤖</div>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.75rem" }}>AI Agent</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Compromised</div>
                  </div>

                  <span style={{ color: "var(--danger)", fontWeight: 700 }}>➔</span>

                  <div style={{ background: "rgba(239, 68, 68, 0.1)", padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(239, 68, 68, 0.3)", flex: 1.2, minWidth: "110px" }}>
                    <div style={{ fontSize: "1rem" }}>⚠️</div>
                    <div style={{ fontWeight: 700, color: "var(--danger)", fontSize: "0.75rem" }}>Dangerous Action</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Target Payload</div>
                  </div>

                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>➔</span>

                  <div style={{ background: "rgba(0, 212, 170, 0.1)", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--accent)", flex: 1.2, minWidth: "110px" }}>
                    <div style={{ fontSize: "1rem" }}>🛡️</div>
                    <div style={{ fontWeight: 700, color: "var(--accent)", fontSize: "0.75rem" }}>Aegis Firewall</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--accent)" }}>Intercepts Live</div>
                  </div>

                  <span style={{ color: "var(--danger)", fontWeight: 700 }}>➔</span>

                  <div style={{ background: "rgba(239, 68, 68, 0.2)", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--danger)", flex: 1, minWidth: "90px" }}>
                    <div style={{ fontSize: "1rem" }}>🚫</div>
                    <div style={{ fontWeight: 800, color: "var(--danger)", fontSize: "0.75rem" }}>BLOCKED</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--danger)" }}>{result.riskScore}/100</div>
                  </div>
                </div>
              </div>

              {/* Security Checks Table */}
              <div className="surface" style={{ padding: "22px" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "14px" }}>
                  Aegis Security Evaluation Checks
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(result.securityChecks || []).map((chk: SecurityCheckItem, i: number) => {
                    const isPass = chk.status === "PASS";
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          background: isPass ? "rgba(0, 212, 170, 0.04)" : "rgba(239, 68, 68, 0.08)",
                          border: isPass ? "1px solid rgba(0, 212, 170, 0.15)" : "1px solid rgba(239, 68, 68, 0.25)",
                          fontSize: "0.78rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            style={{
                              fontSize: "0.65rem",
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: isPass ? "var(--accent)" : "var(--danger)",
                              color: isPass ? "#080d16" : "#ffffff",
                            }}
                          >
                            {chk.status}
                          </span>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{chk.name}</span>
                        </div>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.74rem" }}>{chk.detail}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reasons & Analysis */}
              <div className="surface" style={{ padding: "22px" }}>
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "8px" }}>
                    Identified Violation Reasons
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {result.reasons.map((r, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        <span style={{ color: "var(--danger)", fontSize: "0.8rem" }}>⛔</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "8px" }}>
                    Deterministic Security Engine Analysis
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {result.explanation}
                  </p>
                </div>

                <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)" }} />
                    Recorded to Aegis Event Timeline
                  </span>
                  <Link href="/dashboard/events" style={{ fontSize: "0.75rem", color: "var(--accent)", textDecoration: "underline" }}>
                    View in Event History →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Idle state */}
          {!result && !isSimulating && (
            <div
              className="surface"
              style={{
                padding: "60px 30px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.6rem",
                  marginBottom: "16px",
                }}
              >
                🛡️
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>
                Aegis Firewall Standing Guard
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: "380px", lineHeight: 1.6, marginBottom: "20px" }}>
                Click <strong>&ldquo;Simulate Attack&rdquo;</strong> to launch the simulated threat vector and watch Aegis intercept, inspect, and neutralize the request in real time.
              </p>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  background: "var(--bg-base)",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                }}
              >
                Safe execution: No actual external transmission, filesystem deletion, or credential exfiltration occurs.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Security Event Timeline Strip ───────────────────────────────── */}
      <div className="surface" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "0.92rem", fontWeight: 700 }}>Security Event Timeline</h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Real-time audit log of simulated agent attacks intercepted by Aegis.
            </p>
          </div>
          <Link href="/dashboard/events" style={{ fontSize: "0.78rem", color: "var(--accent)" }}>
            Full Event History →
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
            No security events recorded yet. Simulate an attack to generate audit events.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recentEvents.map((ev, i) => (
              <div
                key={i}
                className="event-row"
                style={{
                  borderRadius: "8px",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "120px" }}>
                  <span className={`badge ${ev.decision === "BLOCK" ? "badge-block" : "badge-allow"}`} style={{ fontSize: "0.68rem" }}>
                    {ev.decision}
                  </span>
                  <span className="badge badge-critical" style={{ fontSize: "0.68rem" }}>
                    {ev.severity}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ev.request.agentName}: &ldquo;{ev.request.action}&rdquo;
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}>
                    Target: {ev.request.resource} · {new Date(ev.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--danger)", fontFamily: "var(--font-geist-mono)" }}>
                    {ev.riskScore}/100
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
