import StockSearch from "./StockSearch";
import { useState } from "react";

const QUICK_PICKS = ["Reliance Industries","HDFC Bank","TCS","Infosys","Adani Ports","Banking","IT Sector"];

const PESTEL_COLORS = {
  Political:{bg:"#fee2e2",text:"#dc2626",border:"#fca5a5"},
  Economic:{bg:"#fef3c7",text:"#d97706",border:"#fcd34d"},
  Social:{bg:"#ede9fe",text:"#7c3aed",border:"#c4b5fd"},
  Technological:{bg:"#dbeafe",text:"#1d4ed8",border:"#93c5fd"},
  Environmental:{bg:"#dcfce7",text:"#16a34a",border:"#86efac"},
  Legal:{bg:"#ffe4e6",text:"#be123c",border:"#fda4af"}
};

const SENT = {
  Bullish:{c:"#16a34a",bg:"#dcfce7",i:"▲"},
  Bearish:{c:"#dc2626",bg:"#fee2e2",i:"▼"},
  Neutral:{c:"#6b7280",bg:"#f3f4f6",i:"◆"},
  Mixed:{c:"#d97706",bg:"#fef3c7",i:"◈"}
};

const SYSTEM_PROMPT = `You are an elite MBA-grade Indian Stock Market Intelligence Analyst.

STRICT RULES:
1. NEVER rephrase headlines. Return exact raw headlines from sources.
2. Always provide direct source URLs.
3. If no news in last 48 hours: state "No market-moving events in the last 48 hours"
4. Differentiate between Rumour/Speculation and Official Regulatory Filing.
5. Prioritize: Moneycontrol, Economic Times, Livemint, Business Standard, NDTV Profit.
6. Use PESTEL to tag indirect news.
7. Classify each item as SIGNAL (earnings, policy, filings) or NOISE (opinions).

Return ONLY valid JSON, absolutely no markdown, no backticks, no extra text:
{
  "query": "company or sector name",
  "direct_news": [
    {
      "headline": "exact headline from source",
      "source": "publication name",
      "url": "direct article URL",
      "date": "publication date",
      "category": "Earnings | Management | Dividend | Acquisition | Regulatory Filing | Debt | Contracts | Other",
      "classification": "SIGNAL | NOISE",
      "filing_type": "Official Filing | Rumour/Speculation | News Report",
      "sentiment": "Bullish | Bearish | Neutral"
    }
  ],
  "indirect_news": [
    {
      "headline": "exact headline from source",
      "source": "publication name",
      "url": "direct article URL",
      "date": "publication date",
      "pestel_tag": "Political | Economic | Social | Technological | Environmental | Legal",
      "relevance": "one-line reason why this affects the queried company/sector",
      "classification": "SIGNAL | NOISE",
      "sentiment": "Bullish | Bearish | Neutral"
    }
  ],
  "market_impact": {
    "overall_sentiment": "Bullish | Bearish | Mixed | Neutral",
    "sentiment_score": 0,
    "fundamental_factors": ["factor 1", "factor 2"],
    "sentiment_factors": ["factor 1", "factor 2"],
    "key_risks": ["risk 1", "risk 2"],
    "key_catalysts": ["catalyst 1", "catalyst 2"],
    "analyst_note": "one sentence MBA-grade synthesis"
  }
}`;

function Tag({label, color, bg, border}) {
  return (
    <span style={{
      background: bg, color,
      border: `1px solid ${border || color}`,
      borderRadius: "4px", padding: "2px 8px",
      fontSize: "10px", fontWeight: "600",
      whiteSpace: "nowrap", display: "inline-block"
    }}>{label}</span>
  );
}

