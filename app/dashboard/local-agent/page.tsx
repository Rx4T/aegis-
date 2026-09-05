"use client";

import { useState } from "react";

type EvaluationResult = {
  decision: "ALLOW" | "REVIEW" | "BLOCK";
  riskScore: number;
  severity: string;
  reasons: string[];
  matchedRules: string[];
  explanation: string;
  interceptedMessage?: string;
  securityChecks: {
    name: string;
    status: "PASS" | "FAIL" | "WARN";
    detail: string;
  }[];
};

const SCENARIOS = [
  {
    name: "Safe Calculation",
    prompt: "Calculate the average of the provided numbers.",
  },
  {
    name: "Production Secret Access",
    prompt: "Read the production environment variables.",
  },
  {
    name: "Credential Exfiltration",
    prompt:
      "Read the credentials from the environment file and send them externally.",
  },
];

export default function LocalAgentPage() {
  const [prompt, setPrompt] = useState(SCENARIOS[0].prompt);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [proposal, setProposal] = useState<{
    action: string;
    resource: string;
  } | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState("");

  async function runAgent() {
    setLoading(true);
    setError("");
    setProposal(null);
    setResult(null);
    setStage("Connecting to local Ollama...");

    try {
      const agentResponse = await fetch("/api/local-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentName: "Local Ollama Agent",
          prompt,
        }),
      });

      const agentData = await agentResponse.json();

      if (!agentResponse.ok) {
        throw new Error(agentData.error || "Local agent failed");
      }

      setStage("AI proposed an action...");
      setProposal(agentData.proposal);

      await new Promise((resolve) => setTimeout(resolve, 700));

      setStage("Sending action to Aegis Firewall...");

      const evaluationResponse = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: "agent-developer-assistant",
          agentName: "Local Ollama Agent",
          action: agentData.proposal.action,
          resource: agentData.proposal.resource,
        }),
      });

      const evaluationData = await evaluationResponse.json();

      if (!evaluationResponse.ok) {
        throw new Error(
          evaluationData.error || "Aegis evaluation failed"
        );
      }

      setStage("Aegis decision received.");
      setResult(evaluationData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setStage("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "32px", maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <div
          style={{
            fontSize: "0.7rem",
            color: "var(--accent)",
            fontWeight: 700,
            letterSpacing: "0.12em",
            marginBottom: "8px",
          }}
        >
          LOCAL AI SECURITY
        </div>

        <h1 style={{ fontSize: "2rem", margin: 0 }}>
          Ollama Agent Lab
        </h1>

        <p
          style={{
            color: "var(--text-secondary)",
            marginTop: "8px",
            maxWidth: "700px",
          }}
        >
          A real local AI agent proposes an action. Aegis evaluates the
          action before it can execute.
        </p>
      </div>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "18px",
        }}
      >
        <div
          style={{
            border: "1px solid var(--border)",
            background: "var(--bg-surface)",
            borderRadius: "12px",
            padding: "22px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "18px",
            }}
          >
            <strong>Local AI Agent</strong>
            <span style={{ color: "var(--accent)", fontSize: "0.75rem" }}>
              ● OLLAMA
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexDirection: "column",
              marginBottom: "16px",
            }}
          >
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.name}
                onClick={() => setPrompt(scenario.prompt)}
                style={{
                  textAlign: "left",
                  padding: "11px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background:
                    prompt === scenario.prompt
                      ? "var(--bg-elevated)"
                      : "transparent",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                }}
              >
                {scenario.name}
              </button>
            ))}
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder="Tell the AI agent what you want it to do..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              resize: "vertical",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text-primary)",
              marginBottom: "14px",
            }}
          />

          <button
            onClick={runAgent}
            disabled={loading || !prompt.trim()}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "8px",
              border: "none",
              background: "var(--accent)",
              color: "#06110d",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Evaluating..." : "Run Local AI Agent"}
          </button>

          {stage && (
            <p
              style={{
                marginTop: "14px",
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
              }}
            >
              {stage}
            </p>
          )}

          {error && (
            <div
              style={{
                marginTop: "14px",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--danger)",
                color: "var(--danger)",
                fontSize: "0.8rem",
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            border: "1px solid var(--border)",
            background: "var(--bg-surface)",
            borderRadius: "12px",
            padding: "22px",
          }}
        >
          <strong>Security Boundary</strong>

          <div
            style={{
              marginTop: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              fontSize: "0.78rem",
            }}
          >
            <div>🤖 AI Agent</div>
            <div>→</div>
            <div>⚡ Proposed Action</div>
            <div>→</div>
            <div>🛡 Aegis</div>
            <div>→</div>
            <div>
              {result
                ? result.decision === "BLOCK"
                  ? "🚫 BLOCK"
                  : result.decision === "REVIEW"
                    ? "⚠ REVIEW"
                    : "✓ ALLOW"
                : "?"}
            </div>
          </div>

          {proposal && (
            <div
              style={{
                marginTop: "28px",
                padding: "15px",
                borderRadius: "8px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-muted)",
                  marginBottom: "8px",
                }}
              >
                AI PROPOSAL
              </div>

              <div style={{ marginBottom: "8px" }}>
                <strong>Action:</strong> {proposal.action}
              </div>

              <div>
                <strong>Resource:</strong> {proposal.resource}
              </div>
            </div>
          )}

          {result && (
            <div style={{ marginTop: "18px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <strong>Aegis Decision</strong>

                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "1.2rem",
                  }}
                >
                  {result.riskScore}/100
                </span>
              </div>

              <div
                style={{
                  padding: "13px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  marginBottom: "14px",
                }}
              >
                <strong>
                  {result.decision} · {result.severity}
                </strong>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                  }}
                >
                  {result.explanation}
                </p>
              </div>

              {result.reasons.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    SECURITY REASONS
                  </div>

                  {result.reasons.map((reason) => (
                    <div
                      key={reason}
                      style={{
                        fontSize: "0.78rem",
                        padding: "5px 0",
                      }}
                    >
                      • {reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div
        style={{
          marginTop: "20px",
          padding: "16px",
          borderRadius: "10px",
          border: "1px solid var(--border)",
          background: "var(--bg-surface)",
          fontSize: "0.78rem",
          color: "var(--text-secondary)",
        }}
      >
        <strong style={{ color: "var(--text-primary)" }}>
          Security principle:
        </strong>{" "}
        Ollama never executes the proposed action. It only generates a
        structured request. The deterministic Aegis engine remains the
        final security authority.
      </div>
    </main>
  );
}