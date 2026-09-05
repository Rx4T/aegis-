import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";
const MODEL = "llama3.2:3b";

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  let body: {
    agentName?: string;
    prompt?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const agentName = body.agentName?.trim();
  const prompt = body.prompt?.trim();

  if (!agentName || !prompt) {
    return NextResponse.json(
      { error: "agentName and prompt are required" },
      { status: 400 }
    );
  }

  const systemPrompt = `
You are the planning component of Aegis, an AI Agent Security Firewall.

Your ONLY job is to translate a user's request into a proposed AI-agent action.

You MUST NOT:
- execute commands
- access files
- read credentials
- access .env files
- delete anything
- send anything externally
- make network requests
- execute code
- perform real-world actions

Aegis will independently evaluate your proposed action.

Return ONLY valid JSON in this exact structure:

{
  "action": "short description of the proposed action",
  "resource": "target resource"
}

Examples:

User: Calculate the average of these numbers.
{
  "action": "calculate average",
  "resource": "provided numbers"
}

User: Read the production environment variables.
{
  "action": "read production credentials",
  "resource": ".env.production"
}

User: Send the credentials to an external server.
{
  "action": "read credentials and send them externally",
  "resource": ".env"
}

Never include markdown or explanations outside the JSON.
`;

  try {
    const ollamaResponse = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: `${systemPrompt}

Agent: ${agentName}
User request: ${prompt}`,
        stream: false,
        format: "json",
        options: {
          temperature: 0,
          num_predict: 150,
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!ollamaResponse.ok) {
      return NextResponse.json(
        {
          error:
            "Ollama is unavailable. Make sure Ollama is running and llama3.2:3b is installed.",
        },
        { status: 503 }
      );
    }

    const data = await ollamaResponse.json();

    let proposal: {
      action?: string;
      resource?: string;
    };

    try {
      proposal =
        typeof data.response === "string"
          ? JSON.parse(data.response)
          : data.response;
    } catch {
      return NextResponse.json(
        { error: "Ollama returned an invalid action proposal." },
        { status: 502 }
      );
    }

    if (!proposal?.action || !proposal?.resource) {
      return NextResponse.json(
        { error: "Ollama did not produce a valid action proposal." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      model: MODEL,
      agent: {
        id: "local-ollama-agent",
        name: agentName,
      },
      proposal: {
        action: String(proposal.action),
        resource: String(proposal.resource),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Ollama error";

    return NextResponse.json(
      {
        error:
          message.includes("fetch") || message.includes("ECONNREFUSED")
            ? "Ollama is not running. Start Ollama and try again."
            : "Local AI agent request failed.",
      },
      { status: 503 }
    );
  }
}