import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { evaluateAction, EvaluationRequest } from "@/lib/security-engine";

export async function POST(req: NextRequest) {
  // Verify the user is authenticated via Clerk
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: Partial<EvaluationRequest>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid agent action payload" }, { status: 400 });
  }

  const { agentId, agentName, action, resource } = body;

  if (!agentId || !agentName || !action || !resource) {
    return NextResponse.json(
      { error: "Invalid agent action: missing agentId, agentName, action, or resource" },
      { status: 400 }
    );
  }

  try {
    const evaluationReq: EvaluationRequest = {
      agentId: String(agentId),
      agentName: String(agentName),
      userId,
      action: String(action),
      resource: String(resource),
    };

    const result = evaluateAction(evaluationReq);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Aegis evaluation unavailable" }, { status: 500 });
  }
}
