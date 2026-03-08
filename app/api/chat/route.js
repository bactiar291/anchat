import { NextResponse } from "next/server";

export const maxDuration = 30;

// Model gratis Groq — rotasi otomatis kalau salah satu limit
const MODELS = [
  { id: "llama-3.3-70b-versatile",  label: "Llama 3.3 · 70B" },
  { id: "llama-3.1-8b-instant",     label: "Llama 3.1 · 8B" },
  { id: "llama3-70b-8192",          label: "Llama 3 · 70B" },
  { id: "mixtral-8x7b-32768",       label: "Mixtral · 8x7B" },
  { id: "gemma2-9b-it",             label: "Gemma 2 · 9B" },
  { id: "llama3-8b-8192",           label: "Llama 3 · 8B" },
];

// State rotasi model (in-memory, reset saat cold start)
let modelIndex = 0;

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

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        error: "GROQ_API_KEY belum dikonfigurasi di Vercel Environment Variables.",
        noKey: true,
      }, { status: 200 });
    }

    // Coba setiap model mulai dari index saat ini, rotasi kalau rate limited
    let lastError = null;
    for (let attempt = 0; attempt < MODELS.length; attempt++) {
      const idx = (modelIndex + attempt) % MODELS.length;
      const model = MODELS[idx];

      try {
        const res = await callGroq(apiKey, model.id, messages);

        if (res.status === 429 || res.status === 503) {
          // Rate limited — coba model berikutnya
          lastError = `${model.label} rate limited`;
          continue;
        }

        if (!res.ok) {
          const err = await res.json();
          lastError = err.error?.message || res.statusText;
          continue;
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || "";

        // Update index ke model yang berhasil untuk request berikutnya
        modelIndex = idx;

        return NextResponse.json({
          content,
          model: model.label,
          modelId: model.id,
        });

      } catch (err) {
        lastError = err.message;
        continue;
      }
    }

    // Semua model gagal
    return NextResponse.json({
      error: `Semua model sedang limit: ${lastError}`,
      allLimited: true,
    }, { status: 503 });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Endpoint GET untuk cek model aktif saat ini
export async function GET() {
  return NextResponse.json({
    currentModel: MODELS[modelIndex],
    allModels: MODELS,
  });
}
