"use client";
import { useState, useRef, useEffect, useCallback } from "react";

// ── Model defaults (di-update dari API)
const MODELS_DEFAULT = [
  { id: "llama-3.1-8b-instant",                      label: "Llama 3.1 · 8B",     tier: 1 },
  { id: "openai/gpt-oss-20b",                        label: "GPT OSS · 20B",       tier: 1 },
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout · 17B", tier: 1 },
  { id: "llama-3.3-70b-versatile",                   label: "Llama 3.3 · 70B",     tier: 2 },
  { id: "openai/gpt-oss-120b",                       label: "GPT OSS · 120B",      tier: 2 },
  { id: "qwen/qwen3-32b",                            label: "Qwen3 · 32B",         tier: 2 },
  { id: "moonshotai/kimi-k2-instruct-0905",          label: "Kimi K2 · MoE",       tier: 3 },
];
let MODELS = [...MODELS_DEFAULT];

const TIER_COLOR = { 1: "#22c55e", 2: "#eab308", 3: "#ef4444" };
const TIER_LABEL = { 1: "Cepat", 2: "Kuat", 3: "Pro" };

const STATUS_STEPS = [
  "Menginisialisasi sistem...", "Memuat model AI...",
  "Menghubungkan ke Groq...", "Mengkonfigurasi antarmuka...", "Siap digunakan ✓",
];

// ── Typewriter hook
function useTypewriter(text, speed = 8) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    setDisplayed(""); setDone(false);
    if (!text) { setDone(true); return; }
    let i = 0;
    ref.current = setInterval(() => {
      i++; setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(ref.current); setDone(true); }
    }, speed);
    return () => clearInterval(ref.current);
  }, [text, speed]);
  return { displayed, done };
}

// ── Welcome screen
function WelcomeScreen({ onDone }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = STATUS_STEPS.map((_, i) => setTimeout(() => setIdx(i), i * 1400));
    const d = setTimeout(onDone, 8000);
    return () => { t.forEach(clearTimeout); clearTimeout(d); };
  }, [onDone]);
  return (
    <div className="welcome-screen" id="welcomeScreen">
      <div className="welcome-orb" />
      <div className="welcome-badge">Testing Chatbot AI</div>
      <h1 className="welcome-title">Welcome<em>ANAM BACTIAR</em></h1>
      <p className="welcome-subtitle">AI Powered by Groq · Free Models</p>
      <div className="welcome-dots"><span /><span /><span /></div>
      <div className="welcome-bar-wrap"><div className="welcome-bar-fill" /></div>
      <p className="welcome-status">{STATUS_STEPS[idx]}</p>
    </div>
  );
}

function fmtTime(d) {
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// ── Icons
const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);
const ChevronIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ArtifactIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
  </svg>
);
const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const RefreshIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);

// ── Glitch thinking animation
function GlitchThinking() {
  return (
    <div className="glitch-thinking">
      <div className="glitch-bar">
        <div className="glitch-block b1" />
        <div className="glitch-block b2" />
        <div className="glitch-block b3" />
      </div>
      <span className="glitch-text" data-text="Memproses...">Memproses...</span>
    </div>
  );
}

// ── Parse konten AI: pisahkan teks biasa vs code block
function parseContent(content) {
  const parts = [];
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIdx = 0, match, blockIdx = 0;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIdx) parts.push({ type: "text", value: content.slice(lastIdx, match.index) });
    parts.push({ type: "code", lang: match[1] || "text", value: match[2].trimEnd(), idx: blockIdx++ });
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < content.length) parts.push({ type: "text", value: content.slice(lastIdx) });
  return parts;
}

// ── Message content renderer
function MessageContent({ content, onOpenArtifact }) {
  const [copied, setCopied] = useState({});
  const parts = parseContent(content);
  const hasCode = parts.some(p => p.type === "code");

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(p => ({ ...p, [idx]: true }));
      setTimeout(() => setCopied(p => ({ ...p, [idx]: false })), 2000);
    });
  };

  return (
    <div className="msg-content-body">
      {parts.map((p, i) => {
        if (p.type === "text") {
          return p.value.trim()
            ? <span key={i} className="msg-text">{p.value}</span>
            : null;
        }
        return (
          <div key={i} className="code-block-wrap">
            <div className="code-block-header">
              <span className="code-lang">{p.lang || "code"}</span>
              <div style={{ display: "flex", gap: 6 }}>
                {onOpenArtifact && (
                  <button className="code-action-btn artifact-btn"
                    onClick={() => onOpenArtifact({ lang: p.lang, code: p.value })}
                    title="Buka di Artefak">
                    <ArtifactIcon /> Artefak
                  </button>
                )}
                <button
                  className={`code-action-btn${copied[p.idx] ? " copied" : ""}`}
                  onClick={() => handleCopy(p.value, p.idx)}
                  title="Copy kode">
                  {copied[p.idx] ? <><CheckIcon /> Tersalin!</> : <><CopyIcon /> Copy</>}
                </button>
              </div>
            </div>
            <pre className="code-block"><code>{p.value}</code></pre>
          </div>
        );
      })}
    </div>
  );
}

