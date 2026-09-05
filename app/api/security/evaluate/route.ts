import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { evaluateAction, EvaluationRequest } from "@/lib/security-engine";

export async function POST(req: NextRequest) {
  // Verify the user is authenticated
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<EvaluationRequest>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { agentId, agentName, action, resource } = body;

  if (!agentId || !agentName || !action || !resource) {
    return NextResponse.json(
      { error: "Missing required fields: agentId, agentName, action, resource" },
      { status: 400 }
    );
  }

  const evaluationReq: EvaluationRequest = {
    agentId: String(agentId),
    agentName: String(agentName),
    userId,
    action: String(action),
    resource: String(resource),
  };

  const result = evaluateAction(evaluationReq);
  return NextResponse.json(result);
}