function NewsRow({item, type}) {
  const s = SENT[item.sentiment] || SENT.Neutral;
  const isSignal = item.classification === "SIGNAL";
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb",
      borderRadius: "8px", padding: "14px 16px", marginBottom: "8px",
      borderLeft: `3px solid ${isSignal ? "#387ed1" : "#d1d5db"}`
    }}>
      <div style={{display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"8px", alignItems:"center"}}>
        <Tag label={isSignal?"⚡ Signal":"~ Noise"} color={isSignal?"#1d4ed8":"#6b7280"} bg={isSignal?"#eff6ff":"#f9fafb"} border={isSignal?"#bfdbfe":"#e5e7eb"}/>
        {type==="direct" && item.category && <Tag label={item.category} color="#374151" bg="#f3f4f6" border="#e5e7eb"/>}
        {type==="indirect" && item.pestel_tag && (()=>{
          const pc = PESTEL_COLORS[item.pestel_tag]||{bg:"#f3f4f6",text:"#6b7280",border:"#e5e7eb"};
          return <Tag label={item.pestel_tag} color={pc.text} bg={pc.bg} border={pc.border}/>;
        })()}
        {item.filing_type==="Official Filing" && <Tag label="✓ Official Filing" color="#16a34a" bg="#dcfce7" border="#86efac"/>}
        {item.filing_type==="Rumour/Speculation" && <Tag label="⚠ Rumour" color="#d97706" bg="#fef3c7" border="#fcd34d"/>}
        <span style={{background:s.bg,color:s.c,fontSize:"10px",fontWeight:"600",padding:"2px 8px",borderRadius:"4px"}}>{s.i} {item.sentiment}</span>
        <span style={{color:"#9ca3af",fontSize:"11px",marginLeft:"auto"}}>{item.date}</span>
      </div>
      <div style={{fontSize:"13px",lineHeight:"1.6",color:"#111827",marginBottom:"8px",fontWeight:"500"}}>{item.headline}</div>
{item.ai_summary && (
  <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:"4px",padding:"6px 10px",fontSize:"11px",color:"#166534",marginBottom:"8px"}}>
    🤖 {item.ai_summary}
    {item.confidence && (
      <span style={{marginLeft:"8px",background:"#dcfce7",padding:"1px 6px",borderRadius:"3px",fontSize:"10px",fontWeight:"600"}}>
        {Math.round(item.confidence * 100)}% confidence
      </span>
    )}
  </div>
)}
      {type==="indirect" && item.relevance && (
        <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"4px",padding:"6px 10px",fontSize:"11px",color:"#64748b",marginBottom:"8px"}}>
          ↳ {item.relevance}
        </div>
      )}
      <div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
        <span style={{background:"#f3f4f6",color:"#374151",fontSize:"10px",fontWeight:"600",padding:"2px 8px",borderRadius:"4px",textTransform:"uppercase",letterSpacing:"0.05em"}}>{item.source}</span>
        {item.url && item.url !== "#"
          ? <a href={item.url} target="_blank" rel="noopener noreferrer" style={{color:"#387ed1",fontSize:"11px",textDecoration:"none",wordBreak:"break-all"}}>
              ↗ {item.url.length>65?item.url.slice(0,65)+"…":item.url}
            </a>
          : <span style={{color:"#9ca3af",fontSize:"11px"}}>URL unavailable</span>
        }
      </div>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [followUpResult, setFollowUpResult] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);

  const analyzeSentiment = async (headline) => {
  try {
    const res = await fetch("http://localhost:8001/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: Date.now().toString(), headline })
    });
    return await res.json();
  } catch (e) {
    return null;
  }
};
  const callGemini = async (prompt, systemPrompt) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }]
        })
      }
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  };

  const run = async (q) => {
    if (!q.trim()) return;
    setLoading(true); setError(""); setResult(null); setFollowUpResult(""); setFollowUp("");
    try {
      const raw = await callGemini(
        `Run full Indian stock market analysis for: "${q}". Search for news from last 48 hours. Return ONLY the JSON object, no markdown.`,
        SYSTEM_PROMPT
      );
      const clean = raw.replace(/```json|```/g,"").trim();
      const s = clean.indexOf("{"), e = clean.lastIndexOf("}");
      if (s===-1||e===-1) throw new Error("Could not parse response. Try again.");
      const parsed = JSON.parse(clean.slice(s,e+1));

// Auto-tag each direct news article with Python sentiment
if (parsed.direct_news?.length > 0) {
  const tagged = await Promise.all(
    parsed.direct_news.map(async (article) => {
      const sentiment = await analyzeSentiment(article.headline);
      if (sentiment) {
        return {
          ...article,
          sentiment: sentiment.sentiment,
          classification: sentiment.classification,
          keywords: sentiment.keywords,
          ai_summary: sentiment.summary,
          confidence: sentiment.confidence
        };
      }
      return article;
    })
  );
  parsed.direct_news = tagged;
}

setResult(parsed);
    } catch(err) {
      setError("Scan failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const runFollowUp = async () => {
    if (!followUp.trim() || !result) return;
    setFollowUpLoading(true); setFollowUpResult("");
    try {
      const text = await callGemini(
        followUp,
        `You are an MBA-grade Indian market analyst. Give precise quantitative answers about "${result?.query}". Include P/E, debt/equity, earnings, institutional holdings where relevant. Be concise and cite sources.`
      );
      setFollowUpResult(text);
    } catch(err) {
      setFollowUpResult("Error: " + err.message);
    } finally {
      setFollowUpLoading(false);
    }
  };

  const imp = result?.market_impact;
  const sc = SENT[imp?.overall_sentiment] || SENT.Neutral;
  const score = imp?.sentiment_score || 0;
  const scoreColor = score>20?"#16a34a":score<-20?"#dc2626":"#d97706";

  return (
    <div style={{minHeight:"100vh",background:"#f9fafb",color:"#111827",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",fontSize:"14px"}}>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        input::placeholder { color:#9ca3af; }
        input:focus { outline:none; border-color:#387ed1 !important; box-shadow:0 0 0 3px rgba(56,126,209,0.1); }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      {/* Navbar */}
      <div style={{background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"0 20px",display:"flex",alignItems:"center",height:"52px",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{background:"#387ed1",color:"#fff",width:"28px",height:"28px",borderRadius:"6px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",fontWeight:"700"}}>₹</div>
          <div>
            <div style={{fontSize:"13px",fontWeight:"700",color:"#111827",lineHeight:"1.2"}}>Kite Intelligence</div>
            <div style={{fontSize:"10px",color:"#9ca3af"}}>NSE · BSE · 48hr Live Scan</div>
          </div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:"6px",alignItems:"center"}}>
          {["ET","Mint","MC","BS"].map(s=>(
            <span key={s} style={{background:"#f3f4f6",color:"#6b7280",fontSize:"9px",fontWeight:"700",padding:"2px 6px",borderRadius:"3px"}}>{s}</span>
          ))}
          <span style={{display:"flex",alignItems:"center",gap:"4px",marginLeft:"8px"}}>
            <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"#16a34a",display:"inline-block",animation:"blink 2s infinite"}}/>
            <span style={{fontSize:"10px",color:"#16a34a",fontWeight:"600"}}>LIVE</span>
          </span>
        </div>
      </div>

      <div style={{maxWidth:"900px",margin:"0 auto",padding:"16px"}}>

        {/* Search */}
        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"10px",padding:"16px",marginBottom:"16px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
          <div style={{display:"flex",gap:"8px",marginBottom:"10px"}}>
            <StockSearch
              onSelect={(company) => {
                setQuery(company.name);
                run(company.name);
              }}
            />  
            <button onClick={()=>run(query)} disabled={loading||!query.trim()}
              style={{background:loading?"#e5e7eb":"#387ed1",color:loading?"#9ca3af":"#fff",border:"none",borderRadius:"6px",padding:"10px 20px",fontSize:"13px",fontWeight:"600",cursor:loading?"not-allowed":"pointer",whiteSpace:"nowrap"}}>
              {loading?"Scanning…":"Run Scan →"}
            </button>
          </div>
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:"11px",color:"#9ca3af",marginRight:"2px"}}>Quick:</span>
            {QUICK_PICKS.map(p=>(
              <button key={p} onClick={()=>{setQuery(p);run(p);}}
                style={{background:"#f3f4f6",border:"1px solid #e5e7eb",borderRadius:"5px",padding:"4px 10px",color:"#374151",fontSize:"11px",cursor:"pointer",fontWeight:"500"}}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{textAlign:"center",padding:"50px 0",background:"#fff",borderRadius:"10px",border:"1px solid #e5e7eb"}}>
            <div style={{width:"28px",height:"28px",borderRadius:"50%",border:"2px solid #e5e7eb",borderTop:"2px solid #387ed1",animation:"spin 0.7s linear infinite",margin:"0 auto 14px"}}/>
            <div style={{fontSize:"13px",color:"#374151",fontWeight:"500"}}>Scanning Indian market news…</div>
            <div style={{fontSize:"11px",color:"#9ca3af",marginTop:"4px"}}>PESTEL · Signal/Noise · 48hr window</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"8px",padding:"12px 16px",color:"#dc2626",fontSize:"13px",marginBottom:"12px"}}>
            ⚠ {error}
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div style={{animation:"fadeIn 0.3s ease"}}>

            {/* Summary */}
            <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"10px",padding:"14px 16px",marginBottom:"12px",display:"flex",gap:"12px",alignItems:"center",flexWrap:"wrap",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <div>
                <div style={{fontSize:"11px",color:"#9ca3af",marginBottom:"2px"}}>ACTIVE SCAN</div>
                <div style={{fontSize:"18px",fontWeight:"700",color:"#111827"}}>{result.query}</div>
              </div>
              <div style={{marginLeft:"auto",display:"flex",gap:"16px"}}>
                {[
                  {v:(result.direct_news||[]).length,l:"Direct News",c:"#387ed1"},
                  {v:(result.indirect_news||[]).length,l:"Indirect",c:"#7c3aed"},
                  {v:`${sc.i} ${imp?.overall_sentiment}`,l:"Sentiment",c:sc.c}
                ].map(({v,l,c})=>(
                  <div key={l} style={{textAlign:"center"}}>
                    <div style={{fontSize:"16px",fontWeight:"700",color:c}}>{v}</div>
                    <div style={{fontSize:"10px",color:"#9ca3af"}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section A */}
            <div style={{marginBottom:"16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
                <div style={{width:"3px",height:"16px",background:"#387ed1",borderRadius:"2px"}}/>
                <span style={{fontSize:"12px",fontWeight:"700",color:"#374151",textTransform:"uppercase",letterSpacing:"0.08em"}}>Section A — Direct News</span>
                <span style={{background:"#eff6ff",color:"#1d4ed8",border:"1px solid #bfdbfe",borderRadius:"10px",padding:"1px 8px",fontSize:"10px",fontWeight:"600"}}>{(result.direct_news||[]).length} items</span>
                <span style={{marginLeft:"auto",fontSize:"10px",color:"#9ca3af"}}>Earnings · Filings · Management</span>
              </div>
              {(result.direct_news||[]).length===0
                ?<div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"16px",color:"#9ca3af",fontSize:"13px"}}>No market-moving events in the last 48 hours</div>
                :(result.direct_news||[]).map((item,i)=><NewsRow key={i} item={item} type="direct"/>)
              }
            </div>

            {/* Section B */}
            <div style={{marginBottom:"16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
                <div style={{width:"3px",height:"16px",background:"#7c3aed",borderRadius:"2px"}}/>
                <span style={{fontSize:"12px",fontWeight:"700",color:"#374151",textTransform:"uppercase",letterSpacing:"0.08em"}}>Section B — Indirect News (PESTEL)</span>
                <span style={{background:"#ede9fe",color:"#7c3aed",border:"1px solid #c4b5fd",borderRadius:"10px",padding:"1px 8px",fontSize:"10px",fontWeight:"600"}}>{(result.indirect_news||[]).length} items</span>
              </div>
              <div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginBottom:"8px"}}>
                {Object.entries(PESTEL_COLORS).map(([tag,c])=><Tag key={tag} label={tag} color={c.text} bg={c.bg} border={c.border}/>)}
              </div>
              {(result.indirect_news||[]).length===0
                ?<div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"16px",color:"#9ca3af",fontSize:"13px"}}>No market-moving events in the last 48 hours</div>
                :(result.indirect_news||[]).map((item,i)=><NewsRow key={i} item={item} type="indirect"/>)
              }
            </div>

            {/* Section C */}
            {imp && (
              <div style={{marginBottom:"16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
                  <div style={{width:"3px",height:"16px",background:"#16a34a",borderRadius:"2px"}}/>
                  <span style={{fontSize:"12px",fontWeight:"700",color:"#374151",textTransform:"uppercase",letterSpacing:"0.08em"}}>Section C — Market Impact</span>
                </div>
                <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"10px",padding:"16px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                  <div style={{marginBottom:"14px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                      <span style={{fontSize:"11px",color:"#dc2626",fontWeight:"600"}}>◀ Bearish</span>
                      <span style={{fontSize:"12px",color:scoreColor,fontWeight:"700"}}>{score>0?"+":""}{score} / 100</span>
                      <span style={{fontSize:"11px",color:"#16a34a",fontWeight:"600"}}>Bullish ▶</span>
                    </div>
                    <div style={{height:"6px",background:"#f3f4f6",borderRadius:"3px",position:"relative"}}>
                      <div style={{position:"absolute",left:"50%",top:0,width:"1px",height:"6px",background:"#d1d5db"}}/>
                      <div style={{position:"absolute",top:0,height:"6px",borderRadius:"3px",background:scoreColor,left:score>=0?"50%":`${((score+100)/200)*100}%`,width:`${Math.abs(score)/2}%`,transition:"width 0.8s ease"}}/>
                    </div>
                  </div>
                  {imp.analyst_note && (
                    <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderLeft:"3px solid #16a34a",borderRadius:"0 6px 6px 0",padding:"10px 14px",marginBottom:"14px",fontSize:"13px",color:"#166534",fontStyle:"italic"}}>
                      "{imp.analyst_note}"
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                    {[
                      {title:"Fundamental Factors",items:imp.fundamental_factors,color:"#1d4ed8",bg:"#eff6ff",icon:"◉"},
                      {title:"Sentiment Drivers",items:imp.sentiment_factors,color:"#d97706",bg:"#fffbeb",icon:"◈"},
                      {title:"Key Risks",items:imp.key_risks,color:"#dc2626",bg:"#fef2f2",icon:"▼"},
                      {title:"Key Catalysts",items:imp.key_catalysts,color:"#16a34a",bg:"#f0fdf4",icon:"▲"}
                    ].map(({title,items,color,bg,icon})=>(
                      <div key={title} style={{background:bg,borderRadius:"8px",padding:"12px"}}>
                        <div style={{fontSize:"10px",fontWeight:"700",color,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"8px"}}>{icon} {title}</div>
                        {(items||[]).map((pt,i)=>(
                          <div key={i} style={{display:"flex",gap:"6px",marginBottom:"5px",alignItems:"flex-start"}}>
                            <span style={{color,fontSize:"10px",marginTop:"2px",flexShrink:0}}>—</span>
                            <span style={{fontSize:"12px",color:"#374151",lineHeight:"1.5"}}>{pt}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Follow-up */}
            <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"10px",padding:"14px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <div style={{fontSize:"11px",color:"#9ca3af",marginBottom:"8px",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.06em"}}>Drill Down — P/E · Debt/Equity · Institutional Holdings</div>
              <div style={{display:"flex",gap:"8px"}}>
                <input
                  value={followUp}
                  onChange={e=>setFollowUp(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&runFollowUp()}
                  placeholder={`e.g. "What is ${result.query}'s P/E ratio and debt/equity?"`}
                  style={{flex:1,border:"1px solid #e5e7eb",borderRadius:"6px",padding:"9px 12px",fontSize:"12px",color:"#111827",background:"#f9fafb"}}
                />
                <button onClick={runFollowUp} disabled={followUpLoading||!followUp.trim()}
                  style={{background:followUpLoading?"#f3f4f6":"#f0fdf4",border:`1px solid ${followUpLoading?"#e5e7eb":"#86efac"}`,borderRadius:"6px",padding:"9px 16px",color:followUpLoading?"#9ca3af":"#16a34a",fontSize:"12px",fontWeight:"600",cursor:followUpLoading?"not-allowed":"pointer"}}>
                  {followUpLoading?"…":"Drill →"}
                </button>
              </div>
              {followUpResult && (
                <div style={{marginTop:"12px",background:"#f0fdf4",border:"1px solid #bbf7d0",borderLeft:"3px solid #16a34a",borderRadius:"0 6px 6px 0",padding:"12px 14px",fontSize:"12px",color:"#166534",lineHeight:"1.7",whiteSpace:"pre-wrap"}}>
                  {followUpResult}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Empty State */}
        {!loading && !result && !error && (
          <div style={{textAlign:"center",padding:"60px 0",background:"#fff",borderRadius:"10px",border:"1px solid #e5e7eb"}}>
            <div style={{fontSize:"36px",color:"#e5e7eb",marginBottom:"10px"}}>₹</div>
            <div style={{fontSize:"14px",fontWeight:"600",color:"#374151"}}>Search a company or sector to begin</div>
            <div style={{fontSize:"12px",color:"#9ca3af",marginTop:"4px"}}>e.g. Reliance Industries, HDFC Bank, Banking Sector</div>
          </div>
        )}

      </div>
    </div>
  );
}