// ── Bubble AI dengan typewriter
function AIBubble({ content, isError, onOpenArtifact }) {
  const { displayed, done } = useTypewriter(isError ? "" : content, 8);
  const text = isError ? content : displayed;
  if (isError) return <div className="msg-error">{text}</div>;
  return (
    <div className="msg-bubble">
      <MessageContent content={text} onOpenArtifact={done ? onOpenArtifact : null} />
      {!done && <span className="cursor-blink">▋</span>}
    </div>
  );
}

// ── Model selector dropdown
function ModelSelector({ selected, onSelect, disabled, models = MODELS_DEFAULT }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = models.find(m => m.id === selected) || null;

  useEffect(() => {
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="model-selector" ref={ref}>
      <button className={`model-sel-btn${open ? " open" : ""}`}
        onClick={() => !disabled && setOpen(o => !o)} disabled={disabled}>
        {active ? (
          <>
            <span className="sel-dot" style={{ background: TIER_COLOR[active.tier] }} />
            <span className="sel-label">{active.label}</span>
            <span className="sel-tier" style={{ color: TIER_COLOR[active.tier] }}>{TIER_LABEL[active.tier]}</span>
          </>
        ) : <span className="sel-label">🔄 Auto Rotasi</span>}
        <span className="sel-chevron"><ChevronIcon /></span>
      </button>

      {open && (
        <div className="model-dropdown">
          <div className="model-dropdown-header">Pilih Model</div>
          <button className={`model-opt${!selected ? " active" : ""}`}
            onClick={() => { onSelect(null); setOpen(false); }}>
            <span className="opt-dot" style={{ background: "#6b7280" }} />
            <span className="opt-info">
              <span className="opt-name">🔄 Auto Rotasi</span>
              <span className="opt-desc">Otomatis pilih model terbaik</span>
            </span>
          </button>
          {[1, 2, 3].map(tier => (
            <div key={tier}>
              <div className="model-tier-sep" style={{ color: TIER_COLOR[tier] }}>
                ● Tier {tier} — {TIER_LABEL[tier]}
              </div>
              {models.filter(m => m.tier === tier).map(m => (
                <button key={m.id} className={`model-opt${selected === m.id ? " active" : ""}`}
                  onClick={() => { onSelect(m.id); setOpen(false); }}>
                  <span className="opt-dot" style={{ background: TIER_COLOR[m.tier] }} />
                  <span className="opt-info">
                    <span className="opt-name">{m.label}</span>
                    <span className="opt-desc">{m.id}</span>
                  </span>
                  {selected === m.id && <span className="opt-check">✓</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Artifact side panel
function ArtifactPanel({ artifact, onClose, onRevise, loading }) {
  const [code, setCode] = useState(artifact?.code || "");
  const [lang, setLang] = useState(artifact?.lang || "");
  const [instruction, setInstruction] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCode(artifact?.code || "");
    setLang(artifact?.lang || "");
  }, [artifact]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRevise = () => {
    if (!instruction.trim()) return;
    onRevise({ code, lang, instruction });
    setInstruction("");
  };

  if (!artifact) return null;

  return (
    <div className="artifact-panel">
      <div className="artifact-header">
        <div className="artifact-title">
          <ArtifactIcon />
          <span>Artefak</span>
          <span className="artifact-lang-badge">{lang || "code"}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className={`artifact-action-btn${copied ? " copied" : ""}`} onClick={handleCopy}>
            {copied ? <><CheckIcon /> Tersalin</> : <><CopyIcon /> Copy</>}
          </button>
          <button className="artifact-action-btn close" onClick={onClose} title="Tutup">
            <CloseIcon />
          </button>
        </div>
      </div>

      <textarea
        className="artifact-editor"
        value={code}
        onChange={e => setCode(e.target.value)}
        spellCheck={false}
      />

      <div className="artifact-footer">
        <div className="artifact-revise-row">
          <input
            className="artifact-revise-input"
            placeholder="Minta revisi... (cth: tambahkan error handling)"
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleRevise(); } }}
            disabled={loading}
          />
          <button
            className="artifact-revise-btn"
            onClick={handleRevise}
            disabled={!instruction.trim() || loading}
            title="Revisi artefak">
            <RefreshIcon />
          </button>
        </div>
        <p className="artifact-hint">Edit langsung di atas · atau minta AI revisi</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════
export default function Page() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [welFade, setWelFade] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeModel, setActiveModel] = useState({ label: "Auto", tier: 1 });
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [modelList, setModelList] = useState(MODELS_DEFAULT);
  const [aiPhase, setAiPhase] = useState(null);

  // Edit message state
  const [editingIdx, setEditingIdx] = useState(null);
  const [editingText, setEditingText] = useState("");

  // Artifact state
  const [artifact, setArtifact] = useState(null);
  const [artifactOpen, setArtifactOpen] = useState(false);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    fetch("/api/chat")
      .then(r => r.json())
      .then(d => {
        if (d.currentModel) setActiveModel(d.currentModel);
        if (d.allModels?.length > 0) { MODELS = d.allModels; setModelList(d.allModels); }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiPhase]);

  const handleWelcomeDone = useCallback(() => {
    setWelFade(true);
    setTimeout(() => setShowWelcome(false), 800);
  }, []);

  // ── Kirim pesan ke API
  const sendToAPI = useCallback(async (msgHistory, forceModel = selectedModelId) => {
    setLoading(true);
    setAiPhase("thinking");

    const apiMessages = msgHistory
      .filter(m => m.content?.trim())
      .map(m => ({
        role: m.role === "ai" ? "assistant" : m.role,
        content: m.content.trim(),
      }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          ...(forceModel ? { forceModelId: forceModel } : {}),
        }),
      });
      const data = await res.json();
      setAiPhase(null);
      setLoading(false);

      if (data.noKey) {
        return { error: "⚠️ GROQ_API_KEY belum diset di Environment Variables." };
      }
      if (data.error) return { error: `❌ ${data.error}` };
      if (data.model) setActiveModel({ label: data.model, tier: data.tier || 1 });
      return { content: data.content, model: data.model, tier: data.tier };

    } catch (err) {
      setAiPhase(null);
      setLoading(false);
      return { error: "❌ Gagal terhubung ke server." };
    }
  }, [selectedModelId]);

  // ── Kirim pesan baru
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg = { role: "user", content: text, time: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const result = await sendToAPI(newMessages);
    setMessages(p => [...p, {
      role: "ai",
      content: result.error || result.content,
      time: new Date(),
      model: result.model,
      tier: result.tier,
      isError: !!result.error,
    }]);
  }, [input, loading, messages, sendToAPI]);

  // ── Edit & submit ulang pesan
  const submitEdit = useCallback(async (idx) => {
    const text = editingText.trim();
    if (!text) return;
    setEditingIdx(null);

    // Potong history sampai pesan yang diedit, replace isinya
    const trimmed = messages.slice(0, idx);
    const userMsg = { role: "user", content: text, time: new Date() };
    const newMessages = [...trimmed, userMsg];
    setMessages(newMessages);

    const result = await sendToAPI(newMessages);
    setMessages(p => [...p, {
      role: "ai",
      content: result.error || result.content,
      time: new Date(),
      model: result.model,
      tier: result.tier,
      isError: !!result.error,
    }]);
  }, [editingText, messages, sendToAPI]);

  // ── Revisi artefak
  const handleReviseArtifact = useCallback(async ({ code, lang, instruction }) => {
    if (loading) return;
    const reviseMsg = {
      role: "user",
      content: `Tolong revisi kode ${lang} berikut ini sesuai instruksi:\n\nInstruksi: ${instruction}\n\nKode saat ini:\n\`\`\`${lang}\n${code}\n\`\`\`\n\nHanya tampilkan kode yang sudah direvisi dalam code block, dengan penjelasan singkat.`,
      time: new Date(),
    };
    const newMessages = [...messages, reviseMsg];
    setMessages(newMessages);

    const result = await sendToAPI(newMessages);
    const aiMsg = {
      role: "ai",
      content: result.error || result.content,
      time: new Date(),
      model: result.model,
      tier: result.tier,
      isError: !!result.error,
    };
    setMessages(p => [...p, aiMsg]);

    // Update artefak dengan kode baru
    if (!result.error) {
      const parts = parseContent(result.content);
      const codeBlock = parts.find(p => p.type === "code");
      if (codeBlock) {
        setArtifact({ lang: codeBlock.lang, code: codeBlock.value });
      }
    }
  }, [loading, messages, sendToAPI]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };
  const handleTextarea = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  const openArtifact = (data) => { setArtifact(data); setArtifactOpen(true); };

  const displayModel = selectedModelId
    ? modelList.find(m => m.id === selectedModelId)?.label || activeModel.label
    : activeModel.label;
  const displayTier = selectedModelId
    ? modelList.find(m => m.id === selectedModelId)?.tier || activeModel.tier
    : (activeModel.tier || 1);

  return (
    <>
      {showWelcome && <WelcomeScreen onDone={handleWelcomeDone} />}
      {welFade && showWelcome && (
        <style>{`#welcomeScreen { animation: wFadeOut 0.8s ease forwards !important; }`}</style>
      )}

      <div className={`app ${theme}${artifactOpen ? " with-artifact" : ""}`}>

        {/* HEADER */}
        <header className="header">
          <span className="logo">ANAM <span>BACTIAR</span></span>
          <div className="header-center">
            <span className="header-title">AI CHATBOT</span>
            <div className="model-chip">
              <div className="model-chip-dot" style={{ background: TIER_COLOR[displayTier], boxShadow: `0 0 6px ${TIER_COLOR[displayTier]}` }} />
              <span className="model-chip-text">{displayModel}</span>
              <span className="model-tier-badge" style={{ color: TIER_COLOR[displayTier], borderColor: `${TIER_COLOR[displayTier]}44`, background: `${TIER_COLOR[displayTier]}18` }}>
                T{displayTier}
              </span>
            </div>
          </div>
          <div className="header-right">
            <button className="clear-btn" onClick={() => { setMessages([]); setArtifact(null); setArtifactOpen(false); }}>Hapus Chat</button>
            <button className="theme-btn" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </header>

        {/* LAYOUT: chat + artifact */}
        <div className="main-layout">

          {/* CHAT AREA */}
          <div className="chat-area">
            <div className="chat-inner">

              {messages.length === 0 && !aiPhase && (
                <div className="chat-welcome">
                  <div className="chat-welcome-icon">🤖</div>
                  <h2>Halo! Ada yang bisa saya bantu?</h2>
                  <p>Tanyakan apa saja — saya siap menjawab dengan teknologi AI Groq.</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`msg ${msg.role}`}>
                  <div className="msg-avatar">{msg.role === "user" ? "AB" : "AI"}</div>
                  <div className="msg-content">

                    {/* Edit mode untuk pesan user */}
                    {msg.role === "user" && editingIdx === i ? (
                      <div className="edit-wrap">
                        <textarea
                          className="edit-textarea"
                          value={editingText}
                          onChange={e => setEditingText(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitEdit(i); } }}
                          autoFocus
                        />
                        <div className="edit-actions">
                          <button className="edit-cancel" onClick={() => setEditingIdx(null)}>Batal</button>
                          <button className="edit-submit" onClick={() => submitEdit(i)}>Kirim Ulang ↵</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Bubble normal */}
                        {msg.role === "ai" && i === messages.length - 1 && !aiPhase ? (
                          <AIBubble content={msg.content} isError={msg.isError} onOpenArtifact={openArtifact} />
                        ) : msg.isError ? (
                          <div className="msg-error">{msg.content}</div>
                        ) : (
                          <div className="msg-bubble">
                            {msg.role === "ai"
                              ? <MessageContent content={msg.content} onOpenArtifact={openArtifact} />
                              : msg.content}
                          </div>
                        )}

                        {/* Tombol edit hover untuk pesan user */}
                        {msg.role === "user" && !loading && (
                          <button className="msg-edit-btn" title="Edit pesan"
                            onClick={() => { setEditingIdx(i); setEditingText(msg.content); }}>
                            <EditIcon /> Edit
                          </button>
                        )}
                      </>
                    )}

                    <div className="msg-meta">
                      {fmtTime(msg.time)}
                      {msg.role === "ai" && msg.model && ` · ${msg.model}`}
                    </div>
                  </div>
                </div>
              ))}

              {/* Glitch thinking */}
              {aiPhase === "thinking" && (
                <div className="msg ai">
                  <div className="msg-avatar">AI</div>
                  <div className="msg-content">
                    <div className="msg-bubble">
                      <GlitchThinking />
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* ARTIFACT PANEL */}
          {artifactOpen && (
            <ArtifactPanel
              artifact={artifact}
              onClose={() => setArtifactOpen(false)}
              onRevise={handleReviseArtifact}
              loading={loading}
            />
          )}
        </div>

        {/* INPUT */}
        <div className="input-area">
          <div className="input-inner">
            <div className="input-top">
              <ModelSelector selected={selectedModelId} onSelect={setSelectedModelId} disabled={loading} models={modelList} />
              <span className="input-chars">{input.length} karakter</span>
            </div>
            <div className="input-row">
              <textarea
                ref={textareaRef}
                className="input-box"
                placeholder="Ketik pesan... (Enter kirim · Shift+Enter baris baru)"
                value={input}
                onChange={handleTextarea}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={loading}
              />
              <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || loading}>
                <SendIcon />
              </button>
            </div>
            <p className="input-hint">
              Powered by Groq Free API · {selectedModelId ? "Model manual aktif" : "Rotasi otomatis saat limit"}
              {artifactOpen && " · 📐 Artefak aktif"}
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
