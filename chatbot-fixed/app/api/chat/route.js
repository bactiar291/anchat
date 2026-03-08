import { NextResponse } from "next/server";

export const maxDuration = 30;

// ─────────────────────────────────────────────────────────────
//  DAFTAR MODEL GRATIS GROQ — Updated Maret 2026
//  Tier 1 = paling longgar & cepat (diprioritaskan)
//  Tier 2 = kuat tapi lebih ketat
//  Tier 3 = reasoning/khusus, limit paling ketat
// ─────────────────────────────────────────────────────────────
const MODELS = [
  { id: "llama-3.1-8b-instant",          label: "Llama 3.1 · 8B Instant",   tier: 1 },
  { id: "llama3-8b-8192",                label: "Llama 3 · 8B",              tier: 1 },
  { id: "gemma2-9b-it",                  label: "Gemma 2 · 9B",              tier: 1 },
  { id: "llama-3.2-3b-preview",          label: "Llama 3.2 · 3B",            tier: 1 },
  { id: "llama-3.2-1b-preview",          label: "Llama 3.2 · 1B",            tier: 1 },
  { id: "llama-3.3-70b-versatile",       label: "Llama 3.3 · 70B",           tier: 2 },
  { id: "llama3-70b-8192",               label: "Llama 3 · 70B",             tier: 2 },
  { id: "llama-3.2-11b-vision-preview",  label: "Llama 3.2 · 11B Vision",    tier: 2 },
  { id: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 · 70B",         tier: 3 },
  { id: "qwen-qwq-32b",                  label: "Qwen QwQ · 32B",            tier: 3 },
  { id: "mistral-saba-24b",              label: "Mistral Saba · 24B",        tier: 3 },
  { id: "llama-3.1-70b-versatile",       label: "Llama 3.1 · 70B",           tier: 3 },
];

// ── Rotasi cerdas: reset ke Tier 1 setiap 10 menit
let modelIndex = 0;
let lastResetTime = Date.now();
const RESET_INTERVAL_MS = 10 * 60 * 1000;

function getStartIndex() {
  if (Date.now() - lastResetTime > RESET_INTERVAL_MS) {
    modelIndex = 0;
    lastResetTime = Date.now();
  }
  return modelIndex;
}

async function callGroq(apiKey, modelId, messages) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });
  return res;
}

function isRetryable(status, errMsg = "") {
  if (status === 429 || status === 503) return true;
  const lower = errMsg.toLowerCase();
  if (lower.includes("model") && (
    lower.includes("not found") ||
    lower.includes("deactivated") ||
    lower.includes("deprecated") ||
    lower.includes("overloaded")
  )) return true;
  return false;
}

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages tidak valid atau kosong." }, { status: 400 });
    }

    // ✅ FIX UTAMA: sanitasi role — "ai" → "assistant", buang field asing
    const validRoles = ["user", "assistant", "system"];
    const cleanMessages = messages
      .filter(m => m && typeof m.content === "string" && m.content.trim() !== "")
      .map(m => ({
        role: m.role === "ai" ? "assistant" : (validRoles.includes(m.role) ? m.role : "user"),
        content: m.content.trim(),
      }));

    if (cleanMessages.length === 0) {
      return NextResponse.json({ error: "Tidak ada pesan valid." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY belum dikonfigurasi.", noKey: true }, { status: 200 });
    }

    let lastError = null;
    const startIdx = getStartIndex();

    for (let attempt = 0; attempt < MODELS.length; attempt++) {
      const idx = (startIdx + attempt) % MODELS.length;
      const model = MODELS[idx];

      try {
        const res = await callGroq(apiKey, model.id, cleanMessages);
        const text = await res.text();

        let data;
        try { data = JSON.parse(text); } catch {
          lastError = `${model.label}: invalid JSON response`;
          continue;
        }

        if (!res.ok) {
          const errMsg = data?.error?.message || res.statusText || "unknown";
          if (isRetryable(res.status, errMsg)) {
            lastError = `${model.label} [${res.status}]: ${errMsg.substring(0, 100)}`;
            modelIndex = (idx + 1) % MODELS.length;
            continue;
          }
          return NextResponse.json({ error: errMsg }, { status: res.status });
        }

        // ✅ Sukses
        const content = data.choices?.[0]?.message?.content || "";
        modelIndex = idx;

        return NextResponse.json({
          content,
          model: model.label,
          modelId: model.id,
          tier: model.tier,
          attempts: attempt + 1,
        });

      } catch (err) {
        lastError = `${model.label}: ${err.message}`;
        continue;
      }
    }

    return NextResponse.json({
      error: `Semua ${MODELS.length} model sedang limit. Coba lagi dalam beberapa menit. Error terakhir: ${lastError}`,
      allLimited: true,
    }, { status: 503 });

  } catch (err) {
    return NextResponse.json({ error: `Server error: ${err.message}` }, { status: 500 });
  }
}

export async function GET() {
  const idx = getStartIndex();
  return NextResponse.json({
    currentModel: MODELS[idx],
    allModels: MODELS,
    totalModels: MODELS.length,
  });
}
