import { NextResponse } from "next/server";
import { getUserIdFromRequest, readRealGmailSubscriptions, readSyncReport } from "@/lib/server/subcut-gmail";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function cleanMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is ChatMessage => {
      if (!item || typeof item !== "object") return false;
      const message = item as Partial<ChatMessage>;
      return (message.role === "user" || message.role === "assistant") && typeof message.content === "string" && message.content.trim().length > 0;
    })
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 4000)
    }));
}

function extractResponseText(data: unknown) {
  if (!data || typeof data !== "object") return "";
  const response = data as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        text?: string;
        type?: string;
      }>;
    }>;
  };

  if (typeof response.output_text === "string") return response.output_text;

  return (
    response.output
      ?.flatMap((item) => item.content || [])
      .map((content) => content.text || "")
      .filter(Boolean)
      .join("\n") || ""
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "OPENAI_API_KEY не настроен. Добавьте ключ в .env.local и перезапустите dev-сервер."
      },
      { status: 503 }
    );
  }

  const userId = getUserIdFromRequest(request);
  const body = (await request.json().catch(() => ({}))) as { messages?: unknown };
  const messages = cleanMessages(body.messages);

  if (!messages.length) {
    return NextResponse.json({ ok: false, error: "Сообщение пустое." }, { status: 400 });
  }

  const subscriptions = userId ? await readRealGmailSubscriptions(userId).catch(() => []) : [];
  const report = userId ? await readSyncReport(userId).catch(() => null) : null;
  const subscriptionContext = subscriptions.slice(0, 30).map((item) => ({
    provider: item.provider_name,
    type: item.type,
    status: item.status,
    cost: item.cost,
    currency: item.currency,
    cycle: item.billing_cycle,
    next_billing_date: item.next_billing_date,
    trial_ends_at: item.trial_ends_at,
    confidence: Math.round(item.confidence * 100),
    evidence_count: item.evidence.length
  }));

  const input = [
    {
      role: "system",
      content:
        "You are TengeGuard AI, a concise Russian-first assistant for a subscription management startup. Answer clearly and practically. If asked about user's subscriptions, use only the provided real context and say when data is missing. Never invent subscriptions, prices, dates, bank data, or cancellations."
    },
    {
      role: "user",
      content: `Real TengeGuard context:\n${JSON.stringify(
        {
          sync_report: report,
          subscriptions: subscriptionContext
        },
        null,
        2
      )}`
    },
    ...messages
  ];

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input,
      max_output_tokens: 900
    })
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? ((data as { error?: { message?: string } }).error?.message || "OpenAI request failed")
        : "OpenAI request failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }

  const answer = extractResponseText(data).trim();
  return NextResponse.json({
    ok: true,
    answer: answer || "ИИ не вернул текстовый ответ. Попробуйте ещё раз.",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini"
  });
}
