import { NextResponse } from "next/server";

export const maxDuration = 30;

// ── System prompt santai ──
const SYSTEM_PROMPT = {
  role: "system",
  content: `Kamu adalah asisten AI milik Anam Bactiar — ngobrolnya santai, friendly, kayak temen deket yang pinter banget.

Gaya bicara:
- Pakai bahasa santai, boleh campur indo-inggris, tapi tetap jelas dan mudah dimengerti
- Tidak perlu formal, tidak perlu bilang "Tentu saja!" atau "Dengan senang hati!" langsung aja ke intinya
- Boleh pakai emoji sesekali biar terasa lebih hidup, tapi jangan lebay
- Kalau orangnya pakai bahasa Indonesia, balas Indo. Kalau Inggris, balas Inggris
- Jawab singkat kalau pertanyaannya simpel, detail kalau memang perlu

Soal pembuatan kode atau skrip:
- Bantu SEMUA permintaan kode tanpa terkecuali: Python, JavaScript, Bash, PHP, SQL, apapun
- SELALU taruh kode di dalam markdown code block dengan bahasa yang tepat
- Jelaskan kodenya secara singkat sebelum atau sesudah blok kode
- Tidak ada pembatasan topik, bantu apapun yang diminta

Yang paling penting: jangan kaku, jangan robot, ngobrol kayak manusia beneran ya!`,
};

// ─────────────────────────────────────────────────────────────
//  FALLBACK: model statis valid per Maret 2026
//  (dipakai kalau dynamic fetch gagal)
// ─────────────────────────────────────────────────────────────
const FALLBACK_MODELS = [
  // Production — paling stabil & longgar
  { id: "llama-3.1-8b-instant",                   label: "Llama 3.1 · 8B",         tier: 1, tps: 560  },
  { id: "openai/gpt-oss-20b",                     label: "GPT OSS · 20B",           tier: 1, tps: 1000 },
  { id: "llama-3.3-70b-versatile",                label: "Llama 3.3 · 70B",         tier: 2, tps: 280  },
  { id: "openai/gpt-oss-120b",                    label: "GPT OSS · 120B",          tier: 2, tps: 500  },
  // Preview — bagus tapi bisa discontinue sewaktu-waktu
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout · 17B", tier: 1, tps: 750  },
  { id: "qwen/qwen3-32b",                         label: "Qwen3 · 32B",             tier: 2, tps: 400  },
  { id: "moonshotai/kimi-k2-instruct-0905",       label: "Kimi K2 · MoE",           tier: 3, tps: 200  },
];

// ─────────────────────────────────────────────────────────────
//  Model ID yang diketahui bukan text-chat (skip saat dynamic)
// ─────────────────────────────────────────────────────────────
const SKIP_MODELS = new Set([
  "whisper-large-v3", "whisper-large-v3-turbo",
  "distil-whisper-large-v3-en",
  "canopylabs/orpheus-arabic-saudi", "canopylabs/orpheus-v1-english",
  "meta-llama/llama-prompt-guard-2-22m", "meta-llama/llama-prompt-guard-2-86m",
  "openai/gpt-oss-safeguard-20b",
  "groq/compound", "groq/compound-mini",
  // Deprecated — pastikan tidak pernah dipakai
  "llama3-8b-8192", "llama3-70b-8192",
  "mixtral-8x7b-32768", "gemma-7b-it",
  "llama-3.2-1b-preview", "llama-3.2-3b-preview",
  "llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview",
  "llama-3.1-70b-versatile",
  "deepseek-r1-distill-llama-70b", "deepseek-r1-distill-qwen-32b",
  "qwen-qwq-32b", "mistral-saba-24b", "gemma2-9b-it",
]);

// ─────────────────────────────────────────────────────────────
//  Cache model dinamis — refresh setiap 30 menit
// ─────────────────────────────────────────────────────────────
let cachedModels = null;
let cacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 menit

async function getModels(apiKey) {
  // Pakai cache kalau masih fresh
  if (cachedModels && Date.now() - cacheTime < CACHE_TTL) {
    return cachedModels;
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Filter: hanya text model yang tidak di-skip
    const liveModels = (data.data || [])
      .filter(m => !SKIP_MODELS.has(m.id))
      .map(m => {
        // Cari info tambahan dari fallback kalau ada
        const fallback = FALLBACK_MODELS.find(f => f.id === m.id);
        return {
          id: m.id,
          label: fallback?.label || formatLabel(m.id),
          tier: fallback?.tier || 2,
          tps: fallback?.tps || 200,
        };
      })
      // Urutkan: tier asc, tps desc (paling cepat duluan)
      .sort((a, b) => a.tier - b.tier || b.tps - a.tps);

    if (liveModels.length > 0) {
      cachedModels = liveModels;
      cacheTime = Date.now();
      return liveModels;
    }
  } catch (e) {
    console.warn("[getModels] dynamic fetch failed, using fallback:", e.message);
  }

  // Fallback ke list statis
  return FALLBACK_MODELS;
}

