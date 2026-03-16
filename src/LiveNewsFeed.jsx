import { useState, useEffect, useRef, useCallback } from "react";

/* ============================================================
   LiveNewsFeed.jsx
   - Polls backend every 60 seconds for new articles
   - Prepends new articles without page flash
   - Floating "↑ N New Articles" button when scrolled down
   - Pulsing green live indicator
   - Pass your Gemini API key as prop: <LiveNewsFeed apiKey={...} />
   ============================================================ */

const NEWS_SOURCES = [
  { name: "ET Markets",    color: "#7c3aed", bg: "#f5f3ff" },
  { name: "Moneycontrol", color: "#dc2626", bg: "#fef2f2" },
  { name: "Bloomberg",    color: "#0f1f3d", bg: "#f1f5f9" },
  { name: "CNBC Awaaz",   color: "#1d4ed8", bg: "#eff6ff" },
  { name: "Finshots",     color: "#059669", bg: "#f0fdf4" },
  { name: "WION",         color: "#b45309", bg: "#fffbeb" },
  { name: "Livemint",     color: "#0369a1", bg: "#f0f9ff" },
  { name: "Bus. Standard",color: "#374151", bg: "#f9fafb" },
];

const IMPACT_STYLES = {
  Bullish: { c: "#059669", bg: "#f0fdf4", i: "▲" },
  Bearish: { c: "#dc2626", bg: "#fef2f2", i: "▼" },
  Neutral: { c: "#475569", bg: "#f8fafc", i: "◆" },
};

// ─── Gemini News Fetch ────────────────────────────────────────
const FEED_PROMPT = `You are a real-time Indian financial news aggregator.
Search for the latest Indian stock market news published in the LAST 30 MINUTES only.
Return ONLY a valid JSON array, no markdown, no backticks:
[
  {
    "id": "unique_string_based_on_headline",
    "headline": "exact headline from source",
    "source": "ET Markets|Moneycontrol|Bloomberg|CNBC Awaaz|Finshots|WION|Livemint|Bus. Standard",
    "time": "HH:MM AM/PM",
    "impact": "Bullish|Bearish|Neutral",
    "sector": "Banking|IT|Pharma|Auto|FMCG|Energy|Metals|Index|Defence|Market|other",
    "url": "direct article URL or empty string"
  }
]
Return 5-8 articles maximum. Only include news from last 30 minutes. If no new news, return empty array [].`;

async function fetchLatestNews(apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: FEED_PROMPT }] },
        contents: [{ parts: [{ text: `Fetch latest Indian stock market news as of ${new Date().toLocaleTimeString("en-IN")}. Return JSON array only.` }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.1 },
      }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  const clean = raw.replace(/```json|```/g, "").trim();
  const s = clean.indexOf("["), e = clean.lastIndexOf("]");
  if (s === -1 || e === -1) return [];
  return JSON.parse(clean.slice(s, e + 1));
}

// ─── Static seed articles shown on first load ─────────────────
const SEED_ARTICLES = [
  { id: "seed1",  source: "ET Markets",    time: "9:42 AM", headline: "RBI keeps repo rate unchanged at 6.5%, maintains accommodative stance",           impact: "Neutral", sector: "Banking",      url: "" },
  { id: "seed2",  source: "Moneycontrol",  time: "9:38 AM", headline: "Nifty opens flat amid global cues; IT stocks under pressure",                      impact: "Neutral", sector: "Index",        url: "" },
  { id: "seed3",  source: "Bloomberg",     time: "9:30 AM", headline: "India's manufacturing PMI hits 3-month high at 57.5",                               impact: "Bullish", sector: "Manufacturing",url: "" },
  { id: "seed4",  source: "CNBC Awaaz",    time: "9:25 AM", headline: "Reliance Industries Q3 net profit jumps 18% to ₹21,930 crore",                     impact: "Bullish", sector: "Energy",       url: "" },
  { id: "seed5",  source: "Finshots",      time: "9:10 AM", headline: "Why HDFC Bank's NIM compression is a short-term worry, not long-term",              impact: "Neutral", sector: "Banking",      url: "" },
  { id: "seed6",  source: "WION",          time: "9:05 AM", headline: "FIIs turn net buyers; pump ₹3,200 Cr into Indian equities",                         impact: "Bullish", sector: "Market",       url: "" },
  { id: "seed7",  source: "ET Markets",    time: "8:55 AM", headline: "TCS wins $1.5 Bn deal from European retail conglomerate",                           impact: "Bullish", sector: "IT",           url: "" },
  { id: "seed8",  source: "Bloomberg",     time: "8:40 AM", headline: "India eyes $500 Bn in defence exports by 2030; HAL, BEL in focus",                  impact: "Bullish", sector: "Defence",      url: "" },
  { id: "seed9",  source: "Moneycontrol",  time: "8:30 AM", headline: "Adani Ports secures new container terminal at Colombo Port",                        impact: "Bullish", sector: "Infrastructure",url: "" },
  { id: "seed10", source: "Finshots",      time: "8:15 AM", headline: "Zomato's quick commerce bet — is Blinkit finally turning profitable?",              impact: "Neutral", sector: "Consumer Tech", url: "" },
];

