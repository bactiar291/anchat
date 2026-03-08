"use client";
import { useState, useRef, useEffect, useCallback } from "react";

// ── Welcome screen steps
const STATUS_STEPS = [
  "Menginisialisasi sistem...",
  "Memuat model AI...",
  "Menghubungkan ke Groq...",
  "Mengkonfigurasi antarmuka...",
  "Siap digunakan ✓",
];

function WelcomeScreen({ onDone }) {
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    // Ganti status tiap ~1.5 detik
    const timers = STATUS_STEPS.map((_, i) =>
      setTimeout(() => setStatusIdx(i), i * 1400)
    );
    // Fade out setelah 8 detik
    const done = setTimeout(() => onDone(), 8200);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, [onDone]);

  return (
    <div className="welcome-screen" id="welcomeScreen">
      <div className="welcome-orb" />
      <div className="welcome-badge">Testing Chatbot AI</div>
      <h1 className="welcome-title">
        Welcome
        <em>ANAM BACTIAR</em>
      </h1>
      <p className="welcome-subtitle">AI Powered by Groq · Free Models</p>
      <div className="welcome-dots">
        <span /><span /><span />
      </div>
      <div className="welcome-bar-wrap">
        <div className="welcome-bar-fill" />
      </div>
      <p className="welcome-status">{STATUS_STEPS[statusIdx]}</p>
    </div>
  );
}

// ── Format timestamp
function fmtTime(date) {
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// ── Send icon SVG
function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

// ── Moon/Sun icons
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

export default function Page() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [welFade, setWelFade] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState("Memuat...");
  const [currentTier, setCurrentTier] = useState(1);
  const [modelChanging, setModelChanging] = useState(false);
  const [modelChanged, setModelChanged] = useState(false);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Fetch model saat ini dari API
  useEffect(() => {
    fetch("/api/chat")
      .then(r => r.json())
      .then(d => {
        if (d.currentModel) {
          setCurrentModel(d.currentModel.label);
          setCurrentTier(d.currentModel.tier || 1);
        }
      })
      .catch(() => setCurrentModel("Llama 3.1 · 8B Instant"));
  }, []);

  // Scroll ke bawah saat ada pesan baru
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleWelcomeDone = useCallback(() => {
    setWelFade(true);
    setTimeout(() => setShowWelcome(false), 800);
  }, []);

  const toggleTheme = () => {
    setTheme(t => t === "dark" ? "light" : "dark");
  };

  const updateModel = (label, tier) => {
    if (label === currentModel) return;
    setModelChanging(true);
    setModelChanged(true);
    setTimeout(() => {
      setCurrentModel(label);
      if (tier) setCurrentTier(tier);
      setModelChanging(false);
    }, 200);
    setTimeout(() => setModelChanged(false), 700);
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = {
      role: "user",
      content: text,
      time: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // Build messages array untuk API
    // ✅ PENTING: role "ai" (UI internal) → "assistant" (standar OpenAI/Groq)
    const apiMessages = [...messages, userMsg]
      .filter(m => m.content && m.content.trim() !== "")
      .map(m => ({
        role: m.role === "ai" ? "assistant" : m.role,
        content: m.content.trim(),
      }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (data.noKey) {
        setMessages(prev => [...prev, {
          role: "ai",
          content: "⚠️ GROQ_API_KEY belum dikonfigurasi. Tambahkan di Vercel → Settings → Environment Variables.",
          time: new Date(),
          isError: true,
          model: "—",
        }]);
        return;
      }

      if (data.error) {
        setMessages(prev => [...prev, {
          role: "ai",
          content: `❌ ${data.error}`,
          time: new Date(),
          isError: true,
          model: currentModel,
        }]);
        return;
      }

      // Update model chip kalau berubah
      if (data.model) updateModel(data.model, data.tier);

      setMessages(prev => [...prev, {
        role: "ai",
        content: data.content,
        time: new Date(),
        model: data.model,
      }]);

    } catch (err) {
      setMessages(prev => [...prev, {
        role: "ai",
        content: "❌ Gagal terhubung ke server. Periksa koneksi internet.",
        time: new Date(),
        isError: true,
        model: "—",
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, currentModel]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextarea = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* WELCOME SCREEN */}
      {showWelcome && (
        <WelcomeScreen onDone={handleWelcomeDone} />
      )}
      {welFade && showWelcome && (
        <style>{`#welcomeScreen { animation: wFadeOut 0.8s ease forwards !important; }`}</style>
      )}

      {/* APP */}
      <div className={`app ${theme}`}>

        {/* HEADER */}
        <header className="header">
          <span className="logo">ANAM <span>BACTIAR</span></span>

          <div className="header-center">
              <span className="header-title">AI CHATBOT</span>
              <div className={`model-chip${modelChanging ? " changing" : ""}`}>
                <div className={`model-chip-dot tier-${currentTier}`} />
                <span className="model-chip-text">{currentModel}</span>
                <span className={`model-tier-badge tier-${currentTier}`}>T{currentTier}</span>
              </div>
            </div>

          <div className="header-right">
            <button className="clear-btn" onClick={clearChat}>Hapus Chat</button>
            <button className="theme-btn" onClick={toggleTheme} title="Ganti tema">
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </header>

        {/* CHAT AREA */}
        <div className="chat-area">
          <div className="chat-inner">

            {messages.length === 0 && !loading && (
              <div className="chat-welcome">
                <div className="chat-welcome-icon">🤖</div>
                <h2>Halo! Ada yang bisa saya bantu?</h2>
                <p>Tanyakan apa saja — saya siap menjawab dengan teknologi AI Groq.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`msg ${msg.role}`}>
                <div className="msg-avatar">
                  {msg.role === "user" ? "AB" : "AI"}
                </div>
                <div className="msg-content">
                  {msg.isError ? (
                    <div className="msg-error">{msg.content}</div>
                  ) : (
                    <div className="msg-bubble">{msg.content}</div>
                  )}
                  <div className="msg-meta">
                    {fmtTime(msg.time)}
                    {msg.role === "ai" && msg.model && ` · ${msg.model}`}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="msg ai">
                <div className="msg-avatar">AI</div>
                <div className="msg-content">
                  <div className="msg-bubble">
                    <div className="typing-bubble">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* INPUT AREA */}
        <div className="input-area">
          <div className="input-inner">
            <div className="input-top">
              <div className="input-model-label">
                <span>Model aktif:</span>
                <span className={`input-model-name${modelChanged ? " changed" : ""}`}>
                  {currentModel}
                </span>
              </div>
              <span className="input-chars">{input.length} karakter</span>
            </div>

            <div className="input-row">
              <textarea
                ref={textareaRef}
                className="input-box"
                placeholder="Ketik pesan... (Enter untuk kirim, Shift+Enter untuk baris baru)"
                value={input}
                onChange={handleTextarea}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={loading}
              />
              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                title="Kirim pesan"
              >
                <SendIcon />
              </button>
            </div>

            <p className="input-hint">
              Powered by Groq Free API · Rotasi model otomatis saat limit
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
