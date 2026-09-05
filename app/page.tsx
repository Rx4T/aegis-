import Link from "next/link";

export default function Home() {
  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", color: "var(--text-primary)" }}>
      {/* ── Navbar ── */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        height: "64px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-base)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ShieldIcon />
          <span style={{ fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
            Aegis
          </span>
          <span style={{
            fontSize: "0.65rem",
            fontWeight: 600,
            color: "var(--accent)",
            background: "var(--accent-dim)",
            border: "1px solid var(--accent)",
            padding: "1px 8px",
            borderRadius: "20px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>
            Beta
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/sign-in" className="btn-ghost" style={{ padding: "8px 18px", fontSize: "0.85rem" }}>
            Sign In
          </Link>
          <Link href="/sign-up" className="btn-primary" style={{ padding: "8px 18px", fontSize: "0.85rem" }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: "100px 40px 80px", maxWidth: "960px", margin: "0 auto", textAlign: "center" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "4px 14px",
          background: "var(--accent-dim)",
          border: "1px solid var(--accent)",
          borderRadius: "20px",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--accent)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: "32px",
        }}>
          <span className="status-dot pulse" />
          AI Agent Security Firewall
        </div>

        <h1 style={{
          fontSize: "clamp(2.4rem, 6vw, 4rem)",
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          marginBottom: "24px",
          color: "var(--text-primary)",
        }}>
          The Security Layer Your<br />
          <span style={{ color: "var(--accent)" }}>AI Agents Need</span>
        </h1>

        <p style={{
          fontSize: "1.15rem",
          color: "var(--text-secondary)",
          maxWidth: "600px",
          margin: "0 auto 40px",
          lineHeight: 1.7,
        }}>
          Aegis evaluates every action your AI agents want to take — checking identity, permissions,
          and risk — before anything executes. Real-time decisions: <strong style={{ color: "var(--accent)" }}>ALLOW</strong>,{" "}
          <strong style={{ color: "var(--warning)" }}>REVIEW</strong>, or{" "}
          <strong style={{ color: "var(--danger)" }}>BLOCK</strong>.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/sign-up" className="btn-primary" style={{ padding: "13px 28px", fontSize: "1rem" }}>
            Start Free →
          </Link>
          <Link href="/dashboard" className="btn-ghost" style={{ padding: "13px 28px", fontSize: "1rem" }}>
            View Dashboard
          </Link>
        </div>

        {/* Demo decision card */}
        <div style={{
          marginTop: "64px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "24px",
          textAlign: "left",
          maxWidth: "680px",
          marginLeft: "auto",
          marginRight: "auto",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "8px", fontFamily: "var(--font-geist-mono)" }}>
              aegis / evaluate
            </span>
          </div>
          <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.82rem", lineHeight: 2 }}>
            <div><span style={{ color: "var(--text-muted)" }}>agent:</span> <span style={{ color: "#e2e8f0" }}>Customer Support Agent</span></div>
            <div><span style={{ color: "var(--text-muted)" }}>action:</span> <span style={{ color: "#e2e8f0" }}>Read credentials and send externally</span></div>
            <div><span style={{ color: "var(--text-muted)" }}>resource:</span> <span style={{ color: "#e2e8f0" }}>.env</span></div>
            <div style={{ marginTop: "12px", height: "1px", background: "var(--border)" }} />
            <div style={{ marginTop: "12px" }}>
              <span style={{ color: "var(--text-muted)" }}>decision:</span>{" "}
              <span style={{ color: "var(--danger)", fontWeight: 700 }}>BLOCK</span>
              {"  "}
              <span style={{ color: "var(--text-muted)" }}>severity:</span>{" "}
              <span style={{ color: "var(--danger)", fontWeight: 700 }}>CRITICAL</span>
              {"  "}
              <span style={{ color: "var(--text-muted)" }}>risk:</span>{" "}
              <span style={{ color: "var(--danger)", fontWeight: 700 }}>98/100</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: "80px 40px", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: "0.75rem", fontWeight: 600, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
            How It Works
          </p>
          <h2 style={{ textAlign: "center", fontSize: "1.8rem", fontWeight: 700, marginBottom: "48px", letterSpacing: "-0.02em" }}>
            Every action. Evaluated.
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
            {[
              { step: "01", title: "Agent requests action", desc: "An AI agent attempts to call a tool or perform an operation." },
              { step: "02", title: "Aegis intercepts", desc: "The request is captured before execution and sent to the evaluation engine." },
              { step: "03", title: "Policy + risk evaluated", desc: "Identity, permissions, resource sensitivity, and action patterns are scored." },
              { step: "04", title: "Decision enforced", desc: "ALLOW executes, REVIEW queues for human approval, BLOCK terminates the request." },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "24px",
              }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-geist-mono)", marginBottom: "12px" }}>
                  {step}
                </div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "8px" }}>{title}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "80px 40px", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: "0.75rem", fontWeight: 600, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
            Core Capabilities
          </p>
          <h2 style={{ textAlign: "center", fontSize: "1.8rem", fontWeight: 700, marginBottom: "48px", letterSpacing: "-0.02em" }}>
            Built for production security
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            {[
              {
                icon: <LockIcon />,
                title: "Identity Verification",
                desc: "Every request is tied to a verified user and agent identity via Clerk. No anonymous actions.",
              },
              {
                icon: <PolicyIcon />,
                title: "Deterministic Policy Engine",
                desc: "Rules — not an AI model — make the security decision. Predictable, auditable, tamper-resistant.",
              },
              {
                icon: <RiskIcon />,
                title: "Risk Scoring",
                desc: "Every action receives a 0–100 risk score based on resource sensitivity, action type, and permission scope.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "28px",
              }}>
                <div style={{ color: "var(--accent)", marginBottom: "16px" }}>{icon}</div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "10px" }}>{title}</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "80px 40px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "16px", letterSpacing: "-0.02em" }}>
          Ready to secure your agents?
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "32px", fontSize: "1rem" }}>
          Start evaluating actions in minutes. No infrastructure required.
        </p>
        <Link href="/sign-up" className="btn-primary" style={{ padding: "14px 32px", fontSize: "1rem" }}>
          Get Started Free →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "24px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldIcon size={16} />
          <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Aegis</span>
        </div>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Built for Clerk BuildStation: Nagpur
        </span>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          © 2026 Aegis Security
        </span>
      </footer>
    </div>
  );
}

/* ── Inline SVG Icons ── */
function ShieldIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function PolicyIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function RiskIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
