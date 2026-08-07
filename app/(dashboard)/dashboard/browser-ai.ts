"use client";

import type { InitProgressReport, MLCEngine } from "@mlc-ai/web-llm";

const modelId = "Qwen3.5-0.8B-q4f16_1-MLC";
let enginePromise: Promise<MLCEngine> | null = null;

export type BrowserAiProgress = {
  progress: number;
  text: string;
};

function supportsWebGpu() {
  return typeof window !== "undefined" && "gpu" in navigator;
}

export async function loadBrowserAi(onProgress: (progress: BrowserAiProgress) => void) {
  if (!supportsWebGpu()) throw new Error("webgpu_unavailable");

  if (!enginePromise) {
    enginePromise = import("@mlc-ai/web-llm")
      .then(({ CreateMLCEngine }) =>
        CreateMLCEngine(
          modelId,
          {
            initProgressCallback: (report: InitProgressReport) =>
              onProgress({ progress: Math.max(0, Math.min(1, report.progress)), text: report.text })
          },
          { context_window_size: 4096 }
        )
      )
      .catch((error) => {
        enginePromise = null;
        throw error;
      });
  }

  const engine = await enginePromise;
  engine.setInitProgressCallback((report) =>
    onProgress({ progress: Math.max(0, Math.min(1, report.progress)), text: report.text })
  );
  return engine;
}

type BrowserChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type SubscriptionContext = {
  provider_name: string;
  cost: number;
  currency: string;
  billing_cycle: string;
  next_billing_date: string | null;
  status: string;
};

export async function answerWithBrowserAi(
  messages: BrowserChatMessage[],
  subscriptions: SubscriptionContext[],
  onProgress: (progress: BrowserAiProgress) => void
) {
  const engine = await loadBrowserAi(onProgress);
  const context = subscriptions.slice(0, 30).map((subscription) => ({
    service: subscription.provider_name,
    cost: subscription.cost,
    currency: subscription.currency,
    cycle: subscription.billing_cycle,
    next_charge: subscription.next_billing_date,
    status: subscription.status
  }));

  const completion = await engine.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          `You are TengeGuard AI. Answer any general question in the same language as the user. Be concise, accurate and useful. For questions about the user's subscriptions, use only this local account data and never invent missing facts: ${JSON.stringify(context)}`
      },
      ...messages.slice(-10)
    ],
    temperature: 0.65,
    top_p: 0.9,
    max_tokens: 700
  });

  const content = completion.choices[0]?.message.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("empty_browser_ai_response");
  return content.trim();
}
