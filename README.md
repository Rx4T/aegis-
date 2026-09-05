# Aegis — AI Agent Security Firewall

A real-time security control layer between AI agents and the sensitive tools or actions they request to execute.

Built for **Clerk BuildStation: Nagpur**.

---

## Overview

Aegis intercepts and evaluates every action requested by an AI agent before execution:
1. **Authenticated User Identity** (via Clerk)
2. **Agent Identity & Role**
3. **Agent Scope & Permissions**
4. **Requested Action & Target Resource**
5. **Deterministic Security Policies**
6. **Dynamic Risk Scoring (0–100)**

The engine returns one of three verdicts:
- 🟢 **ALLOW** — Safe to execute within agent permissions
- 🟡 **REVIEW** — Requires human-in-the-loop authorization
- 🔴 **BLOCK** — Critical policy violation or exfiltration attempt

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Modern Dark Glassmorphic UI
- **Authentication**: Clerk
- **Deployment**: Vercel

---

## Author

- **Author**: Nayan Shelke ([@Rx4T](https://github.com/Rx4T))
