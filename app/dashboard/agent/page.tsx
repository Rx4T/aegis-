"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { EvaluationResult, SecurityCheckItem } from "@/lib/security-engine";

const STORAGE_KEY = "aegis_events";

interface ExternalScenario {
  id: string;
  name: string;
  badge: string;
  agentName: string;
  agentId: string;
  status: "UNTRUSTED";
  description: string;
  action: string;
  resource: string;
  expectedScore: number;
  expectedSeverity: "CRITICAL";
  expectedDecision: "BLOCKED";
}

const EXTERNAL_SCENARIOS: ExternalScenario[] = [
  {
    id: "data-exfiltration",
    name: "A. Data Exfiltration",
    badge: "PRIMARY DEMO",
    agentName: "External Research Agent",
    agentId: "external-research-01",
    status: "UNTRUSTED",
    description: "Simulates an external AI agent requesting access to protected environment secrets and attempting egress.",
    action: "Read credentials and send them externally",
    resource: ".env",
    expectedScore: 98,
    expectedSeverity: "CRITICAL",
    expectedDecision: "BLOCKED",
  },
  {
    id: "privilege-abuse",
    name: "B. Privilege Abuse",
    badge: "DESTRUCTIVE LEDGER",
    agentName: "External Finance Agent",
    agentId: "external-finance-01",
    status: "UNTRUSTED",
    description: "Simulates an external AI agent attempting to execute an unauthorized bulk DELETE on financial invoices.",
    action: "DELETE invoices/*",
    resource: "invoices/*",
    expectedScore: 94,
    expectedSeverity: "CRITICAL",
    expectedDecision: "BLOCKED",
  },
  {
    id: "secret-access",
    name: "C. Secret Access",
    badge: "PROD CONFIG BREACH",
    agentName: "External Developer Agent",
    agentId: "external-dev-01",
    status: "UNTRUSTED",
    description: "Simulates an external AI agent attempting unauthorized read access to production environment configurations.",
    action: "READ",
    resource: ".env.production",
    expectedScore: 91,
    expectedSeverity: "CRITICAL",
    expectedDecision: "BLOCKED",
  },
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

export default function ExternalAgentSimulatorPage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("data-exfiltration");
  const [agentName, setAgentName] = useState<string>("External Research Agent");
  const [agentId, setAgentId] = useState<string>("external-research-01");
  const [action, setAction] = useState<string>("Read credentials and send them externally");
  const [resource, setResource] = useState<string>(".env");

  const [loading, setLoading] = useState<boolean>(false);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wireRequest, setWireRequest] = useState<string | null>(null);
  const [wireResponse, setWireResponse] = useState<string | null>(null);
  const [recentEvents, setRecentEvents] = useState<EvaluationResult[]>([]);

  useEffect(() => {
    setRecentEvents(loadRecentEvents().reverse().slice(0, 4));
    const onStorage = () => setRecentEvents(loadRecentEvents().reverse().slice(0, 4));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function applyScenario(sc: ExternalScenario) {
    setSelectedScenarioId(sc.id);
    setAgentName(sc.agentName);
    setAgentId(sc.agentId);
    setAction(sc.action);
    setResource(sc.resource);
    setResult(null);
    setError(null);
    setHttpStatus(null);
    setWireRequest(null);
    setWireResponse(null);
  }

  async function handleSendToAegis() {
    if (!action.trim() || !resource.trim()) {
      setError("Please specify both an action and a target resource.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setHttpStatus(null);

    const payload = {
      agentId,
      agentName,
      action,
      resource,
    };

    setWireRequest(JSON.stringify(payload, null, 2));
    setWireResponse(null);

    try {
      // REAL HTTP REQUEST to the existing Aegis evaluation endpoint
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      setHttpStatus(res.status);

      if (res.status === 401) {
        throw new Error("Authentication required: Unauthorized request rejected by Clerk.");
      }

      if (res.status === 400) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error ?? "Invalid agent action: Missing required parameters.");
      }

      if (res.status >= 500) {
        throw new Error("Aegis evaluation unavailable: Internal security server error.");
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Request could not be processed.`);
      }

      const data: EvaluationResult = await res.json();
      setResult(data);
      setWireResponse(JSON.stringify(data, null, 2));
      saveEvent(data);
      setRecentEvents(loadRecentEvents().reverse().slice(0, 4));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error communicating with Aegis API.");
    } finally {
      setLoading(false);
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
              background: "rgba(59, 130, 246, 0.12)",
              color: "var(--info)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
            }}
          >
            🌐 EXTERNAL AGENT INTEGRATION
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
            REAL HTTP API BOUNDARY
          </span>
        </div>

        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "6px" }}>
          External Agent Simulator
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "750px" }}>
          Send a tool-action request from an external AI agent into Aegis.
        </p>
      </div>

      {/* ── Predefined Attack Scenarios ─────────────────────────────────── */}
      <div style={{ marginBottom: "26px" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "12px" }}>
          Select Predefined External Attack
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: "14px" }}>
          {EXTERNAL_SCENARIOS.map((sc) => {
            const isSelected = selectedScenarioId === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => applyScenario(sc)}
                className="surface"
                style={{
                  padding: "16px 18px",
                  cursor: "pointer",
                  borderRadius: "10px",
                  border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: isSelected ? "var(--bg-elevated)" : "var(--bg-surface)",
                  boxShadow: isSelected ? "0 0 20px rgba(0, 212, 170, 0.12)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--accent)", letterSpacing: "0.06em" }}>
                    {sc.badge}
                  </span>
                  <span
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: "10px",
                      background: "rgba(239, 68, 68, 0.2)",
                      color: "var(--danger)",
                    }}
                  >
                    {sc.status}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: "4px" }}>{sc.name}</div>
                <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
                  Agent: <span style={{ color: "var(--text-primary)" }}>{sc.agentName}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
                  <span>Target: <code style={{ color: "var(--warning)" }}>{sc.resource}</code></span>
                  <span style={{ color: "var(--danger)", fontWeight: 700 }}>{sc.expectedScore}/100</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Network Architecture Visualization ─────────────────────────── */}
      <div
        className="surface"
        style={{
          padding: "18px 24px",
          marginBottom: "28px",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "14px" }}>
          Live HTTP Security Boundary Flow
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr auto 1fr auto 1.1fr",
            alignItems: "center",
            gap: "10px",
            textAlign: "center",
          }}
        >
          {/* Node 1: External Agent */}
          <div
            style={{
              background: "var(--bg-elevated)",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ fontSize: "1.2rem", marginBottom: "2px" }}>🤖</div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>EXTERNAL AGENT</div>
            <div style={{ fontSize: "0.65rem", color: "var(--danger)", fontWeight: 600 }}>UNTRUSTED</div>
          </div>

          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 700 }}>➔</div>

          {/* Node 2: HTTP POST */}
          <div
            style={{
              background: loading ? "rgba(59, 130, 246, 0.15)" : "rgba(255, 255, 255, 0.03)",
              padding: "12px",
              borderRadius: "8px",
              border: loading ? "1px solid var(--info)" : "1px solid var(--border)",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ fontSize: "1.1rem", marginBottom: "2px" }}>🌐</div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--info)", fontFamily: "var(--font-geist-mono)" }}>
              POST /api/evaluate
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>JSON Payload</div>
          </div>

          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 700 }}>➔</div>

          {/* Node 3: Aegis Firewall */}
          <div
            style={{
              background: "rgba(0, 212, 170, 0.08)",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--accent)",
            }}
          >
            <div style={{ fontSize: "1.2rem", marginBottom: "2px" }}>🛡️</div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)" }}>AEGIS FIREWALL</div>
            <div style={{ fontSize: "0.65rem", color: "var(--accent)" }}>Auth & Policy</div>
          </div>

          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 700 }}>➔</div>

          {/* Node 4: Decision */}
          <div
            style={{
              background: result
                ? "rgba(239, 68, 68, 0.15)"
                : "rgba(255, 255, 255, 0.02)",
              padding: "12px",
              borderRadius: "8px",
              border: result ? "2px solid var(--danger)" : "1px dashed var(--border)",
            }}
          >
            <div style={{ fontSize: "1.2rem", marginBottom: "2px" }}>{result ? "🚫" : "⏳"}</div>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: result ? "var(--danger)" : "var(--text-muted)" }}>
              {result ? `${result.decision} (${result.riskScore}/100)` : "DECISION READY"}
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
              {result ? "Enforced by Engine" : "Awaiting Request"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Simulator Grid ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: "24px", alignItems: "start", marginBottom: "32px" }}>
        {/* Left: Simulated External Agent Interface */}
        <div className="surface" style={{ padding: "26px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.2rem" }}>🤖</span>
              <span style={{ fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-primary)" }}>
                External Agent Client
              </span>
            </div>
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 800,
                color: "var(--danger)",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                padding: "2px 8px",
                borderRadius: "12px",
                letterSpacing: "0.05em",
              }}
            >
              STATUS: UNTRUSTED
            </span>
          </div>

          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "20px" }}>
            Simulates an external AI agent requesting access to protected resources via HTTP.
          </p>

          <div style={{ marginBottom: "16px" }}>
            <label>Agent Name</label>
            <input className="input" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>Agent ID</label>
            <input className="input" value={agentId} onChange={(e) => setAgentId(e.target.value)} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>Requested Action</label>
            <input
              className="input"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. Read credentials and send them externally"
            />
          </div>

          <div style={{ marginBottom: "22px" }}>
            <label>Requested Resource</label>
            <input
              className="input"
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              placeholder="e.g. .env"
            />
          </div>

          {error && (
            <div
              style={{
                background: "var(--danger-dim)",
                border: "1px solid var(--danger)",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "0.82rem",
                color: "var(--danger)",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          )}

          <button
            className="btn-primary"
            onClick={handleSendToAegis}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "0.95rem",
              fontWeight: 700,
              background: loading ? "var(--border)" : "var(--accent)",
              color: "#080d16",
              boxShadow: loading ? "none" : "0 0 20px rgba(0, 212, 170, 0.25)",
            }}
          >
            {loading ? "🌐 Dispatching HTTP POST /api/evaluate..." : "🚀 Send Action to Aegis"}
          </button>
        </div>

        {/* Right: Real HTTP Request & Security Decision Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Wire Protocol Terminal View */}
          <div
            className="surface"
            style={{
              padding: "20px",
              background: "#04070d",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                HTTP Wire Inspector
              </span>
              {httpStatus && (
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: httpStatus === 200 ? "rgba(0, 212, 170, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    color: httpStatus === 200 ? "var(--accent)" : "var(--danger)",
                    border: httpStatus === 200 ? "1px solid var(--accent)" : "1px solid var(--danger)",
                  }}
                >
                  HTTP {httpStatus} {httpStatus === 200 ? "OK" : "ERROR"}
                </span>
              )}
            </div>

            {/* Request Summary */}
            <div style={{ fontSize: "0.78rem", marginBottom: "10px" }}>
              <span style={{ color: "var(--accent)", fontWeight: 700 }}>POST</span>{" "}
              <span style={{ color: "var(--text-primary)" }}>/api/evaluate</span>{" "}
              <span style={{ color: "var(--text-muted)" }}>HTTP/1.1</span>
            </div>

            {wireRequest ? (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  padding: "10px",
                  borderRadius: "6px",
                  fontSize: "0.72rem",
                  color: "var(--text-secondary)",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.5,
                  maxHeight: "110px",
                  overflow: "auto",
                }}
              >
                {wireRequest}
              </div>
            ) : (
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic", padding: "8px 0" }}>
                Waiting to dispatch external request...
              </div>
            )}
          </div>

          {/* Evaluation Result View */}
          {result ? (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Decision Box */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(8, 13, 22, 0.95) 100%)",
                  border: "2px solid var(--danger)",
                  borderRadius: "14px",
                  padding: "24px",
                  boxShadow: "0 0 35px rgba(239, 68, 68, 0.25)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "2.2rem", lineHeight: 1 }}>🚫</span>
                      <div>
                        <div style={{ fontSize: "1.7rem", fontWeight: 900, color: "var(--danger)", letterSpacing: "-0.02em" }}>
                          {result.decision}
                        </div>
                        <span className="badge badge-critical" style={{ fontSize: "0.68rem" }}>
                          {result.severity} SEVERITY
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 700 }}>
                      Risk Score
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--danger)", fontFamily: "var(--font-geist-mono)" }}>
                      {result.riskScore}
                      <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 500 }}>/100</span>
                    </div>
                  </div>
                </div>

                {/* Aegis Interception Banner */}
                <div
                  style={{
                    background: "rgba(8, 13, 22, 0.8)",
                    border: "1px solid rgba(239, 68, 68, 0.35)",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>🛡️</span>
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      INTERCEPTED BY AEGIS
                    </div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      &ldquo;{result.interceptedMessage || "Action prevented before execution."}&rdquo;
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Checks Grid */}
              <div className="surface" style={{ padding: "20px" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "12px" }}>
                  Aegis Security Checks
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
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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

              {/* Identified Reasons */}
              <div className="surface" style={{ padding: "20px" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "8px" }}>
                  Identified Violations
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
                  {result.reasons.map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--danger)" }}>⛔</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>

                <div style={{ paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "6px" }}>
                    Engine Technical Analysis
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {result.explanation}
                  </p>
                </div>

                <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)" }} />
                    Logged to Aegis Audit Trail
                  </span>
                  <Link href="/dashboard/events" style={{ fontSize: "0.75rem", color: "var(--accent)", textDecoration: "underline" }}>
                    View in Event History →
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="surface"
              style={{
                padding: "48px 24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  marginBottom: "14px",
                }}
              >
                🌐
              </div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "8px" }}>
                Ready to Intercept External Call
              </h3>
              <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", maxWidth: "360px", lineHeight: 1.6, marginBottom: "16px" }}>
                Click <strong>&ldquo;Send Action to Aegis&rdquo;</strong> to dispatch a live HTTP POST to the security endpoint.
              </p>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "var(--bg-base)", padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                Safe simulation: No actual files are read, modified, or exfiltrated.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Security Event Timeline ─────────────────────────────────────── */}
      <div className="surface" style={{ padding: "22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div>
            <h3 style={{ fontSize: "0.92rem", fontWeight: 700 }}>Aegis Audit Timeline</h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Real-time audit log of external agent actions evaluated and intercepted by Aegis.
            </p>
          </div>
          <Link href="/dashboard/events" style={{ fontSize: "0.78rem", color: "var(--accent)" }}>
            Full Event History →
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "16px 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
            No security events logged yet. Send an action above to generate audit entries.
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