const FEED_CSS = `
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.85); }
  }
  @keyframes slide-down {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slide-up-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes toast-in {
    from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  .feed-item {
    padding: 10px 14px;
    border-bottom: 1px solid #f0ede6;
    cursor: pointer;
    transition: background 0.12s;
    animation: slide-up-in 0.25s ease;
  }
  .feed-item:hover { background: #faf9f6; }
  .feed-item.new-article {
    background: #fefce8;
    border-left: 2px solid #d97706;
    animation: slide-down 0.35s ease;
  }
  .feed-item.new-article:hover { background: #fef9c3; }
  .live-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #16a34a;
    animation: pulse-dot 1.8s ease-in-out infinite;
    box-shadow: 0 0 5px #16a34a;
    flex-shrink: 0;
  }
  .toast-btn {
    position: absolute;
    top: 56px;
    left: 50%;
    transform: translateX(-50%);
    background: #0f1f3d;
    color: #fff;
    border: none;
    border-radius: 20px;
    padding: 6px 16px;
    font-size: 11px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    z-index: 50;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(15,31,61,0.25);
    animation: toast-in 0.3s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background 0.15s, transform 0.15s;
  }
  .toast-btn:hover {
    background: #1e3a5f;
    transform: translateX(-50%) translateY(-1px);
  }
  .refresh-spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ─── Single Feed Item ─────────────────────────────────────────
function FeedItem({ item, isNew }) {
  const src  = NEWS_SOURCES.find(s => s.name === item.source) || { color: "#475569", bg: "#f9fafb" };
  const imp  = IMPACT_STYLES[item.impact] || IMPACT_STYLES.Neutral;

  return (
    <div className={`feed-item${isNew ? " new-article" : ""}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: src.color, background: src.bg, padding: "1px 6px", borderRadius: "3px", letterSpacing: "0.03em" }}>
            {item.source}
          </span>
          {isNew && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#b45309", background: "#fffbeb", padding: "1px 5px", borderRadius: "3px", border: "1px solid #fde68a" }}>
              NEW
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: imp.c, background: imp.bg, padding: "1px 5px", borderRadius: "3px" }}>
            {imp.i} {item.impact}
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#94a3b8" }}>
            {item.time}
          </span>
        </div>
      </div>

      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#0f1f3d", lineHeight: "1.5", fontWeight: "400", marginBottom: "4px" }}>
        {item.url
          ? <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }} onMouseEnter={e => e.target.style.color = "#2563eb"} onMouseLeave={e => e.target.style.color = "inherit"}>
              {item.headline}
            </a>
          : item.headline
        }
      </div>

      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#94a3b8", letterSpacing: "0.04em" }}>
        {item.sector}
        {item.url && <span style={{ marginLeft: "6px", color: "#2563eb" }}>↗ Read</span>}
      </div>
    </div>
  );
}

