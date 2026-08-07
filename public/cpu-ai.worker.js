/* global self */

const modelId = "onnx-community/Qwen2.5-0.5B-Instruct";
const transformersPromise = import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/+esm");
let generatorPromise = null;

function loadGenerator(requestId) {
  if (!generatorPromise) {
    generatorPromise = transformersPromise
      .then(({ env, pipeline }) => {
        env.allowLocalModels = false;
        return pipeline("text-generation", modelId, {
          device: "wasm",
          dtype: "q4",
          progress_callback: (report) => {
            const rawProgress = typeof report.progress === "number" ? report.progress : 0;
            self.postMessage({
              type: "progress",
              requestId,
              progress: Math.max(0, Math.min(1, rawProgress > 1 ? rawProgress / 100 : rawProgress))
            });
          }
        });
      })
      .catch((error) => {
        generatorPromise = null;
        throw error;
      });
  }

  return generatorPromise;
}

function readAnswer(output) {
  const generated = output?.[0]?.generated_text;
  if (typeof generated === "string") return generated.trim();
  if (!Array.isArray(generated)) return "";
  const last = [...generated].reverse().find((message) => message?.role === "assistant");
  return typeof last?.content === "string" ? last.content.trim() : "";
}

self.addEventListener("message", async (event) => {
  const { requestId, messages } = event.data || {};
  if (!requestId || !Array.isArray(messages)) return;

  try {
    const generator = await loadGenerator(requestId);
    const output = await generator(messages, {
      max_new_tokens: 300,
      do_sample: false,
      repetition_penalty: 1.08
    });
    const answer = readAnswer(output);
    if (!answer) throw new Error("empty_cpu_ai_response");
    self.postMessage({ type: "complete", requestId, answer });
  } catch (error) {
    self.postMessage({
      type: "error",
      requestId,
      error: error instanceof Error ? error.message : "cpu_ai_failed"
    });
  }
});
