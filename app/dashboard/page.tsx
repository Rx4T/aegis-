"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EvaluationResult } from "@/lib/security-engine";

const STORAGE_KEY = "aegis_events";

const CUSTOMER_SUPPORT_AGENT = {
  id: "agent-customer-support",
  name: "Customer Support Agent",
  status: "Active",
  allowed: ["Search knowledge base", "Read customer profile"],
  review: ["Send email"],
  blocked: ["Delete customer", "Read secrets", "Execute command", "External data transfer"],
  lastActive: "Just now",
};

function loadEvents(): EvaluationResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function DecisionBadge({ decision }: { decision: string }) {
  const cls = decision === "BLOCK" ? "badge-block" : decision === "REVIEW" ? "badge-review" : "badge-allow";
  return <span className={`badge ${cls}`}>{decision}</span>;
}

function SeverityBadge({ severity }: { severity: string }) {
  const cls = severity === "CRITICAL" ? "badge-critical" : severity === "HIGH" ? "badge-high" : severity === "MEDIUM" ? "badge-medium" : "badge-low";
  return <span className={`badge ${cls}`}>{severity}</span>;
}

export default function DashboardPage() {
  const [events, setEvents] = useState<EvaluationResult[]>([]);

  useEffect(() => {
    setEvents(loadEvents());
    const onStorage = () => setEvents(loadEvents());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const total = events.length;
  const blocked = events.filter((e) => e.decision === "BLOCK").length;
  const critical = events.filter((e) => e.severity === "CRITICAL").length;
  const allowed = events.filter((e) => e.decision === "ALLOW").length;
  const securityScore = total === 0 ? 100 : Math.round(100 - (blocked / total) * 60);
  const recent = [...events].reverse().slice(0, 5);

  return (
    <div style={{ padding: "32px", maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "6px" }}>Security Overview</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Real-time view of your AI agent security posture.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: securityScore >= 80 ? "var(--accent)" : securityScore >= 60 ? "var(--warning)" : "var(--danger)" }}>
            {securityScore}
          </div>
          <div className="stat-label">Security Score</div>
          <div style={{ marginTop: "12px" }} className="risk-bar-track">
            <div className="risk-bar-fill" style={{
              width: `${securityScore}%`,
              background: securityScore >= 80 ? "var(--accent)" : securityScore >= 60 ? "var(--warning)" : "var(--danger)",
            }} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: blocked > 0 ? "var(--danger)" : "var(--text-primary)" }}>{blocked}</div>
          <div className="stat-label">Threats Blocked</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: critical > 0 ? "var(--danger)" : "var(--text-primary)" }}>{critical}</div>
          <div className="stat-label">Critical Threats</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--accent)" }}>{allowed}</div>
          <div className="stat-label">Allowed Actions</div>
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
        {/* Agent card */}
        <div className="surface" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 600 }}>Registered Agents</h2>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>1 active</span>
          </div>

          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <span className="status-dot pulse" />
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{CUSTOMER_SUPPORT_AGENT.name}</span>
              <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}>
                {CUSTOMER_SUPPORT_AGENT.id}
              </span>
            </div>

            <div style={{ fontSize: "0.8rem" }}>
              <div style={{ marginBottom: "10px" }}>
                <span style={{ color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.06em", fontWeight: 600 }}>Allowed</span>
                <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {CUSTOMER_SUPPORT_AGENT.allowed.map((a) => (
                    <span key={a} className="badge badge-allow">{a}</span>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <span style={{ color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.06em", fontWeight: 600 }}>Review</span>
                <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {CUSTOMER_SUPPORT_AGENT.review.map((a) => (
                    <span key={a} className="badge badge-review">{a}</span>
                  ))}
                </div>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.06em", fontWeight: 600 }}>Blocked</span>
                <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {CUSTOMER_SUPPORT_AGENT.blocked.map((a) => (
                    <span key={a} className="badge badge-block">{a}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent events */}
        <div className="surface" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 600 }}>Recent Events</h2>
            <Link href="/dashboard/events" style={{ fontSize: "0.78rem", color: "var(--accent)" }}>View all →</Link>
          </div>

          {recent.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
              No events yet. Run the simulator to see results.
            </div>
          ) : (
            <div>
              {recent.map((ev, i) => (
                <div key={i} className="event-row" style={{ borderRadius: "8px" }}>
                  <DecisionBadge decision={ev.decision} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.request.action}
                    </div>
                    <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      {ev.request.resource} · {new Date(ev.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: ev.riskScore >= 80 ? "var(--danger)" : ev.riskScore >= 50 ? "var(--warning)" : "var(--accent)" }}>
                    {ev.riskScore}/100
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Simulate Attack CTA */}
      <div style={{
        background: "var(--danger-dim)",
        border: "1px solid var(--danger)",
        borderRadius: "12px",
        padding: "28px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
      }}>
        <div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--danger)", marginBottom: "6px" }}>
            ⚡ AI Agent Attack Lab
          </h3>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", maxWidth: "500px" }}>
            Test compromised AI agent threat vectors and see how Aegis intercepts dangerous actions before execution.
          </p>
        </div>
        <Link href="/dashboard/simulator" className="btn-danger" style={{ padding: "12px 24px" }}>
          Launch Attack Lab →
        </Link>
      </div>
    </div>
  );
}