// ─── Main LiveNewsFeed Component ──────────────────────────────
export default function LiveNewsFeed({ apiKey }) {
  const [articles, setArticles]         = useState(SEED_ARTICLES);
  const [pendingArticles, setPending]   = useState([]);   // held while user is scrolled down
  const [newArticleIds, setNewIds]      = useState(new Set()); // track which are "new" for highlight
  const [isPolling, setIsPolling]       = useState(false);
  const [lastUpdated, setLastUpdated]   = useState(null);
  const [status, setStatus]             = useState("connected"); // connected | polling | error
  const [countdown, setCountdown]       = useState(60);
  const [seenIds, setSeenIds]           = useState(new Set(SEED_ARTICLES.map(a => a.id)));
  const [useAI, setUseAI]               = useState(false); // toggle AI polling on/off

  const feedRef      = useRef(null);
  const intervalRef  = useRef(null);
  const countdownRef = useRef(null);
  const isScrolledDown = useCallback(() => {
    if (!feedRef.current) return false;
    return feedRef.current.scrollTop > 80;
  }, []);

  // ── Poll for new articles ─────────────────────────────────
  const poll = useCallback(async () => {
    if (!apiKey || !useAI) return;
    setIsPolling(true);
    setStatus("polling");
    try {
      const fresh = await fetchLatestNews(apiKey);
      const truly_new = fresh.filter(a => !seenIds.has(a.id) && a.id);

      if (truly_new.length > 0) {
        const newIdSet = new Set([...seenIds, ...truly_new.map(a => a.id)]);
        setSeenIds(newIdSet);

        if (isScrolledDown()) {
          // User is reading — hold articles, show toast
          setPending(prev => [...truly_new, ...prev]);
        } else {
          // User is at top — prepend silently
          setArticles(prev => [...truly_new, ...prev]);
          setNewIds(new Set(truly_new.map(a => a.id)));
          // Clear "new" highlight after 8 seconds
          setTimeout(() => setNewIds(new Set()), 8000);
        }
        setLastUpdated(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
      }
      setStatus("connected");
    } catch (err) {
      console.error("Feed poll error:", err);
      setStatus("error");
    }
    setIsPolling(false);
    setCountdown(60);
  }, [apiKey, seenIds, isScrolledDown, useAI]);

  // ── Start polling interval ────────────────────────────────
  useEffect(() => {
    if (!useAI) { setCountdown(60); return; }

    // Immediate first fetch
    poll();

    // Poll every 60 seconds
    intervalRef.current = setInterval(poll, 60000);

    // Countdown timer (visual only)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => prev <= 1 ? 60 : prev - 1);
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, [useAI, poll]);

  // ── Flush pending articles (toast button clicked) ─────────
  const flushPending = useCallback(() => {
    setArticles(prev => [...pendingArticles, ...prev]);
    setNewIds(new Set(pendingArticles.map(a => a.id)));
    setPending([]);
    setTimeout(() => setNewIds(new Set()), 8000);
    // Scroll to top
    if (feedRef.current) {
      feedRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pendingArticles]);

  // ── Status indicator config ───────────────────────────────
  const statusConfig = {
    connected: { color: "#16a34a", label: "LIVE" },
    polling:   { color: "#d97706", label: "UPDATING" },
    error:     { color: "#dc2626", label: "RETRYING" },
  };
  const sc = statusConfig[status] || statusConfig.connected;

  return (
    <>
      <style>{FEED_CSS}</style>

      {/* ── Header ── */}
      <div style={{
        padding: "12px 14px",
        borderBottom: "1px solid #e2e0d8",
        position: "sticky", top: 0,
        background: "#fff", zIndex: 10,
      }}>
        {/* Title row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div className="live-dot" style={{ background: sc.color, boxShadow: `0 0 5px ${sc.color}` }} />
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "13px", fontWeight: "700", color: "#0f1f3d" }}>
              Live News Feed
            </span>
          </div>

          {/* AI Toggle */}
          <button
            onClick={() => setUseAI(p => !p)}
            style={{
              background: useAI ? "#0f1f3d" : "#f1f5f9",
              color: useAI ? "#fff" : "#475569",
              border: "1px solid",
              borderColor: useAI ? "#0f1f3d" : "#e2e8f0",
              borderRadius: "12px",
              padding: "3px 9px",
              fontSize: "10px",
              fontWeight: "600",
              cursor: "pointer",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.04em",
              display: "flex", alignItems: "center", gap: "4px",
              transition: "all 0.2s",
            }}
          >
            {useAI ? "🟢 AI ON" : "⚫ AI OFF"}
          </button>
        </div>

        {/* Status row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {NEWS_SOURCES.slice(0, 5).map(src => (
              <span key={src.name} style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: src.color, background: src.bg, padding: "1px 5px", borderRadius: "3px", letterSpacing: "0.03em" }}>
                {src.name}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
            {isPolling && (
              <div style={{ width: "10px", height: "10px", border: "1.5px solid #e2e8f0", borderTop: "1.5px solid #2563eb", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            )}
            {useAI && (
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#94a3b8" }}>
                next in {countdown}s
              </span>
            )}
          </div>
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#94a3b8", marginTop: "5px" }}>
            Last updated: {lastUpdated}
          </div>
        )}
      </div>

      {/* ── Feed body (scrollable) ── */}
      <div ref={feedRef} style={{ overflowY: "auto", flex: 1, position: "relative" }}>

        {/* ── Toast: New Articles Button ── */}
        {pendingArticles.length > 0 && (
          <button className="toast-btn" onClick={flushPending}>
            <span>↑</span>
            <span>{pendingArticles.length} New Article{pendingArticles.length > 1 ? "s" : ""}</span>
            <span style={{ opacity: 0.7 }}>·</span>
            <span style={{ opacity: 0.7 }}>Click to view</span>
          </button>
        )}

        {/* ── Articles list ── */}
        {articles.map((item) => (
          <FeedItem
            key={item.id}
            item={item}
            isNew={newArticleIds.has(item.id)}
          />
        ))}

        {/* ── Footer ── */}
        <div style={{ padding: "12px 14px", textAlign: "center" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#94a3b8", letterSpacing: "0.08em", marginBottom: "6px" }}>
            {useAI ? `AUTO-POLLING EVERY 60s · ${articles.length} ARTICLES LOADED` : "TOGGLE AI ON TO ENABLE AUTO-POLLING"}
          </div>
          {useAI && (
            <button
              onClick={poll}
              disabled={isPolling}
              style={{
                background: isPolling ? "#f1f5f9" : "#0f1f3d",
                color: isPolling ? "#94a3b8" : "#fff",
                border: "none", borderRadius: "5px",
                padding: "5px 12px", fontSize: "10px",
                fontFamily: "'DM Mono', monospace",
                cursor: isPolling ? "not-allowed" : "pointer",
                letterSpacing: "0.06em",
                display: "inline-flex", alignItems: "center", gap: "5px",
              }}
            >
              {isPolling ? (
                <><div style={{ width: "9px", height: "9px", border: "1.5px solid #e2e8f0", borderTop: "1.5px solid #2563eb", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> FETCHING…</>
              ) : "↻ FETCH NOW"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
