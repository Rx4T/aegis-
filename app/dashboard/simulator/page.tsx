"use client";

import { useState } from "react";
import { EvaluationResult } from "@/lib/security-engine";

const STORAGE_KEY = "aegis_events";

const AGENTS = [
  { id: "agent-customer-support", name: "Customer Support Agent" },
  { id: "agent-custom", name: "Custom Agent" },
];

const PRESETS = [
  {
    label: "✅ Search knowledge base",
    agentId: "agent-customer-support",
    action: "Search knowledge base",
    resource: "FAQ database",
  },
  {
    label: "✅ Read customer profile",
    agentId: "agent-customer-support",
    action: "Read customer profile",
    resource: "Customer records",
  },
  {
    label: "⚠️ Send email to customer",
    agentId: "agent-customer-support",
    action: "Send email to customer",
    resource: "Email service",
  },
  {
    label: "🔴 Delete customer record",
    agentId: "agent-customer-support",
    action: "Delete customer record",
    resource: "Customer database",
  },
  {
    label: "🔴 Execute system command",
    agentId: "agent-customer-support",
    action: "Execute command: ls -la /etc",
    resource: "System shell",
  },
  {
    label: "🔴 Attack: Read credentials & exfiltrate",
    agentId: "agent-customer-support",
    action: "Read credentials and send them externally",
    resource: ".env",
  },
];

function saveEvent(result: EvaluationResult) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: EvaluationResult[] = raw ? JSON.parse(raw) : [];
    existing.push(result);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    window.dispatchEvent(new Event("storage"));
  } catch { /* ignore */ }
}

function RiskBar({ score }: { score: number }) {
  const color = score >= 80 ? "var(--danger)" : score >= 60 ? "#f97316" : score >= 30 ? "var(--warning)" : "var(--accent)";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Risk Score</span>
        <span style={{ fontSize: "1.4rem", fontWeight: 700, color, fontFamily: "var(--font-geist-mono)", letterSpacing: "-0.02em" }}>
          {score}<span style={{ fontSize: "0.9rem", fontWeight: 400, color: "var(--text-muted)" }}>/100</span>
        </span>
      </div>
      <div className="risk-bar-track">
        <div className="risk-bar-fill" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

function DecisionPanel({ result }: { result: EvaluationResult }) {
  const panelClass = result.decision === "BLOCK" ? "decision-block" : result.decision === "REVIEW" ? "decision-review" : "decision-allow";
  const decisionColor = result.decision === "BLOCK" ? "var(--danger)" : result.decision === "REVIEW" ? "var(--warning)" : "var(--accent)";
  const decisionIcon = result.decision === "BLOCK" ? "⛔" : result.decision === "REVIEW" ? "⚠️" : "✅";
  const severityClass = result.severity === "CRITICAL" ? "badge-critical" : result.severity === "HIGH" ? "badge-high" : result.severity === "MEDIUM" ? "badge-medium" : "badge-low";

  return (
    <div className={`${panelClass} fade-in`} style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ fontSize: "2.2rem", fontWeight: 800, color: decisionColor, letterSpacing: "-0.03em" }}>
          {decisionIcon} {result.decision}
        </div>
        <span className={`badge ${severityClass}`} style={{ fontSize: "0.75rem", padding: "4px 12px" }}>
          {result.severity}
        </span>
      </div>
    </div>
  );
}

