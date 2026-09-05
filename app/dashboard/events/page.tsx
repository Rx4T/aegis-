"use client";

import { useEffect, useState } from "react";
import { EvaluationResult } from "@/lib/security-engine";

const STORAGE_KEY = "aegis_events";

function loadEvents(): EvaluationResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

type Filter = "ALL" | "BLOCK" | "REVIEW" | "ALLOW";

function DecisionBadge({ decision }: { decision: string }) {
  const cls = decision === "BLOCK" ? "badge-block" : decision === "REVIEW" ? "badge-review" : "badge-allow";
  return <span className={`badge ${cls}`}>{decision}</span>;
}

function SeverityBadge({ severity }: { severity: string }) {
  const cls = severity === "CRITICAL" ? "badge-critical" : severity === "HIGH" ? "badge-high" : severity === "MEDIUM" ? "badge-medium" : "badge-low";
  return <span className={`badge ${cls}`}>{severity}</span>;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EvaluationResult[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    setEvents(loadEvents());
  }, []);

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
    setEvents([]);
    setExpandedIdx(null);
  }

  const sorted = [...events].reverse();
  const filtered = filter === "ALL" ? sorted : sorted.filter((e) => e.decision === filter);

  const counts = {
    ALL: events.length,
    BLOCK: events.filter((e) => e.decision === "BLOCK").length,
    REVIEW: events.filter((e) => e.decision === "REVIEW").length,
    ALLOW: events.filter((e) => e.decision === "ALLOW").length,
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1000px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "6px" }}>Event History</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            All security evaluation events from this session.
          </p>
        </div>
        {events.length > 0 && (
          <button className="btn-ghost" onClick={clearAll} style={{ fontSize: "0.82rem", padding: "8px 16px" }}>
            Clear All
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {(["ALL", "BLOCK", "REVIEW", "ALLOW"] as Filter[]).map((f) => {
          const isActive = filter === f;
          const color = f === "BLOCK" ? "var(--danger)" : f === "REVIEW" ? "var(--warning)" : f === "ALLOW" ? "var(--accent)" : "var(--text-primary)";
          return (
            <button
              key={f}
              onClick={() => { setFilter(f); setExpandedIdx(null); }}
              style={{
                padding: "6px 16px",
                borderRadius: "20px",
                border: `1px solid ${isActive ? color : "var(--border)"}`,
                background: isActive ? (f === "BLOCK" ? "var(--danger-dim)" : f === "REVIEW" ? "var(--warning-dim)" : f === "ALLOW" ? "var(--accent-dim)" : "var(--bg-elevated)") : "transparent",
                color: isActive ? color : "var(--text-secondary)",
                fontSize: "0.8rem",
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: "inherit",
              }}
            >
              {f}
              <span style={{
                background: isActive ? color + "30" : "var(--bg-overlay)",
                color: isActive ? color : "var(--text-muted)",
                padding: "0 6px",
                borderRadius: "10px",
                fontSize: "0.72rem",
                fontWeight: 600,
              }}>
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Events list */}
      {filtered.length === 0 ? (
        <div className="surface" style={{ padding: "60px", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "12px" }}>📋</div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            {events.length === 0
              ? "No events yet. Use the simulator to generate security events."
              : `No ${filter} events found.`}
          </p>
        </div>
      ) : (
        <div className="surface" style={{ overflow: "hidden" }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "100px 1fr 130px 80px 70px",
            gap: "12px",
            padding: "10px 16px",
            borderBottom: "1px solid var(--border)",
            fontSize: "0.68rem",
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}>
            <span>Decision</span>
            <span>Action / Resource</span>
            <span>Severity</span>
            <span>Risk</span>
            <span>Time</span>
          </div>

          {filtered.map((ev, i) => {
            const isExpanded = expandedIdx === i;
            const riskColor = ev.riskScore >= 80 ? "var(--danger)" : ev.riskScore >= 60 ? "#f97316" : ev.riskScore >= 30 ? "var(--warning)" : "var(--accent)";

            return (
              <div key={i}>
                <div
                  className="event-row"
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                  style={{ display: "grid", gridTemplateColumns: "100px 1fr 130px 80px 70px", gap: "12px", alignItems: "center", cursor: "pointer" }}
                >
                  <div><DecisionBadge decision={ev.decision} /></div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.83rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.request.action}
                    </div>
                    <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: "2px", fontFamily: "var(--font-geist-mono)" }}>
                      {ev.request.resource}
                    </div>
                  </div>
                  <div><SeverityBadge severity={ev.severity} /></div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: riskColor, fontFamily: "var(--font-geist-mono)" }}>
                    {ev.riskScore}<span style={{ fontSize: "0.7rem", fontWeight: 400, color: "var(--text-muted)" }}>/100</span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                {isExpanded && (
                  <div className="fade-in" style={{
                    background: "var(--bg-elevated)",
                    borderBottom: "1px solid var(--border)",
                    padding: "20px 24px",
                  }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                      <div>
                        <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>Matched Rules</p>
                        {ev.matchedRules.length === 0 ? (
                          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>No rules triggered</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {ev.matchedRules.map((r) => (
                              <code key={r} style={{ fontSize: "0.76rem", color: "var(--text-secondary)", fontFamily: "var(--font-geist-mono)" }}>
                                ● {r}
                              </code>
                            ))}
                          </div>
                        )}

                        <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px", marginTop: "16px" }}>Reasons</p>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {ev.reasons.map((r) => (
                            <li key={r} style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>• {r}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>Security Analysis</p>
                        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                          {ev.explanation}
                        </p>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "12px", fontFamily: "var(--font-geist-mono)" }}>
                          {new Date(ev.timestamp).toLocaleString()} · Agent: {ev.request.agentId}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
