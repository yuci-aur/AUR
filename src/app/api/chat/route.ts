export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are the AUR Assistant for Asia University Rankings, an independent ranking platform.
Help visitors find universities, understand AUR metrics, compare institutions, and navigate the platform.
Be concise, specific, and use 2–4 sentences for simple questions. Never claim access to live private data.
If unsure about a score, direct the visitor to the relevant university profile.`;

const requestWindows = new Map<string, { count: number; resetAt: number }>();

function rateLimited(request: Request) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const current = requestWindows.get(key);
  if (!current || current.resetAt <= now) {
    requestWindows.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 20;
}

export async function POST(request: Request) {
  if (rateLimited(request)) {
    return Response.json({ detail: "Too many requests. Please wait a minute." }, { status: 429 });
  }

  const apiKey = process.env.CHAT_BOT_API_KEY;
  if (!apiKey) {
    return Response.json({ detail: "Chat service unavailable." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { message?: unknown } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 500) {
    return Response.json({ detail: "Enter a message of 500 characters or fewer." }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: message }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );
    const payload = (await response.json().catch(() => null)) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    } | null;
    const reply = payload?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!response.ok || !reply) {
      return Response.json({ detail: "Chat service unavailable." }, { status: 502 });
    }
    return Response.json({ reply });
  } catch {
    return Response.json({ detail: "Chat service unavailable." }, { status: 502 });
  }
}