export default function SimulatorPage() {
  const [agentId, setAgentId] = useState("agent-customer-support");
  const [action, setAction] = useState("");
  const [resource, setResource] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function applyPreset(preset: typeof PRESETS[0]) {
    setAgentId(preset.agentId);
    setAction(preset.action);
    setResource(preset.resource);
    setResult(null);
    setError(null);
    setSaved(false);
  }

  async function handleEvaluate() {
    if (!action.trim() || !resource.trim()) {
      setError("Please fill in both Action and Resource fields.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);

    const agentName = AGENTS.find((a) => a.id === agentId)?.name ?? "Unknown Agent";

    try {
      const res = await fetch("/api/security/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, agentName, action, resource }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data: EvaluationResult = await res.json();
      setResult(data);
      saveEvent(data);
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Evaluation failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setResult(null);
    setAction("");
    setResource("");
    setError(null);
    setSaved(false);
  }

  const agentName = AGENTS.find((a) => a.id === agentId)?.name ?? "Unknown Agent";

  return (
    <div style={{ padding: "32px", maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "6px" }}>Action Simulator</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Submit an agent action and see how the Aegis security engine evaluates it.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1fr" : "1fr", gap: "24px" }}>
        {/* Input panel */}
        <div className="surface" style={{ padding: "28px" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "24px" }}>Evaluation Request</h2>

          {/* Presets */}
          <div style={{ marginBottom: "20px" }}>
            <label>Quick Scenarios</label>
            <select
              className="input"
              value=""
              onChange={(e) => {
                const idx = parseInt(e.target.value);
                if (!isNaN(idx)) applyPreset(PRESETS[idx]);
              }}
            >
              <option value="">— Select a scenario —</option>
              {PRESETS.map((p, i) => (
                <option key={i} value={i}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="divider" style={{ marginBottom: "20px" }} />

          {/* Agent */}
          <div style={{ marginBottom: "16px" }}>
            <label>Agent</label>
            <select className="input" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
              {AGENTS.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Action */}
          <div style={{ marginBottom: "16px" }}>
            <label>Action</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Read credentials and send them externally"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEvaluate()}
            />
          </div>

          {/* Resource */}
          <div style={{ marginBottom: "24px" }}>
            <label>Resource</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. .env"
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEvaluate()}
            />
          </div>

          {error && (
            <div style={{
              background: "var(--danger-dim)",
              border: "1px solid var(--danger)",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "0.85rem",
              color: "var(--danger)",
              marginBottom: "16px",
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="btn-primary"
              onClick={handleEvaluate}
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? "Evaluating..." : "⚡ Evaluate Action"}
            </button>
            {result && (
              <button className="btn-ghost" onClick={handleClear} style={{ padding: "10px 14px" }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Result panel */}
        {result && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Decision */}
            <DecisionPanel result={result} />

            {/* Risk score */}
            <div className="surface" style={{ padding: "20px" }}>
              <RiskBar score={result.riskScore} />
            </div>

            {/* Details */}
            <div className="surface" style={{ padding: "20px" }}>
              {/* Request summary */}
              <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Request</p>
                <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.78rem", lineHeight: 2, color: "var(--text-secondary)" }}>
                  <div><span style={{ color: "var(--text-muted)" }}>agent:</span> {agentName}</div>
                  <div><span style={{ color: "var(--text-muted)" }}>action:</span> {result.request.action}</div>
                  <div><span style={{ color: "var(--text-muted)" }}>resource:</span> {result.request.resource}</div>
                </div>
              </div>

              {/* Matched rules */}
              {result.matchedRules.length > 0 && (
                <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Matched Rules</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {result.matchedRules.map((r) => (
                      <div key={r} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem" }}>
                        <span style={{ color: "var(--danger)", fontSize: "0.7rem" }}>●</span>
                        <code style={{ color: "var(--text-secondary)", fontFamily: "var(--font-geist-mono)", fontSize: "0.78rem" }}>{r}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reasons */}
              {result.reasons.length > 0 && (
                <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Reasons</p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                    {result.reasons.map((r) => (
                      <li key={r} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        <span style={{ color: result.decision === "BLOCK" ? "var(--danger)" : result.decision === "REVIEW" ? "var(--warning)" : "var(--accent)", marginTop: "2px" }}>•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Explanation */}
              <div>
                <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Security Analysis</p>
                <div style={{
                  background: "var(--bg-base)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "14px",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.7,
                }}>
                  {result.explanation}
                </div>
              </div>

              {saved && (
                <div style={{ marginTop: "14px", fontSize: "0.78rem", color: "var(--accent)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>●</span> Saved to event history
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