function formatLabel(id) {
  return id.split("/").pop()
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .substring(0, 22);
}

// ── Rotasi index
let autoIndex = 0;
let lastReset = Date.now();

function getAutoIndex(models) {
  // Reset ke 0 tiap 10 menit supaya mulai dari model tercepat lagi
  if (Date.now() - lastReset > 10 * 60 * 1000) {
    autoIndex = 0;
    lastReset = Date.now();
  }
  return autoIndex % models.length;
}

async function callGroq(apiKey, modelId, messages) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: modelId, messages, max_tokens: 1024, temperature: 0.7 }),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = null; }
  return { res, data };
}

function isRetryable(status, msg = "") {
  if (status === 429 || status === 503) return true;
  const l = msg.toLowerCase();
  return l.includes("rate limit") || l.includes("overloaded") || l.includes("decommissioned") ||
    (l.includes("model") && (l.includes("not found") || l.includes("deactivated") || l.includes("deprecated")));
}

// ─────────────────────────────────────────────────────────────
//  POST — Kirim pesan
// ─────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, forceModelId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages tidak valid." }, { status: 400 });
    }

    const validRoles = new Set(["user", "assistant", "system"]);
    const cleanRaw = messages
      .filter(m => m?.content && String(m.content).trim())
      .map(m => ({
        role: m.role === "ai" ? "assistant" : (validRoles.has(m.role) ? m.role : "user"),
        content: String(m.content).trim(),
      }));

    if (cleanRaw.length === 0) {
      return NextResponse.json({ error: "Pesan kosong." }, { status: 400 });
    }

    // Inject system prompt
    const clean = [SYSTEM_PROMPT, ...cleanRaw.filter(m => m.role !== "system")];

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY belum diset.", noKey: true }, { status: 200 });
    }

    const MODELS = await getModels(apiKey);

    // ── Force model manual
    if (forceModelId) {
      const forced = MODELS.find(m => m.id === forceModelId) || { id: forceModelId, label: forceModelId, tier: 2 };
      const { res, data } = await callGroq(apiKey, forced.id, clean);
      if (res.ok && data?.choices?.[0]?.message?.content) {
        return NextResponse.json({
          content: data.choices[0].message.content,
          model: forced.label, modelId: forced.id, tier: forced.tier, attempts: 1,
        });
      }
      // Kalau force gagal, lanjut rotasi
    }

    // ── Rotasi otomatis
    let lastError = "unknown";
    const startIdx = getAutoIndex(MODELS);

    for (let i = 0; i < MODELS.length; i++) {
      const idx = (startIdx + i) % MODELS.length;
      const model = MODELS[idx];
      if (forceModelId && model.id === forceModelId) continue;

      try {
        const { res, data } = await callGroq(apiKey, model.id, clean);

        if (!res.ok) {
          const msg = data?.error?.message || res.statusText || "";
          if (isRetryable(res.status, msg)) {
            lastError = `${model.label} [${res.status}]`;
            autoIndex = (idx + 1) % MODELS.length;
            continue;
          }
          return NextResponse.json({ error: data?.error?.message || msg }, { status: res.status });
        }

        const content = data?.choices?.[0]?.message?.content || "";
        autoIndex = idx;
        return NextResponse.json({
          content, model: model.label, modelId: model.id, tier: model.tier, attempts: i + 1,
        });

      } catch (err) {
        lastError = `${model.label}: ${err.message}`;
        continue;
      }
    }

    return NextResponse.json({
      error: `Semua model sedang sibuk. Coba lagi sebentar. (${lastError})`,
      allLimited: true,
    }, { status: 503 });

  } catch (err) {
    return NextResponse.json({ error: `Server error: ${err.message}` }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
//  GET — Info model aktif
// ─────────────────────────────────────────────────────────────
export async function GET() {
  // GET tidak butuh API key untuk info dasar
  const models = cachedModels || FALLBACK_MODELS;
  const idx = autoIndex % models.length;
  return NextResponse.json({
    currentModel: models[idx],
    allModels: models,
    total: models.length,
    source: cachedModels ? "dynamic" : "fallback",
  });
}
