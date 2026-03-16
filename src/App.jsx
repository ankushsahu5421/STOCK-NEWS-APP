import LiveNewsFeed from "./LiveNewsFeed";
import StockSearch from "./StockSearch";
import { useState, useEffect, useCallback, useRef } from "react";

/* ============================================================
   KITE INTELLIGENCE — Premium Light Theme
   
   COLOR PALETTE:
   --white:       #ffffff   (cards, modals)
   --bg:          #f5f5f0   (warm off-white page background)
   --bg2:         #f0efe9   (subtle section backgrounds)
   --navy:        #0f1f3d   (primary text, headings)
   --navy2:       #1e3a5f   (secondary navy)
   --slate:       #475569   (secondary text)
   --muted:       #94a3b8   (placeholder, tertiary text)
   --border:      #e2e0d8   (warm light gray border)
   --border2:     #d1cec4   (stronger border)
   --blue:        #2563eb   (primary action, links)
   --blue2:       #3b82f6   (lighter blue accent)
   --green:       #059669   (bullish, positive)
   --red:         #dc2626   (bearish, negative)
   --amber:       #d97706   (warnings, neutral signals)
   --gold:        #b45309   (premium accents)

   FONTS:
   Playfair Display — display headings
   DM Sans — body text, UI labels  
   DM Mono — numbers, tickers, data
   
   LAYOUT: Full 100vw, 3-column dashboard grid
   ============================================================ */

const QUICK_PICKS = ["Reliance Industries","HDFC Bank","TCS","Infosys","Adani Ports","Banking","IT Sector"];

const PESTEL_COLORS = {
  Political:{bg:"#fef2f2",text:"#b91c1c",border:"#fecaca"},
  Economic:{bg:"#fffbeb",text:"#b45309",border:"#fde68a"},
  Social:{bg:"#f5f3ff",text:"#6d28d9",border:"#ddd6fe"},
  Technological:{bg:"#eff6ff",text:"#1d4ed8",border:"#bfdbfe"},
  Environmental:{bg:"#f0fdf4",text:"#15803d",border:"#bbf7d0"},
  Legal:{bg:"#fff1f2",text:"#be123c",border:"#fda4af"}
};

const SENT = {
  Bullish:{c:"#059669",bg:"#f0fdf4",border:"#bbf7d0",i:"▲"},
  Bearish:{c:"#dc2626",bg:"#fef2f2",border:"#fecaca",i:"▼"},
  Neutral:{c:"#475569",bg:"#f8fafc",border:"#e2e8f0",i:"◆"},
  Mixed:{c:"#d97706",bg:"#fffbeb",border:"#fde68a",i:"◈"}
};

const NEWS_SOURCES = [
  {name:"CNBC Awaaz",color:"#1d4ed8",bg:"#eff6ff"},
  {name:"Bloomberg",color:"#0f1f3d",bg:"#f1f5f9"},
  {name:"Finshots",color:"#059669",bg:"#f0fdf4"},
  {name:"WION",color:"#b45309",bg:"#fffbeb"},
  {name:"ET Markets",color:"#7c3aed",bg:"#f5f3ff"},
  {name:"Moneycontrol",color:"#dc2626",bg:"#fef2f2"},
];

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@300;400;500&display=swap');
  :root {
    --white:   #ffffff;
    --bg:      #f5f5f0;
    --bg2:     #eeeee8;
    --navy:    #0f1f3d;
    --navy2:   #1e3a5f;
    --slate:   #475569;
    --muted:   #94a3b8;
    --border:  #e2e0d8;
    --border2: #cccac0;
    --blue:    #2563eb;
    --blue2:   #3b82f6;
    --green:   #059669;
    --red:     #dc2626;
    --amber:   #d97706;
    --gold:    #b45309;
    --display: 'Playfair Display', Georgia, serif;
    --sans:    'DM Sans', system-ui, sans-serif;
    --mono:    'DM Mono', 'Courier New', monospace;
  }
  * { box-sizing:border-box; margin:0; padding:0; }
  html { font-size:14px; }
  body { background:var(--bg); color:var(--navy); font-family:var(--sans); }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:var(--bg2); }
  ::-webkit-scrollbar-thumb { background:var(--border2); border-radius:2px; }
  input::placeholder { color:var(--muted); }
  input:focus { outline:none !important; }
  a { text-decoration:none; }

  @keyframes spin    { to { transform:rotate(360deg); } }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
  @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0.2} }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes countUp { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }

  .card {
    background:var(--white);
    border:1px solid var(--border);
    border-radius:10px;
    box-shadow:0 1px 3px rgba(15,31,61,0.04), 0 1px 2px rgba(15,31,61,0.03);
    transition:box-shadow 0.2s, border-color 0.2s;
  }
  .card:hover {
    box-shadow:0 4px 16px rgba(15,31,61,0.08);
    border-color:var(--border2);
  }
  .tag {
    display:inline-flex; align-items:center; gap:3px;
    padding:2px 7px; border-radius:4px;
    font-size:10px; font-weight:600;
    font-family:var(--mono); letter-spacing:0.03em;
    white-space:nowrap; border:1px solid;
  }
  .btn {
    border:none; border-radius:7px; cursor:pointer;
    font-family:var(--sans); font-weight:600;
    transition:all 0.15s; display:inline-flex;
    align-items:center; gap:6px;
  }
  .btn-primary {
    background:var(--navy);
    color:#fff;
    padding:10px 20px; font-size:13px;
  }
  .btn-primary:hover { background:var(--navy2); transform:translateY(-1px); box-shadow:0 4px 12px rgba(15,31,61,0.2); }
  .btn-primary:disabled { background:#cbd5e1; color:#94a3b8; transform:none; box-shadow:none; cursor:not-allowed; }
  .btn-ghost {
    background:transparent; color:var(--slate);
    border:1px solid var(--border); padding:6px 12px; font-size:12px;
  }
  .btn-ghost:hover { background:var(--bg2); border-color:var(--border2); color:var(--navy); }
  .btn-outline-blue {
    background:transparent; color:var(--blue);
    border:1px solid #bfdbfe; padding:5px 12px; font-size:11px;
  }
  .btn-outline-blue:hover { background:#eff6ff; }
  .section-label {
    font-family:var(--mono); font-size:10px; font-weight:500;
    color:var(--muted); letter-spacing:0.1em; text-transform:uppercase;
  }
  .metric-card {
    background:var(--bg);
    border:1px solid var(--border);
    border-radius:8px;
    padding:10px 12px;
  }
  .input-light {
    background:var(--white);
    border:1.5px solid var(--border2);
    border-radius:8px;
    padding:11px 14px;
    font-size:13px;
    color:var(--navy);
    font-family:var(--sans);
    transition:all 0.15s;
    width:100%;
  }
  .input-light:focus {
    border-color:var(--blue);
    box-shadow:0 0 0 3px rgba(37,99,235,0.08);
  }
  .news-card {
    background:var(--white);
    border:1px solid var(--border);
    border-radius:8px;
    padding:14px;
    margin-bottom:8px;
    transition:all 0.15s;
    border-left:3px solid transparent;
  }
  .news-card:hover {
    box-shadow:0 4px 12px rgba(15,31,61,0.06);
    border-left-color:var(--blue);
    transform:translateX(2px);
  }
  .news-card.signal { border-left-color:var(--amber); }
  .news-card.signal:hover { border-left-color:var(--gold); }
  .tab-btn {
    background:transparent; border:none; cursor:pointer;
    padding:7px 14px; border-radius:6px;
    font-family:var(--sans); font-size:13px;
    font-weight:500; color:var(--slate);
    transition:all 0.15s;
  }
  .tab-btn.active {
    background:var(--navy);
    color:#fff;
    font-weight:600;
  }
  .tab-btn:hover:not(.active) { background:var(--bg2); color:var(--navy); }
  .divider { height:1px; background:var(--border); margin:12px 0; }
  .sparkline-up { stroke:#059669; }
  .sparkline-down { stroke:#dc2626; }
`;

const SYSTEM_PROMPT = `You are an elite MBA-grade Indian Stock Market Intelligence Analyst.
STRICT RULES:
1. NEVER rephrase headlines. Return exact raw headlines.
2. Always provide direct source URLs.
3. If no news in last 48 hours: "No market-moving events in the last 48 hours"
4. Differentiate Rumour/Speculation vs Official Regulatory Filing.
5. Prioritize: Moneycontrol, Economic Times, Livemint, Business Standard, NDTV Profit.
6. Use PESTEL to tag indirect news.
7. Classify each item as SIGNAL or NOISE.
Return ONLY valid JSON, no markdown:
{"query":"","direct_news":[{"headline":"","source":"","url":"","date":"","category":"Earnings|Management|Dividend|Acquisition|Regulatory Filing|Debt|Contracts|Other","classification":"SIGNAL|NOISE","filing_type":"Official Filing|Rumour/Speculation|News Report","sentiment":"Bullish|Bearish|Neutral"}],"indirect_news":[{"headline":"","source":"","url":"","date":"","pestel_tag":"Political|Economic|Social|Technological|Environmental|Legal","relevance":"","classification":"SIGNAL|NOISE","sentiment":"Bullish|Bearish|Neutral"}],"market_impact":{"overall_sentiment":"Bullish|Bearish|Mixed|Neutral","sentiment_score":0,"fundamental_factors":[],"sentiment_factors":[],"key_risks":[],"key_catalysts":[],"analyst_note":""}}`;

// ─── Spinner ──────────────────────────────────────────────────
function Spinner({size=18,color="var(--blue)"}) {
  return <div style={{width:size,height:size,border:`2px solid #e2e8f0`,borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"spin 0.7s linear infinite",flexShrink:0}}/>;
}

// ─── SVG Sparkline ────────────────────────────────────────────
function Sparkline({data,width=120,height=40,up=true}) {
  if(!data||data.length<2) return null;
  const min=Math.min(...data),max=Math.max(...data);
  const range=max-min||1;
  const pts=data.map((v,i)=>{
    const x=(i/(data.length-1))*width;
    const y=height-((v-min)/range)*height;
    return `${x},${y}`;
  }).join(" ");
  const color=up?"#059669":"#dc2626";
  const fillId=`fill-${up?"up":"down"}`;
  return(
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} strokeLinecap="round" strokeLinejoin="round"/>
      <polygon fill={`url(#${fillId})`} points={`0,${height} ${pts} ${width},${height}`}/>
    </svg>
  );
}

// ─── LIVE TICKER BAR ─────────────────────────────────────────
function LiveTickerBar() {
  const [indices,setIndices]=useState([
    {name:"NIFTY 50",price:null,pct:null},
    {name:"SENSEX",price:null,pct:null},
    {name:"BANK NIFTY",price:null,pct:null},
    {name:"NIFTY IT",price:null,pct:null},
    {name:"INDIA VIX",price:null,pct:null},
  ]);
  const [updated,setUpdated]=useState(null);
  const fetchAll=useCallback(async()=>{
    const syms=["^NSEI","^BSESN","^NSEBANK","^CNXIT","^INDIAVIX"];
    const results=await Promise.all(syms.map(async s=>{
      try{
        const r=await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${s}?interval=1d&range=1d`)}`);
        const d=await r.json();const m=d?.chart?.result?.[0]?.meta;
        if(m?.regularMarketPrice){const p=m.regularMarketPrice,pr=m.previousClose||m.chartPreviousClose;return{price:p,pct:(p-pr)/pr*100};}
        return null;
      }catch{return null;}
    }));
    setIndices(prev=>prev.map((idx,i)=>results[i]?{...idx,...results[i]}:idx));
    setUpdated(new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}));
  },[]);
  useEffect(()=>{fetchAll();const t=setInterval(fetchAll,60000);return()=>clearInterval(t);},[fetchAll]);

  return(
    <div style={{background:"var(--navy)",color:"#fff",padding:"0 24px",display:"flex",alignItems:"center",height:"36px",overflowX:"auto",gap:0,borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
      <span style={{fontFamily:"var(--mono)",fontSize:"9px",color:"rgba(255,255,255,0.4)",marginRight:"20px",letterSpacing:"0.15em",flexShrink:0}}>LIVE MARKET</span>
      {indices.map(idx=>{
        const up=(idx.pct||0)>=0;
        return(
          <div key={idx.name} style={{display:"flex",alignItems:"center",gap:"10px",padding:"0 18px",borderRight:"1px solid rgba(255,255,255,0.08)",whiteSpace:"nowrap",flexShrink:0}}>
            <span style={{fontFamily:"var(--mono)",fontSize:"9px",color:"rgba(255,255,255,0.45)",letterSpacing:"0.05em"}}>{idx.name}</span>
            <span style={{fontFamily:"var(--mono)",fontSize:"12px",fontWeight:"500",color:"#fff"}}>{idx.price?idx.price.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}):"—"}</span>
            {idx.pct!==null&&<span style={{fontFamily:"var(--mono)",fontSize:"10px",fontWeight:"500",color:up?"#4ade80":"#f87171"}}>{up?"▲":"▼"}{Math.abs(idx.pct).toFixed(2)}%</span>}
          </div>
        );
      })}
      {updated&&<span style={{marginLeft:"auto",fontFamily:"var(--mono)",fontSize:"9px",color:"rgba(255,255,255,0.3)",whiteSpace:"nowrap",flexShrink:0,paddingLeft:"16px"}}>Updated {updated}</span>}
    </div>
  );
}

// ─── INDEX CHART CARD ─────────────────────────────────────────
function IndexChartCard({name,yahooSymbol}) {
  const [data,setData]=useState(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{
    (async()=>{
      try{
        const r=await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=5m&range=1d`)}`);
        const d=await r.json();
        const meta=d?.chart?.result?.[0]?.meta;
        const closes=d?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(Boolean)||[];
        if(meta&&closes.length>0){
          const price=meta.regularMarketPrice;
          const prev=meta.previousClose||meta.chartPreviousClose;
          const change=price-prev;const pct=(change/prev)*100;
          setData({price,prev,change,pct,closes,high:meta.regularMarketDayHigh,low:meta.regularMarketDayLow});
        }
      }catch{}
      setLoading(false);
    })();
  },[yahooSymbol]);

  const up=data?(data.pct>=0):true;
  const color=up?"var(--green)":"var(--red)";

  return(
    <div className="card" style={{padding:"16px",flex:1}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px"}}>
        <div>
          <div className="section-label" style={{marginBottom:"4px"}}>{name}</div>
          {loading?<div style={{height:"28px",width:"120px",background:"var(--bg2)",borderRadius:"4px",animation:"shimmer 1.5s infinite",backgroundSize:"200% 100%",backgroundImage:"linear-gradient(90deg,var(--bg2) 25%,var(--border) 50%,var(--bg2) 75%)"}}/>
          :<div style={{fontFamily:"var(--mono)",fontSize:"22px",fontWeight:"400",color:"var(--navy)",letterSpacing:"-0.02em"}}>
            {data?.price?.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})||"—"}
          </div>}
        </div>
        {data&&!loading&&(
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"var(--mono)",fontSize:"12px",fontWeight:"500",color,background:up?"var(--bg)":"#fef2f2",padding:"3px 8px",borderRadius:"5px",border:`1px solid ${up?"var(--border)":"#fecaca"}`}}>
              {up?"▲":"▼"} {Math.abs(data.pct).toFixed(2)}%
            </div>
            <div style={{fontFamily:"var(--mono)",fontSize:"10px",color:"var(--muted)",marginTop:"3px"}}>{up?"+":""}{data.change?.toFixed(2)}</div>
          </div>
        )}
      </div>
      {loading?<div style={{height:"60px",background:"var(--bg2)",borderRadius:"4px"}}/>
      :data&&<Sparkline data={data.closes.slice(-78)} width={280} height={60} up={up}/>}
      {data&&!loading&&(
        <div style={{display:"flex",gap:"12px",marginTop:"8px",paddingTop:"8px",borderTop:"1px solid var(--border)"}}>
          {[{l:"H",v:`₹${data.high?.toFixed(0)}`},{l:"L",v:`₹${data.low?.toFixed(0)}`},{l:"PC",v:`₹${data.prev?.toFixed(0)}`}].map(({l,v})=>(
            <div key={l}>
              <span style={{fontFamily:"var(--mono)",fontSize:"9px",color:"var(--muted)"}}>{l} </span>
              <span style={{fontFamily:"var(--mono)",fontSize:"10px",color:"var(--slate)",fontWeight:"500"}}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── FEAR & GREED ─────────────────────────────────────────────
function FearGreedGauge() {
  const [score,setScore]=useState(null);const [loading,setLoading]=useState(true);const [comp,setComp]=useState({});
  useEffect(()=>{
    (async()=>{
      setLoading(true);
      try{
        const[nr,vr]=await Promise.all([
          fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent("https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1d&range=30d")}`),
          fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent("https://query1.finance.yahoo.com/v8/finance/chart/%5EINDIAVIX?interval=1d&range=5d")}`)
        ]);
        const nd=await nr.json();const vd=await vr.json();
        const closes=nd?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(Boolean)||[];
        const vix=vd?.chart?.result?.[0]?.meta?.regularMarketPrice||15;
        const avg20=closes.slice(-20).reduce((a,b)=>a+b,0)/Math.min(closes.length,20);
        const cur=closes[closes.length-1]||avg20;
        const ms=Math.min(100,Math.max(0,50+((cur-avg20)/avg20)*500));
        const vs=Math.min(100,Math.max(0,100-(vix-10)*4));
        const l5=closes.slice(-5);
        const bs=(l5.filter((v,i)=>i>0&&v>l5[i-1]).length/4)*100;
        setScore(Math.round(0.4*ms+0.35*vs+0.25*bs));
        setComp({momentum:Math.round(ms),vix:Math.round(vs),breadth:Math.round(bs),vixVal:vix.toFixed(1)});
      }catch{setScore(50);}
      setLoading(false);
    })();
  },[]);

  const gi=s=>{
    if(s<20)return{l:"Extreme Fear",c:"#dc2626",light:"#fef2f2"};
    if(s<40)return{l:"Fear",c:"#ea580c",light:"#fff7ed"};
    if(s<60)return{l:"Neutral",c:"#d97706",light:"#fffbeb"};
    if(s<80)return{l:"Greed",c:"#16a34a",light:"#f0fdf4"};
    return{l:"Extreme Greed",c:"#059669",light:"#ecfdf5"};
  };
  const info=score!==null?gi(score):{l:"Loading",c:"var(--muted)",light:"var(--bg)"};
  const angle=score!==null?(score/100)*180-90:-90;

  return(
    <div className="card" style={{padding:"16px"}}>
      <div className="section-label" style={{marginBottom:"14px"}}>Fear & Greed Index</div>
      {loading?<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",gap:"8px"}}><Spinner/><span style={{fontSize:"12px",color:"var(--muted)"}}>Computing…</span></div>
      :<>
        <div style={{textAlign:"center",marginBottom:"8px"}}>
          <svg viewBox="0 0 200 110" width="164" height="90">
            <defs>
              <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#dc2626" stopOpacity="0.6"/>
                <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="#059669" stopOpacity="0.6"/>
              </linearGradient>
            </defs>
            <path d="M 20,100 A 80,80 0 0,1 180,100" fill="none" stroke="var(--border)" strokeWidth="16" strokeLinecap="round"/>
            <path d="M 20,100 A 80,80 0 0,1 180,100" fill="none" stroke="url(#arcGrad)" strokeWidth="16" strokeLinecap="round" opacity="0.35"/>
            <path d={`M 20,100 A 80,80 0 0,1 ${100+80*Math.cos((angle-90)*Math.PI/180)},${100+80*Math.sin((angle-90)*Math.PI/180)}`} fill="none" stroke={info.c} strokeWidth="16" strokeLinecap="round" opacity="0.9"/>
            <line x1="100" y1="100" x2={100+68*Math.cos((angle-90)*Math.PI/180)} y2={100+68*Math.sin((angle-90)*Math.PI/180)} stroke={info.c} strokeWidth="2" strokeLinecap="round"/>
            <circle cx="100" cy="100" r="5" fill="var(--white)" stroke={info.c} strokeWidth="2"/>
            <text x="16" y="116" fill="#dc2626" fontSize="8" fontFamily="monospace" opacity="0.7">Fear</text>
            <text x="148" y="116" fill="#059669" fontSize="8" fontFamily="monospace" opacity="0.7">Greed</text>
          </svg>
        </div>
        <div style={{textAlign:"center",marginBottom:"12px"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:"36px",fontWeight:"400",color:info.c,letterSpacing:"-0.02em",lineHeight:1,animation:"countUp 0.5s ease"}}>{score}</div>
          <div style={{display:"inline-block",background:info.light,color:info.c,border:`1px solid ${info.c}30`,borderRadius:"20px",padding:"3px 12px",fontFamily:"var(--mono)",fontSize:"10px",fontWeight:"500",letterSpacing:"0.08em",marginTop:"5px"}}>{info.l.toUpperCase()}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"5px"}}>
          {[{l:"Momentum",v:comp.momentum},{l:`VIX ${comp.vixVal}`,v:comp.vix},{l:"Breadth",v:comp.breadth}].map(({l,v})=>{
            const c=gi(v||0).c;
            return(<div key={l} style={{background:"var(--bg)",borderRadius:"5px",padding:"6px 7px",border:"1px solid var(--border)"}}>
              <div style={{fontFamily:"var(--mono)",fontSize:"9px",color:"var(--muted)",marginBottom:"4px",letterSpacing:"0.05em"}}>{l}</div>
              <div style={{height:"3px",background:"var(--border)",borderRadius:"2px",marginBottom:"3px"}}>
                <div style={{height:"3px",background:c,borderRadius:"2px",width:`${v||0}%`,transition:"width 1.2s ease"}}/>
              </div>
              <div style={{fontFamily:"var(--mono)",fontSize:"10px",fontWeight:"500",color:c}}>{v||0}</div>
            </div>);
          })}
        </div>
      </>}
    </div>
  );
}

// ─── SECTOR HEATMAP ───────────────────────────────────────────
function SectorHeatmap({apiKey}) {
  const [sectors,setSectors]=useState([]);const [loading,setLoading]=useState(false);const [loaded,setLoaded]=useState(false);
  const fetch_=async()=>{
    setLoading(true);
    try{
      const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:'Return ONLY a JSON array for Indian market sectors today: [{"sector":"Banking","score":number_-100_to_100,"reason":"short reason"}] for Banking,IT,Pharma,Auto,FMCG,Energy,Metals,Realty,Defence,Power'}]},contents:[{parts:[{text:"Analyze today's Indian stock market sector performance."}]}],tools:[{google_search:{}}],generationConfig:{temperature:0.1}})});
      const d=await r.json();const raw=d?.candidates?.[0]?.content?.parts?.[0]?.text||"[]";
      const clean=raw.replace(/```json|```/g,"").trim();const s=clean.indexOf("["),e=clean.lastIndexOf("]");
      setSectors(JSON.parse(clean.slice(s,e+1)));setLoaded(true);
    }catch(err){console.error(err);}
    setLoading(false);
  };
  const gc=s=>{
    if(s>40)return{c:"#15803d",bg:"#f0fdf4",border:"#bbf7d0"};
    if(s>10)return{c:"#16a34a",bg:"#f7fef9",border:"#d1fae5"};
    if(s>-10)return{c:"#64748b",bg:"#f8fafc",border:"#e2e8f0"};
    if(s>-40)return{c:"#c2410c",bg:"#fff7ed",border:"#fed7aa"};
    return{c:"#dc2626",bg:"#fef2f2",border:"#fecaca"};
  };
  return(
    <div className="card" style={{padding:"16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
        <div className="section-label">Sector Heatmap</div>
        <button className="btn btn-ghost" style={{padding:"4px 10px",fontSize:"10px",fontFamily:"var(--mono)",letterSpacing:"0.05em"}} onClick={fetch_} disabled={loading}>{loading?"SCANNING…":loaded?"↻ REFRESH":"LOAD MAP"}</button>
      </div>
      {!loaded&&!loading&&<div style={{textAlign:"center",padding:"24px",color:"var(--muted)",fontSize:"11px",fontFamily:"var(--mono)",background:"var(--bg)",borderRadius:"6px",border:"1px solid var(--border)"}}>Click LOAD MAP to scan today's sector sentiments</div>}
      {loading&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",gap:"8px"}}><Spinner/><span style={{fontSize:"11px",color:"var(--muted)"}}>Scanning with AI…</span></div>}
      {loaded&&sectors.length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px"}}>
        {sectors.map(sec=>{
          const c=gc(sec.score);
          return(
            <div key={sec.sector} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:"7px",padding:"8px 10px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"3px"}}>
                <span style={{fontFamily:"var(--sans)",fontSize:"11px",fontWeight:"600",color:"var(--navy)"}}>{sec.sector}</span>
                <span style={{fontFamily:"var(--mono)",fontSize:"10px",fontWeight:"500",color:c.c}}>{sec.score>0?"+":""}{sec.score}</span>
              </div>
              <div style={{height:"3px",background:"rgba(0,0,0,0.06)",borderRadius:"2px",marginBottom:"3px"}}>
                <div style={{height:"3px",background:c.c,borderRadius:"2px",width:`${Math.abs(sec.score)}%`,opacity:0.7}}/>
              </div>
              <div style={{fontFamily:"var(--sans)",fontSize:"10px",color:c.c,opacity:0.8,lineHeight:"1.3"}}>{sec.reason}</div>
            </div>
          );
        })}
      </div>}
    </div>
  );
}

// ─── NEWS ROW ─────────────────────────────────────────────────
function NewsRow({item,type}) {
  const s=SENT[item.sentiment]||SENT.Neutral;
  const isSignal=item.classification==="SIGNAL";
  const pc=type==="indirect"&&item.pestel_tag?PESTEL_COLORS[item.pestel_tag]||{bg:"#f8fafc",text:"#475569",border:"#e2e8f0"}:null;
  return(
    <div className={`news-card ${isSignal?"signal":""}`}>
      <div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginBottom:"7px",alignItems:"center"}}>
        {isSignal
          ?<span className="tag" style={{background:"#fffbeb",color:"#b45309",borderColor:"#fde68a"}}>⚡ SIGNAL</span>
          :<span className="tag" style={{background:"var(--bg)",color:"var(--muted)",borderColor:"var(--border)"}}>◌ NOISE</span>
        }
        {type==="direct"&&item.category&&<span className="tag" style={{background:"var(--bg)",color:"var(--slate)",borderColor:"var(--border)"}}>{item.category}</span>}
        {pc&&<span className="tag" style={{background:pc.bg,color:pc.text,borderColor:pc.border}}>{item.pestel_tag}</span>}
        {item.filing_type==="Official Filing"&&<span className="tag" style={{background:"#f0fdf4",color:"#15803d",borderColor:"#bbf7d0"}}>✓ Official</span>}
        {item.filing_type==="Rumour/Speculation"&&<span className="tag" style={{background:"#fffbeb",color:"#b45309",borderColor:"#fde68a"}}>⚠ Rumour</span>}
        <span className="tag" style={{background:s.bg,color:s.c,borderColor:s.border}}>{s.i} {item.sentiment}</span>
        <span style={{marginLeft:"auto",fontFamily:"var(--mono)",fontSize:"10px",color:"var(--muted)"}}>{item.date}</span>
      </div>
      <div style={{fontFamily:"var(--sans)",fontSize:"13px",lineHeight:"1.6",color:"var(--navy)",marginBottom:"7px",fontWeight:"400"}}>{item.headline}</div>
      {item.ai_summary&&<div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:"4px",padding:"5px 9px",fontSize:"11px",color:"#15803d",marginBottom:"7px",fontFamily:"var(--sans)"}}>◈ {item.ai_summary}{item.confidence&&<span style={{marginLeft:"6px",background:"#dcfce7",padding:"1px 5px",borderRadius:"3px",fontSize:"10px",fontWeight:"600"}}>{Math.round(item.confidence*100)}%</span>}</div>}
      {type==="indirect"&&item.relevance&&<div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:"4px",padding:"5px 9px",fontSize:"11px",color:"#1d4ed8",marginBottom:"7px",fontFamily:"var(--sans)"}}>↳ {item.relevance}</div>}
      <div style={{display:"flex",gap:"7px",alignItems:"center",flexWrap:"wrap"}}>
        <span className="tag" style={{background:"var(--bg)",color:"var(--slate)",borderColor:"var(--border)",textTransform:"uppercase",letterSpacing:"0.07em"}}>{item.source}</span>
        {item.url&&item.url!=="#"?<a href={item.url} target="_blank" rel="noopener noreferrer" style={{color:"var(--blue)",fontSize:"11px",fontFamily:"var(--mono)"}}>↗ {item.url.length>58?item.url.slice(0,58)+"…":item.url}</a>:<span style={{color:"var(--muted)",fontSize:"11px"}}>URL unavailable</span>}
      </div>
    </div>
  );
}

// ─── MORNING BRIEFING ─────────────────────────────────────────
function MorningBriefing({apiKey}) {
  const [briefing,setBriefing]=useState(null);const [loading,setLoading]=useState(false);const [loaded,setLoaded]=useState(false);
  const today=new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const BRIEF_PROMPT=`You are India's top financial journalist. Return ONLY valid JSON for today's morning market briefing:{"date":"","market_mood":"Bullish|Bearish|Cautious|Neutral","mood_reason":"one sentence","top_stories":[{"rank":1,"headline":"exact headline","source":"ET|MC|Mint|BS","impact":"Bullish|Bearish|Neutral","sector":"sector","why_it_matters":"one sentence","url":"URL"}],"stocks_in_focus":["SYM1","SYM2","SYM3","SYM4","SYM5"],"key_number":{"value":"stat","label":"what it means"},"trader_tip":"one actionable tip","fii_dii":{"fii":"Buyer|Seller","dii":"Buyer|Seller","net_flow":"₹XXXX Cr"}}
Exactly 5 top stories. Use today's actual news.`;
  const generate=async()=>{setLoading(true);try{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:BRIEF_PROMPT}]},contents:[{parts:[{text:`Generate today's Indian stock market morning briefing for ${today}.`}]}],tools:[{google_search:{}}],generationConfig:{temperature:0.2}})});const d=await r.json();const raw=d?.candidates?.[0]?.content?.parts?.[0]?.text||"{}";const clean=raw.replace(/```json|```/g,"").trim();const s=clean.indexOf("{"),e=clean.lastIndexOf("}");setBriefing(JSON.parse(clean.slice(s,e+1)));setLoaded(true);}catch(e){console.error(e);}setLoading(false);};
  const mC={Bullish:"var(--green)",Bearish:"var(--red)",Cautious:"var(--amber)",Neutral:"var(--slate)"};
  const mBg={Bullish:"#f0fdf4",Bearish:"#fef2f2",Cautious:"#fffbeb",Neutral:"#f8fafc"};
  return(
    <div style={{animation:"fadeUp 0.3s ease"}}>
      {/* Hero */}
      <div style={{background:"var(--navy)",borderRadius:"12px",padding:"28px 32px",marginBottom:"16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"16px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,backgroundImage:"radial-gradient(circle at 80% 50%, rgba(59,130,246,0.15) 0%, transparent 60%)"}}/>
        <div style={{position:"relative"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:"10px",color:"rgba(255,255,255,0.4)",letterSpacing:"0.15em",marginBottom:"6px"}}>☀ MORNING BRIEFING</div>
          <div style={{fontFamily:"var(--display)",fontSize:"24px",fontWeight:"700",color:"#fff",marginBottom:"3px"}}>Market Intelligence</div>
          <div style={{fontFamily:"var(--mono)",fontSize:"11px",color:"rgba(255,255,255,0.4)"}}>{today}</div>
        </div>
        <div style={{position:"relative"}}>
          {!loaded?<button className="btn btn-primary" style={{background:"#fff",color:"var(--navy)",padding:"11px 24px",fontSize:"13px",fontFamily:"var(--sans)"}} onClick={generate} disabled={loading}>{loading?"Generating…":"Generate Today's Briefing →"}</button>
          :<button className="btn btn-ghost" style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",padding:"8px 16px"}} onClick={generate} disabled={loading}>{loading?"Refreshing…":"↻ Refresh"}</button>}
        </div>
      </div>

      {loading&&<div style={{textAlign:"center",padding:"48px",display:"flex",flexDirection:"column",alignItems:"center",gap:"12px"}}><Spinner size={24}/><div style={{fontSize:"12px",color:"var(--muted)",fontFamily:"var(--mono)"}}>Scanning Indian financial media…</div></div>}

      {briefing&&!loading&&<div style={{animation:"fadeUp 0.3s ease"}}>
        {/* Mood row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:"12px",marginBottom:"12px"}}>
          <div className="card" style={{padding:"16px",borderLeft:`3px solid ${mC[briefing.market_mood]||"var(--border2)"}`}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"8px"}}>
              <span style={{fontSize:"20px"}}>{briefing.market_mood==="Bullish"?"🟢":briefing.market_mood==="Bearish"?"🔴":briefing.market_mood==="Cautious"?"🟡":"⚪"}</span>
              <div>
                <div style={{fontFamily:"var(--sans)",fontSize:"15px",fontWeight:"600",color:"var(--navy)"}}>Market is <span style={{color:mC[briefing.market_mood]}}>{briefing.market_mood}</span></div>
                <div style={{fontFamily:"var(--sans)",fontSize:"12px",color:"var(--slate)",marginTop:"2px"}}>{briefing.mood_reason}</div>
              </div>
            </div>
            {briefing.fii_dii&&<div style={{display:"flex",gap:"8px",paddingTop:"10px",borderTop:"1px solid var(--border)"}}>
              {[{l:"FII",v:briefing.fii_dii.fii},{l:"DII",v:briefing.fii_dii.dii},{l:"Net Flow",v:briefing.fii_dii.net_flow}].map(({l,v})=>{
                const isBuyer=v&&v.toLowerCase().includes("buyer");const isSeller=v&&v.toLowerCase().includes("seller");
                return(<div key={l} style={{background:"var(--bg)",borderRadius:"5px",padding:"6px 10px",textAlign:"center",flex:1,border:"1px solid var(--border)"}}>
                  <div style={{fontFamily:"var(--mono)",fontSize:"9px",color:"var(--muted)",marginBottom:"2px",letterSpacing:"0.08em"}}>{l}</div>
                  <div style={{fontFamily:"var(--mono)",fontSize:"11px",fontWeight:"500",color:isBuyer?"var(--green)":isSeller?"var(--red)":"var(--navy)"}}>{v||"—"}</div>
                </div>);
              })}
            </div>}
          </div>
          {briefing.key_number&&<div className="card" style={{padding:"16px",textAlign:"center",minWidth:"130px"}}>
            <div className="section-label" style={{marginBottom:"6px"}}>Key Stat</div>
            <div style={{fontFamily:"var(--mono)",fontSize:"20px",color:"var(--navy)",letterSpacing:"-0.02em"}}>{briefing.key_number.value}</div>
            <div style={{fontFamily:"var(--sans)",fontSize:"10px",color:"var(--muted)",marginTop:"4px",lineHeight:"1.4"}}>{briefing.key_number.label}</div>
          </div>}
        </div>

        {/* Stories */}
        <div className="card" style={{padding:"16px",marginBottom:"12px"}}>
          <div className="section-label" style={{marginBottom:"12px"}}>Top 5 Stories Today</div>
          {(briefing.top_stories||[]).map((story,i)=>{
            const sc=SENT[story.impact]||SENT.Neutral;
            return(<div key={i} style={{display:"flex",gap:"12px",padding:"10px 0",borderBottom:i<4?"1px solid var(--border)":"none"}}>
              <div style={{fontFamily:"var(--display)",fontSize:"18px",fontWeight:"700",color:"var(--border2)",width:"24px",flexShrink:0,lineHeight:1,marginTop:"2px"}}>0{story.rank}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginBottom:"4px"}}>
                  <span className="tag" style={{background:sc.bg,color:sc.c,borderColor:sc.border}}>{sc.i} {story.impact}</span>
                  <span className="tag" style={{background:"var(--bg)",color:"var(--slate)",borderColor:"var(--border)"}}>{story.sector}</span>
                  <span className="tag" style={{background:"#eff6ff",color:"var(--blue)",borderColor:"#bfdbfe"}}>{story.source}</span>
                </div>
                <div style={{fontFamily:"var(--sans)",fontSize:"13px",fontWeight:"600",color:"var(--navy)",lineHeight:"1.45",marginBottom:"3px"}}>{story.headline}</div>
                <div style={{fontFamily:"var(--sans)",fontSize:"11px",color:"var(--slate)",lineHeight:"1.4"}}>{story.why_it_matters}</div>
                {story.url&&story.url!=="N/A"&&<a href={story.url} target="_blank" rel="noopener noreferrer" style={{fontFamily:"var(--mono)",fontSize:"10px",color:"var(--blue)",display:"inline-block",marginTop:"3px"}}>Read ↗</a>}
              </div>
            </div>);
          })}
        </div>

        {/* Focus + Tip */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          {briefing.stocks_in_focus?.length>0&&<div className="card" style={{padding:"14px"}}>
            <div className="section-label" style={{marginBottom:"10px"}}>Stocks in Focus</div>
            <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
              {briefing.stocks_in_focus.map(s=><span key={s} style={{background:"var(--navy)",color:"#fff",borderRadius:"5px",padding:"4px 10px",fontFamily:"var(--mono)",fontSize:"11px"}}>{s}</span>)}
            </div>
          </div>}
          {briefing.trader_tip&&<div className="card" style={{padding:"14px",borderLeft:"3px solid var(--amber)"}}>
            <div className="section-label" style={{marginBottom:"7px",color:"var(--amber)"}}>Trader's Tip</div>
            <div style={{fontFamily:"var(--sans)",fontSize:"12px",color:"var(--navy)",lineHeight:"1.55"}}>{briefing.trader_tip}</div>
          </div>}
        </div>
      </div>}

      {!loaded&&!loading&&<div style={{textAlign:"center",padding:"32px",color:"var(--muted)",fontSize:"12px",background:"var(--white)",border:"1px solid var(--border)",borderRadius:"10px"}}>
        AI-powered briefing with FII/DII data, top 5 stories, stocks in focus, and a daily trader tip
      </div>}
    </div>
  );
}

// ─── PEER COMPARISON ─────────────────────────────────────────
function PeerComparison({apiKey}) {
  const [symA,setSymA]=useState("");const [symB,setSymB]=useState("");const [data,setData]=useState(null);const [loading,setLoading]=useState(false);const [error,setError]=useState("");
  const compare=async()=>{if(!symA.trim()||!symB.trim())return;setLoading(true);setError("");setData(null);try{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:'Compare two Indian NSE companies. Return ONLY valid JSON:{"company_a":{"name":"","symbol":"","sector":"","metrics":{"pe_ratio":null,"pb_ratio":null,"roe_percent":null,"debt_to_equity":null,"market_cap_cr":null,"revenue_growth_percent":null,"net_profit_margin_percent":null,"dividend_yield_percent":null},"strengths":[],"weaknesses":[],"verdict":""},"company_b":{...},"winner":"SYMBOL","winner_reason":"one sentence"}'}]},contents:[{parts:[{text:`Compare "${symA.toUpperCase()}" vs "${symB.toUpperCase()}" with latest financial data.`}]}],tools:[{google_search:{}}],generationConfig:{temperature:0.1}})});const d=await r.json();const raw=d?.candidates?.[0]?.content?.parts?.[0]?.text||"";const clean=raw.replace(/```json|```/g,"").trim();const s=clean.indexOf("{"),e=clean.lastIndexOf("}");setData(JSON.parse(clean.slice(s,e+1)));}catch{setError("Comparison failed. Check symbols and retry.");}setLoading(false);};
  const MR=({label,a,b,hib=true,ip=false})=>{const av=a!==null&&a!==undefined?Number(a):null;const bv=b!==null&&b!==undefined?Number(b):null;let aw=null;if(av!==null&&bv!==null)aw=hib?av>bv:av<bv;const fmt=v=>v===null?"—":`${v.toLocaleString("en-IN",{maximumFractionDigits:2})}${ip?"%":""}`;return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1.2fr 1fr",gap:"4px",alignItems:"center",padding:"6px 0",borderBottom:"1px solid var(--border)"}}>
      <div style={{fontFamily:"var(--mono)",fontSize:"11px",fontWeight:"500",color:aw===true?"var(--green)":aw===false?"var(--red)":"var(--navy)",background:aw===true?"#f0fdf4":aw===false?"#fef2f2":"transparent",borderRadius:"4px",padding:"3px 8px",textAlign:"center"}}>{fmt(av)}{aw===true?" ✓":""}</div>
      <div style={{fontFamily:"var(--mono)",fontSize:"9px",color:"var(--muted)",textAlign:"center",letterSpacing:"0.06em"}}>{label}</div>
      <div style={{fontFamily:"var(--mono)",fontSize:"11px",fontWeight:"500",color:aw===false?"var(--green)":aw===true?"var(--red)":"var(--navy)",background:aw===false?"#f0fdf4":aw===true?"#fef2f2":"transparent",borderRadius:"4px",padding:"3px 8px",textAlign:"center"}}>{fmt(bv)}{aw===false?" ✓":""}</div>
    </div>);};
  return(
    <div style={{animation:"fadeUp 0.3s ease"}}>
      <div className="card" style={{padding:"20px",marginBottom:"16px"}}>
        <div style={{fontFamily:"var(--display)",fontSize:"18px",fontWeight:"700",color:"var(--navy)",marginBottom:"14px"}}>Stock vs Stock — Peer Comparison</div>
        <div style={{display:"flex",gap:"10px",marginBottom:"12px",flexWrap:"wrap"}}>
          <input value={symA} onChange={e=>setSymA(e.target.value)} onKeyDown={e=>e.key==="Enter"&&compare()} placeholder="Company A  e.g. HDFCBANK" className="input-light" style={{flex:1,minWidth:"130px"}}/>
          <div style={{display:"flex",alignItems:"center",fontFamily:"var(--mono)",fontSize:"11px",color:"var(--muted)",fontWeight:"600"}}>VS</div>
          <input value={symB} onChange={e=>setSymB(e.target.value)} onKeyDown={e=>e.key==="Enter"&&compare()} placeholder="Company B  e.g. ICICIBANK" className="input-light" style={{flex:1,minWidth:"130px"}}/>
          <button className="btn btn-primary" onClick={compare} disabled={loading||!symA.trim()||!symB.trim()} style={{whiteSpace:"nowrap"}}>{loading?"Comparing…":"Compare →"}</button>
        </div>
        <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
          <span style={{fontFamily:"var(--mono)",fontSize:"9px",color:"var(--muted)",alignSelf:"center",letterSpacing:"0.08em"}}>QUICK:</span>
          {[["HDFCBANK","ICICIBANK"],["TCS","INFY"],["RELIANCE","ONGC"],["HAL","BEL"],["MARUTI","TATAMOTORS"]].map(([a,b])=><button key={a+b} onClick={()=>{setSymA(a);setSymB(b);}} className="btn btn-ghost" style={{padding:"3px 9px",fontSize:"10px",fontFamily:"var(--mono)"}}>{a}/{b}</button>)}
        </div>
      </div>
      {error&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"6px",padding:"10px 14px",color:"var(--red)",fontSize:"12px",marginBottom:"10px"}}>⚠ {error}</div>}
      {loading&&<div style={{textAlign:"center",padding:"40px",display:"flex",flexDirection:"column",alignItems:"center",gap:"12px"}}><Spinner size={24}/><div style={{fontSize:"12px",color:"var(--muted)"}}>Fetching live financials…</div></div>}
      {data&&!loading&&<div className="card" style={{padding:"16px",animation:"fadeUp 0.3s ease"}}>
        <div style={{background:"var(--navy)",borderRadius:"8px",padding:"12px 16px",marginBottom:"14px",display:"flex",alignItems:"center",gap:"12px"}}>
          <span style={{fontSize:"18px"}}>🏆</span>
          <div>
            <div style={{fontFamily:"var(--sans)",fontSize:"13px",fontWeight:"600",color:"#fff"}}>{data.winner} is the stronger pick</div>
            <div style={{fontFamily:"var(--sans)",fontSize:"11px",color:"rgba(255,255,255,0.6)",marginTop:"2px"}}>{data.winner_reason}</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1.2fr 1fr",gap:"4px",marginBottom:"8px"}}>
          {[data.company_a,null,data.company_b].map((co,i)=>co?(<div key={i} style={{textAlign:"center",background:data.winner===co.symbol?"#eff6ff":"var(--bg)",border:`1px solid ${data.winner===co.symbol?"#bfdbfe":"var(--border)"}`,borderRadius:"7px",padding:"10px 6px"}}>
            <div style={{fontFamily:"var(--mono)",fontSize:"14px",fontWeight:"500",color:data.winner===co.symbol?"var(--blue)":"var(--navy)"}}>{co.symbol}</div>
            <div style={{fontFamily:"var(--sans)",fontSize:"10px",color:"var(--muted)",marginTop:"2px"}}>{co.sector}</div>
            {data.winner===co.symbol&&<div style={{fontFamily:"var(--mono)",fontSize:"9px",color:"var(--blue)",marginTop:"4px",letterSpacing:"0.06em"}}>⭐ PREFERRED</div>}
          </div>):(<div key={i} style={{display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"var(--mono)",fontSize:"9px",color:"var(--muted)",letterSpacing:"0.08em"}}>METRIC</span></div>))}
        </div>
        {[{label:"P/E",a:data.company_a?.metrics?.pe_ratio,b:data.company_b?.metrics?.pe_ratio,hib:false},{label:"ROE %",a:data.company_a?.metrics?.roe_percent,b:data.company_b?.metrics?.roe_percent,hib:true,ip:true},{label:"DEBT/EQ",a:data.company_a?.metrics?.debt_to_equity,b:data.company_b?.metrics?.debt_to_equity,hib:false},{label:"NET MGN",a:data.company_a?.metrics?.net_profit_margin_percent,b:data.company_b?.metrics?.net_profit_margin_percent,hib:true,ip:true},{label:"REV GR",a:data.company_a?.metrics?.revenue_growth_percent,b:data.company_b?.metrics?.revenue_growth_percent,hib:true,ip:true},{label:"MKT CAP",a:data.company_a?.metrics?.market_cap_cr,b:data.company_b?.metrics?.market_cap_cr,hib:true}].map(p=><MR key={p.label} {...p}/>)}
      </div>}
    </div>
  );
}

// ─── STOCK DETAIL MODAL ───────────────────────────────────────
function StockDetailModal({symbol,name,apiKey,onClose}) {
  const [tab,setTab]=useState("overview");const [data,setData]=useState(null);const [loading,setLoading]=useState(true);const [price,setPrice]=useState(null);
  const DETAIL_PROMPT=`Provide data for NSE symbol "${symbol}". Return ONLY valid JSON:{"name":"","symbol":"${symbol}","sector":"","industry":"","founded":"","headquarters":"","md_ceo":"","description":"2-3 sentences","business_model":"1-2 sentences","metrics":{"market_cap_cr":null,"pe_ratio":null,"pb_ratio":null,"eps":null,"roe_percent":null,"roce_percent":null,"debt_to_equity":null,"current_ratio":null,"net_profit_margin_percent":null,"revenue_cr":null,"net_profit_cr":null,"dividend_yield_percent":null,"promoter_holding_percent":null,"fii_holding_percent":null,"dii_holding_percent":null,"public_holding_percent":null,"week_52_high":null,"week_52_low":null,"book_value":null},"recent_quarterly":{"quarter":"Q3FY25","revenue_cr":0,"net_profit_cr":0,"yoy_growth_percent":0},"pros":[],"cons":[],"key_risks":[],"investment_thesis":"2-3 sentences","fair_value_estimate":"estimate","peers":[]}`;
  useEffect(()=>{(async()=>{setLoading(true);
    try{const r=await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS?interval=1d&range=1d`)}`);const d=await r.json();const m=d?.chart?.result?.[0]?.meta;if(m?.regularMarketPrice){const p=m.regularMarketPrice,pr=m.previousClose||m.chartPreviousClose;setPrice({current:p,prev:pr,change:p-pr,pct:(p-pr)/pr*100,high:m.regularMarketDayHigh,low:m.regularMarketDayLow,volume:m.regularMarketVolume,state:m.marketState});}}catch{}
    try{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:DETAIL_PROMPT}]},contents:[{parts:[{text:`Get latest financial data for ${symbol} from screener.in, moneycontrol.`}]}],tools:[{google_search:{}}],generationConfig:{temperature:0.1}})});const d=await r.json();const raw=d?.candidates?.[0]?.content?.parts?.[0]?.text||"{}";const clean=raw.replace(/```json|```/g,"").trim();const s=clean.indexOf("{"),e=clean.lastIndexOf("}");setData(JSON.parse(clean.slice(s,e+1)));}catch(e){console.error(e);}
    setLoading(false);})();},[symbol]);
  const m=data?.metrics||{};const isUp=(price?.change||0)>=0;
  const MC=({label,value,color})=>(
    <div className="metric-card">
      <div className="section-label" style={{marginBottom:"4px"}}>{label}</div>
      <div style={{fontFamily:"var(--mono)",fontSize:"14px",fontWeight:"500",color:color||"var(--navy)"}}>{value!==null&&value!==undefined?value:"—"}</div>
    </div>
  );
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(15,31,61,0.5)",backdropFilter:"blur(4px)",zIndex:2000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"16px",overflowY:"auto"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"var(--white)",borderRadius:"12px",width:"100%",maxWidth:"920px",boxShadow:"0 24px 80px rgba(15,31,61,0.2)",animation:"fadeUp 0.2s ease",marginTop:"20px",border:"1px solid var(--border)"}}>
        {/* Header */}
        <div style={{background:"var(--navy)",borderRadius:"12px 12px 0 0",padding:"20px 24px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"12px"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"8px",flexWrap:"wrap"}}>
                <div style={{background:"rgba(245,158,11,0.15)",border:"1px solid rgba(245,158,11,0.3)",color:"#fbbf24",borderRadius:"5px",padding:"4px 12px",fontFamily:"var(--mono)",fontSize:"15px",fontWeight:"500"}}>{symbol}</div>
                {price?.state==="REGULAR"&&<span style={{background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.25)",color:"#4ade80",fontFamily:"var(--mono)",fontSize:"9px",padding:"2px 8px",borderRadius:"10px",letterSpacing:"0.08em"}}>● MARKET OPEN</span>}
              </div>
              <div style={{fontFamily:"var(--display)",fontSize:"18px",fontWeight:"600",color:"#fff",marginBottom:"3px"}}>{data?.name||name}</div>
              <div style={{fontFamily:"var(--mono)",fontSize:"10px",color:"rgba(255,255,255,0.4)"}}>{data?.sector} · {data?.industry}</div>
            </div>
            <div style={{textAlign:"right"}}>
              {price&&<><div style={{fontFamily:"var(--mono)",fontSize:"28px",fontWeight:"300",color:"#fff",letterSpacing:"-0.02em"}}>₹{price.current?.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}</div><div style={{fontFamily:"var(--mono)",fontSize:"12px",fontWeight:"500",color:isUp?"#4ade80":"#f87171",marginTop:"2px"}}>{isUp?"▲":"▼"} {Math.abs(price.change).toFixed(2)} ({Math.abs(price.pct).toFixed(2)}%)</div></>}
              <button onClick={onClose} className="btn btn-ghost" style={{marginTop:"10px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.7)",padding:"5px 12px",fontSize:"11px"}}>✕ Close</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:"2px",padding:"10px 16px 0",borderBottom:"1px solid var(--border)",background:"var(--bg)",alignItems:"center",flexWrap:"wrap"}}>
          {[{id:"overview",l:"Overview"},{id:"financials",l:"Financials"},{id:"holdings",l:"Holdings"},{id:"chart",l:"Chart"}].map(t=>(
            <button key={t.id} className={`tab-btn ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>{t.l}</button>
          ))}
          <div style={{marginLeft:"auto",display:"flex",gap:"5px",flexWrap:"wrap"}}>
            {[{l:"Screener.in",u:`https://www.screener.in/company/${symbol}`,c:"var(--green)"},{l:"TradingView",u:`https://www.tradingview.com/chart/?symbol=NSE:${symbol}`,c:"var(--blue)"},{l:"NSE",u:`https://www.nseindia.com/get-quotes/equity?symbol=${symbol}`,c:"var(--amber)"}].map(({l,u,c})=><a key={l} href={u} target="_blank" rel="noopener noreferrer" style={{fontFamily:"var(--mono)",fontSize:"9px",color:c,background:`${c}10`,border:`1px solid ${c}25`,borderRadius:"4px",padding:"3px 7px",letterSpacing:"0.05em"}}>{l} ↗</a>)}
          </div>
        </div>

        <div style={{padding:"16px 24px"}}>
          {loading&&<div style={{textAlign:"center",padding:"48px",display:"flex",flexDirection:"column",alignItems:"center",gap:"12px"}}><Spinner size={24}/><div style={{fontSize:"12px",color:"var(--muted)"}}>Loading company data…</div></div>}

          {!loading&&data&&<>
            {tab==="overview"&&<div style={{animation:"fadeUp 0.2s ease"}}>
              {price&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px",marginBottom:"14px"}}>
                {[{l:"DAY HIGH",v:`₹${price.high?.toFixed(2)}`,c:"var(--green)"},{l:"DAY LOW",v:`₹${price.low?.toFixed(2)}`,c:"var(--red)"},{l:"PREV CLOSE",v:`₹${price.prev?.toFixed(2)}`},{l:"VOLUME",v:price.volume?.toLocaleString("en-IN")}].map(({l,v,c})=><MC key={l} label={l} value={v} color={c}/>)}
              </div>}
              {(m.week_52_high||m.week_52_low)&&<div className="card" style={{padding:"12px 14px",marginBottom:"14px"}}>
                <div className="section-label" style={{marginBottom:"8px"}}>52-Week Range</div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}><span style={{fontFamily:"var(--mono)",fontSize:"11px",color:"var(--red)"}}>₹{m.week_52_low?.toLocaleString("en-IN")}</span><span style={{fontFamily:"var(--mono)",fontSize:"11px",color:"var(--green)"}}>₹{m.week_52_high?.toLocaleString("en-IN")}</span></div>
                <div style={{height:"5px",background:"var(--bg2)",borderRadius:"3px",position:"relative"}}>
                  <div style={{height:"5px",background:"linear-gradient(90deg,var(--red),var(--amber),var(--green))",borderRadius:"3px",opacity:0.25}}/>
                  {price&&m.week_52_low&&m.week_52_high&&<div style={{position:"absolute",top:"-2px",left:`${((price.current-m.week_52_low)/(m.week_52_high-m.week_52_low))*100}%`,width:"9px",height:"9px",background:"var(--navy)",borderRadius:"50%",transform:"translateX(-50%)",boxShadow:"0 1px 4px rgba(15,31,61,0.3)"}}/>}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:"4px"}}><span style={{fontFamily:"var(--mono)",fontSize:"9px",color:"var(--muted)"}}>52W LOW</span><span style={{fontFamily:"var(--mono)",fontSize:"9px",color:"var(--muted)"}}>52W HIGH</span></div>
              </div>}
              <div className="card" style={{padding:"14px",marginBottom:"14px"}}>
                <div className="section-label" style={{marginBottom:"8px"}}>About</div>
                <p style={{fontFamily:"var(--sans)",fontSize:"13px",color:"var(--slate)",lineHeight:"1.65",margin:"0 0 10px"}}>{data.description}</p>
                <p style={{fontFamily:"var(--sans)",fontSize:"12px",color:"var(--muted)",lineHeight:"1.5",margin:0,borderTop:"1px solid var(--border)",paddingTop:"10px"}}><span style={{color:"var(--slate)",fontWeight:"500"}}>Business Model:</span> {data.business_model}</p>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px",marginBottom:"14px"}}>
                {[{l:"MARKET CAP",v:m.market_cap_cr?`₹${Number(m.market_cap_cr).toLocaleString("en-IN")} Cr`:null},{l:"P/E RATIO",v:m.pe_ratio},{l:"P/B RATIO",v:m.pb_ratio},{l:"EPS ₹",v:m.eps}].map(({l,v})=><MC key={l} label={l} value={v}/>)}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}}>
                <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:"8px",padding:"12px"}}>
                  <div style={{fontFamily:"var(--mono)",fontSize:"9px",color:"var(--green)",letterSpacing:"0.1em",marginBottom:"8px"}}>✓ STRENGTHS</div>
                  {data.pros?.map((p,i)=><div key={i} style={{display:"flex",gap:"6px",marginBottom:"5px"}}><span style={{color:"var(--green)",fontSize:"10px",flexShrink:0}}>+</span><span style={{fontFamily:"var(--sans)",fontSize:"12px",color:"var(--slate)"}}>{p}</span></div>)}
                </div>
                <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"8px",padding:"12px"}}>
                  <div style={{fontFamily:"var(--mono)",fontSize:"9px",color:"var(--red)",letterSpacing:"0.1em",marginBottom:"8px"}}>✗ WEAKNESSES</div>
                  {data.cons?.map((c,i)=><div key={i} style={{display:"flex",gap:"6px",marginBottom:"5px"}}><span style={{color:"var(--red)",fontSize:"10px",flexShrink:0}}>-</span><span style={{fontFamily:"var(--sans)",fontSize:"12px",color:"var(--slate)"}}>{c}</span></div>)}
                </div>
              </div>
              {data.investment_thesis&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderLeft:"3px solid var(--amber)",borderRadius:"0 8px 8px 0",padding:"12px 14px",marginBottom:"12px"}}>
                <div style={{fontFamily:"var(--mono)",fontSize:"9px",color:"var(--amber)",letterSpacing:"0.1em",marginBottom:"6px"}}>INVESTMENT THESIS</div>
                <p style={{fontFamily:"var(--sans)",fontSize:"13px",color:"var(--navy)",lineHeight:"1.6",margin:"0 0 8px"}}>{data.investment_thesis}</p>
                {data.fair_value_estimate&&<p style={{fontFamily:"var(--mono)",fontSize:"11px",color:"var(--gold)",margin:0,paddingTop:"8px",borderTop:"1px solid #fde68a"}}>{data.fair_value_estimate}</p>}
              </div>}
              {data.peers?.length>0&&<div><div className="section-label" style={{marginBottom:"8px"}}>Peer Companies</div><div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>{data.peers.map(p=><span key={p} style={{background:"var(--navy)",color:"#fff",borderRadius:"5px",padding:"4px 10px",fontFamily:"var(--mono)",fontSize:"11px"}}>{p}</span>)}</div></div>}
            </div>}

            {tab==="financials"&&<div style={{animation:"fadeUp 0.2s ease"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"14px"}}>
                {[{l:"REVENUE",v:m.revenue_cr?`₹${Number(m.revenue_cr).toLocaleString("en-IN")} Cr`:null},{l:"NET PROFIT",v:m.net_profit_cr?`₹${Number(m.net_profit_cr).toLocaleString("en-IN")} Cr`:null},{l:"NET MARGIN",v:m.net_profit_margin_percent?`${m.net_profit_margin_percent}%`:null},{l:"ROE",v:m.roe_percent?`${m.roe_percent}%`:null,c:m.roe_percent>15?"var(--green)":m.roe_percent<8?"var(--red)":undefined},{l:"ROCE",v:m.roce_percent?`${m.roce_percent}%`:null,c:m.roce_percent>15?"var(--green)":undefined},{l:"DEBT/EQUITY",v:m.debt_to_equity,c:m.debt_to_equity<1?"var(--green)":m.debt_to_equity>2?"var(--red)":"var(--amber)"},{l:"CURR RATIO",v:m.current_ratio},{l:"EPS ₹",v:m.eps},{l:"BOOK VALUE ₹",v:m.book_value},{l:"P/E",v:m.pe_ratio},{l:"P/B",v:m.pb_ratio},{l:"DIV YIELD",v:m.dividend_yield_percent?`${m.dividend_yield_percent}%`:null,c:"var(--green)"}].map(({l,v,c})=><MC key={l} label={l} value={v} color={c}/>)}
              </div>
              {data.recent_quarterly&&<div className="card" style={{padding:"14px"}}>
                <div className="section-label" style={{marginBottom:"10px"}}>Latest Quarter — {data.recent_quarterly.quarter}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
                  {[{l:"REVENUE",v:`₹${Number(data.recent_quarterly.revenue_cr||0).toLocaleString("en-IN")} Cr`},{l:"NET PROFIT",v:`₹${Number(data.recent_quarterly.net_profit_cr||0).toLocaleString("en-IN")} Cr`},{l:"YOY GROWTH",v:`${data.recent_quarterly.yoy_growth_percent||0}%`,c:(data.recent_quarterly.yoy_growth_percent||0)>=0?"var(--green)":"var(--red)"}].map(({l,v,c})=><MC key={l} label={l} value={v} color={c}/>)}
                </div>
              </div>}
            </div>}

            {tab==="holdings"&&<div style={{animation:"fadeUp 0.2s ease"}}>
              <div className="section-label" style={{marginBottom:"14px"}}>Shareholding Pattern</div>
              {[{l:"Promoter Holding",v:m.promoter_holding_percent,c:"var(--navy)"},{l:"FII / Foreign",v:m.fii_holding_percent,c:"var(--blue)"},{l:"DII / Domestic",v:m.dii_holding_percent,c:"var(--green)"},{l:"Public",v:m.public_holding_percent,c:"var(--slate)"}].map(({l,v,c})=>(
                <div key={l} style={{marginBottom:"14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}><span style={{fontFamily:"var(--sans)",fontSize:"12px",color:"var(--navy)",fontWeight:"500"}}>{l}</span><span style={{fontFamily:"var(--mono)",fontSize:"12px",fontWeight:"500",color:c}}>{v!==null&&v!==undefined?`${v}%`:"N/A"}</span></div>
                  <div style={{height:"6px",background:"var(--bg2)",borderRadius:"3px"}}><div style={{height:"6px",background:c,borderRadius:"3px",width:`${v||0}%`,transition:"width 1.2s ease",opacity:0.7}}/></div>
                </div>
              ))}
              {data.key_risks?.length>0&&<div className="card" style={{padding:"14px",marginTop:"16px"}}>
                <div className="section-label" style={{marginBottom:"8px",color:"var(--red)"}}>Key Risks</div>
                {data.key_risks.map((r,i)=><div key={i} style={{display:"flex",gap:"8px",marginBottom:"6px"}}><span style={{color:"var(--red)",fontFamily:"var(--mono)",fontSize:"10px",flexShrink:0}}>▶</span><span style={{fontFamily:"var(--sans)",fontSize:"12px",color:"var(--slate)"}}>{r}</span></div>)}
              </div>}
            </div>}

            {tab==="chart"&&<div style={{animation:"fadeUp 0.2s ease"}}>
              <div className="section-label" style={{marginBottom:"10px"}}>Live Chart — RSI · MACD · Bollinger Bands</div>
              <div style={{borderRadius:"8px",overflow:"hidden",border:"1px solid var(--border)"}}>
                <iframe src={`https://s.tradingview.com/widgetembed/?frameElementId=tv&symbol=NSE%3A${symbol}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&studies=RSI%40tv-basicstudies%1FMACD%40tv-basicstudies&theme=light&style=1&timezone=Asia%2FKolkata&withdateranges=1&locale=en`} style={{width:"100%",height:"480px",border:"none"}} title={`${symbol} Chart`}/>
              </div>
              <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginTop:"10px"}}>
                {[{l:"Full Chart",u:`https://www.tradingview.com/chart/?symbol=NSE:${symbol}`,c:"var(--blue)"},{l:"Screener.in",u:`https://www.screener.in/company/${symbol}/consolidated/`,c:"var(--green)"},{l:"Finology",u:`https://ticker.finology.in/company/${symbol}`,c:"var(--amber)"},{l:"NSE Official",u:`https://www.nseindia.com/get-quotes/equity?symbol=${symbol}`,c:"var(--slate)"}].map(({l,u,c})=><a key={l} href={u} target="_blank" rel="noopener noreferrer" style={{background:"var(--bg)",border:`1px solid var(--border)`,color:c,borderRadius:"5px",padding:"7px 12px",fontFamily:"var(--sans)",fontSize:"12px",fontWeight:"500",textDecoration:"none"}}>{l} ↗</a>)}
              </div>
            </div>}
          </>}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [query,setQuery]=useState("");
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [followUp,setFollowUp]=useState("");
  const [followUpResult,setFollowUpResult]=useState("");
  const [followUpLoading,setFollowUpLoading]=useState(false);
  const [activeTab,setActiveTab]=useState("news");
  const [detailStock,setDetailStock]=useState(null);
  const apiKey=import.meta.env.VITE_GEMINI_API_KEY;

  const analyzeSentiment=async(headline)=>{try{const r=await fetch("http://localhost:8001/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:Date.now().toString(),headline})});return await r.json();}catch{return null;}};
  const callGemini=async(prompt,systemPrompt)=>{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:systemPrompt}]},contents:[{parts:[{text:prompt}]}],tools:[{google_search:{}}]})});const d=await r.json();if(d.error)throw new Error(d.error.message);return d.candidates?.[0]?.content?.parts?.[0]?.text||"";};
  const run=async(q)=>{if(!q.trim())return;setLoading(true);setError("");setResult(null);setFollowUpResult("");setFollowUp("");try{const raw=await callGemini(`Run full Indian stock market analysis for: "${q}". Search last 48 hours. Return ONLY the JSON object.`,SYSTEM_PROMPT);const clean=raw.replace(/```json|```/g,"").trim();const s=clean.indexOf("{"),e=clean.lastIndexOf("}");if(s===-1||e===-1)throw new Error("Parse error. Try again.");const parsed=JSON.parse(clean.slice(s,e+1));if(parsed.direct_news?.length>0){const tagged=await Promise.all(parsed.direct_news.map(async a=>{const sent=await analyzeSentiment(a.headline);return sent?{...a,sentiment:sent.sentiment,classification:sent.classification,ai_summary:sent.summary,confidence:sent.confidence}:a;}));parsed.direct_news=tagged;}setResult(parsed);}catch(err){setError("Scan failed: "+err.message);}setLoading(false);};
  const runFollowUp=async()=>{if(!followUp.trim()||!result)return;setFollowUpLoading(true);setFollowUpResult("");try{const text=await callGemini(followUp,`You are an MBA-grade Indian market analyst. Give precise answers about "${result?.query}".`);setFollowUpResult(text);}catch(err){setFollowUpResult("Error: "+err.message);}setFollowUpLoading(false);};

  const imp=result?.market_impact;
  const sc=SENT[imp?.overall_sentiment]||SENT.Neutral;
  const score=imp?.sentiment_score||0;
  const scC=score>20?"var(--green)":score<-20?"var(--red)":"var(--amber)";

  return(
    <div style={{minHeight:"100vh",background:"var(--bg)",color:"var(--navy)",fontFamily:"var(--sans)",width:"100%"}}>
      <style>{GLOBAL_CSS}</style>

      {/* Live Ticker */}
      <LiveTickerBar/>

      {/* Navbar */}
      <div style={{background:"var(--white)",borderBottom:"1px solid var(--border)",padding:"0 24px",display:"flex",alignItems:"center",height:"54px",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 4px rgba(15,31,61,0.06)",width:"100%"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{background:"var(--navy)",color:"#fff",width:"30px",height:"30px",borderRadius:"7px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"15px",fontWeight:"700",fontFamily:"var(--display)"}}>₹</div>
          <div>
            <div style={{fontFamily:"var(--display)",fontSize:"14px",fontWeight:"700",color:"var(--navy)",letterSpacing:"0.01em"}}>Kite Intelligence</div>
            <div style={{fontFamily:"var(--mono)",fontSize:"9px",color:"var(--muted)",letterSpacing:"0.08em"}}>NSE · BSE · LIVE</div>
          </div>
        </div>

        {/* Center tabs */}
        <div style={{margin:"0 auto",display:"flex",gap:"3px",background:"var(--bg)",borderRadius:"8px",padding:"3px"}}>
          {[{id:"news",l:"📰 News Scan"},{id:"compare",l:"⚖️ Compare"},{id:"briefing",l:"☀️ Morning Brief"}].map(t=>(
            <button key={t.id} className={`tab-btn ${activeTab===t.id?"active":""}`} onClick={()=>setActiveTab(t.id)} style={{padding:"6px 16px",fontSize:"12px"}}>{t.l}</button>
          ))}
        </div>

        <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
          {["ET","MINT","MC","BS"].map(s=><span key={s} style={{fontFamily:"var(--mono)",fontSize:"9px",color:"var(--muted)",background:"var(--bg)",border:"1px solid var(--border)",padding:"2px 6px",borderRadius:"3px",letterSpacing:"0.06em"}}>{s}</span>)}
          <span style={{display:"flex",alignItems:"center",gap:"5px",marginLeft:"8px"}}><span style={{width:"6px",height:"6px",borderRadius:"50%",background:"var(--green)",display:"inline-block",animation:"blink 2s infinite",boxShadow:"0 0 5px var(--green)"}}/><span style={{fontFamily:"var(--mono)",fontSize:"9px",color:"var(--green)",letterSpacing:"0.08em",fontWeight:"500"}}>LIVE</span></span>
        </div>
      </div>

      {/* ── MAIN CONTENT — FULL WIDTH ── */}
      <div style={{width:"100%",padding:"0"}}>

        {/* MORNING BRIEFING */}
        {activeTab==="briefing"&&<div style={{maxWidth:"900px",margin:"0 auto",padding:"20px 24px",animation:"fadeUp 0.3s ease"}}><MorningBriefing apiKey={apiKey}/></div>}

        {/* COMPARE */}
        {activeTab==="compare"&&<div style={{maxWidth:"900px",margin:"0 auto",padding:"20px 24px",animation:"fadeUp 0.3s ease"}}><PeerComparison apiKey={apiKey}/></div>}

        {/* NEWS SCAN — FULL WIDTH 3-COL LAYOUT */}
        {activeTab==="news"&&(
          <div style={{display:"grid",gridTemplateColumns:"280px 1fr 300px",gridTemplateRows:"auto",gap:"0",width:"100%",minHeight:"calc(100vh - 90px)"}}>

            {/* ── LEFT SIDEBAR ── */}
            <div style={{borderRight:"1px solid var(--border)",padding:"16px",background:"var(--white)",display:"flex",flexDirection:"column",gap:"12px",overflowY:"auto",maxHeight:"calc(100vh - 90px)",position:"sticky",top:"90px"}}>

              {/* Fear & Greed */}
              <FearGreedGauge/>

              {/* Index Charts */}
              <div>
                <div className="section-label" style={{marginBottom:"10px",paddingLeft:"2px"}}>Live Indices</div>
                <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                  <IndexChartCard name="NIFTY 50" yahooSymbol="^NSEI"/>
                  <IndexChartCard name="BSE SENSEX" yahooSymbol="^BSESN"/>
                </div>
              </div>

              {/* Sector Heatmap */}
              <SectorHeatmap apiKey={apiKey}/>
            </div>

            {/* ── CENTER — NEWS SCAN ── */}
            <div style={{padding:"16px 20px",overflowY:"auto",maxHeight:"calc(100vh - 90px)",background:"var(--bg)"}}>

              {/* HERO Search */}
              <div style={{background:"var(--white)",borderRadius:"12px",border:"1px solid var(--border)",padding:"20px",marginBottom:"16px",boxShadow:"0 2px 8px rgba(15,31,61,0.05)"}}>
                <div style={{fontFamily:"var(--display)",fontSize:"16px",fontWeight:"600",color:"var(--navy)",marginBottom:"12px"}}>Search & Scan</div>
                <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
                  <div style={{flex:1}}>
                    <StockSearch onSelect={company=>{setQuery(company.name);setDetailStock({symbol:company.symbol,name:company.name});}}/>
                  </div>
                  <button className="btn btn-primary" onClick={()=>run(query)} disabled={loading||!query.trim()} style={{whiteSpace:"nowrap",padding:"11px 20px"}}>{loading?"Scanning…":"Run Scan →"}</button>
                </div>
                <div style={{display:"flex",gap:"5px",flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{fontFamily:"var(--mono)",fontSize:"9px",color:"var(--muted)",letterSpacing:"0.1em",marginRight:"4px"}}>QUICK SCAN:</span>
                  {QUICK_PICKS.map(p=><button key={p} className="btn btn-ghost" style={{padding:"4px 10px",fontSize:"11px"}} onClick={()=>{setQuery(p);run(p);}}>{p}</button>)}
                </div>
              </div>

              {/* States */}
              {loading&&<div style={{textAlign:"center",padding:"60px",display:"flex",flexDirection:"column",alignItems:"center",gap:"14px",background:"var(--white)",borderRadius:"12px",border:"1px solid var(--border)"}}><Spinner size={26}/><div style={{fontFamily:"var(--sans)",fontSize:"13px",color:"var(--slate)",fontWeight:"500"}}>Scanning Indian market news…</div><div style={{fontFamily:"var(--mono)",fontSize:"10px",color:"var(--muted)",letterSpacing:"0.06em"}}>PESTEL · SIGNAL/NOISE · 48HR WINDOW</div></div>}
              {error&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"8px",padding:"12px 16px",color:"var(--red)",fontSize:"12px",marginBottom:"12px"}}>⚠ {error}</div>}

              {result&&!loading&&<div style={{animation:"fadeUp 0.3s ease"}}>
                {/* Summary */}
                <div style={{background:"var(--white)",border:"1px solid var(--border)",borderRadius:"10px",padding:"14px 16px",marginBottom:"12px",display:"flex",gap:"12px",alignItems:"center",flexWrap:"wrap",borderLeft:"3px solid var(--navy)",boxShadow:"0 1px 3px rgba(15,31,61,0.04)"}}>
                  <div>
                    <div className="section-label" style={{marginBottom:"2px"}}>ACTIVE SCAN</div>
                    <div style={{fontFamily:"var(--display)",fontSize:"18px",fontWeight:"700",color:"var(--navy)"}}>{result.query}</div>
                  </div>
                  <div style={{marginLeft:"auto",display:"flex",gap:"20px"}}>
                    {[{v:(result.direct_news||[]).length,l:"Direct",c:"var(--blue)"},{v:(result.indirect_news||[]).length,l:"Indirect",c:"#7c3aed"},{v:`${sc.i} ${imp?.overall_sentiment}`,l:"Sentiment",c:sc.c}].map(({v,l,c})=>(
                      <div key={l} style={{textAlign:"center"}}>
                        <div style={{fontFamily:"var(--mono)",fontSize:"16px",fontWeight:"500",color:c}}>{v}</div>
                        <div className="section-label" style={{marginTop:"2px"}}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section A */}
                <div style={{marginBottom:"16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
                    <div style={{width:"3px",height:"14px",background:"var(--blue)",borderRadius:"1px"}}/>
                    <span className="section-label">Section A — Direct News</span>
                    <span style={{background:"#eff6ff",color:"var(--blue)",border:"1px solid #bfdbfe",borderRadius:"10px",padding:"1px 8px",fontFamily:"var(--mono)",fontSize:"9px"}}>{(result.direct_news||[]).length}</span>
                  </div>
                  {(result.direct_news||[]).length===0?<div style={{background:"var(--white)",border:"1px solid var(--border)",borderRadius:"8px",padding:"16px",color:"var(--muted)",fontSize:"12px",fontFamily:"var(--mono)"}}>No market-moving events in the last 48 hours</div>:(result.direct_news||[]).map((item,i)=><NewsRow key={i} item={item} type="direct"/>)}
                </div>

                {/* Section B */}
                <div style={{marginBottom:"16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
                    <div style={{width:"3px",height:"14px",background:"#7c3aed",borderRadius:"1px"}}/>
                    <span className="section-label">Section B — Indirect News (PESTEL)</span>
                    <span style={{background:"#f5f3ff",color:"#7c3aed",border:"1px solid #ddd6fe",borderRadius:"10px",padding:"1px 8px",fontFamily:"var(--mono)",fontSize:"9px"}}>{(result.indirect_news||[]).length}</span>
                  </div>
                  {(result.indirect_news||[]).length===0?<div style={{background:"var(--white)",border:"1px solid var(--border)",borderRadius:"8px",padding:"16px",color:"var(--muted)",fontSize:"12px",fontFamily:"var(--mono)"}}>No indirect market events found</div>:(result.indirect_news||[]).map((item,i)=><NewsRow key={i} item={item} type="indirect"/>)}
                </div>

                {/* Section C */}
                {imp&&<div style={{marginBottom:"16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
                    <div style={{width:"3px",height:"14px",background:"var(--green)",borderRadius:"1px"}}/>
                    <span className="section-label">Section C — Market Impact</span>
                  </div>
                  <div style={{background:"var(--white)",border:"1px solid var(--border)",borderRadius:"10px",padding:"16px",boxShadow:"0 1px 3px rgba(15,31,61,0.04)"}}>
                    <div style={{marginBottom:"14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                        <span style={{fontFamily:"var(--mono)",fontSize:"9px",color:"var(--red)",letterSpacing:"0.08em"}}>◀ BEARISH</span>
                        <span style={{fontFamily:"var(--mono)",fontSize:"12px",color:scC,fontWeight:"500"}}>{score>0?"+":""}{score} / 100</span>
                        <span style={{fontFamily:"var(--mono)",fontSize:"9px",color:"var(--green)",letterSpacing:"0.08em"}}>BULLISH ▶</span>
                      </div>
                      <div style={{height:"5px",background:"var(--bg2)",borderRadius:"3px",position:"relative"}}>
                        <div style={{position:"absolute",left:"50%",top:0,width:"1px",height:"5px",background:"var(--border2)"}}/>
                        <div style={{position:"absolute",top:0,height:"5px",borderRadius:"3px",background:scC,left:score>=0?"50%":`${((score+100)/200)*100}%`,width:`${Math.abs(score)/2}%`,transition:"width 0.8s ease"}}/>
                      </div>
                    </div>
                    {imp.analyst_note&&<div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderLeft:"3px solid var(--green)",borderRadius:"0 6px 6px 0",padding:"10px 14px",marginBottom:"14px",fontFamily:"var(--sans)",fontSize:"13px",color:"#15803d",fontStyle:"italic"}}>"{imp.analyst_note}"</div>}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                      {[{title:"Fundamental Factors",items:imp.fundamental_factors,c:"var(--blue)",bg:"#eff6ff",bd:"#bfdbfe",i:"◉"},{title:"Sentiment Drivers",items:imp.sentiment_factors,c:"var(--amber)",bg:"#fffbeb",bd:"#fde68a",i:"◈"},{title:"Key Risks",items:imp.key_risks,c:"var(--red)",bg:"#fef2f2",bd:"#fecaca",i:"▼"},{title:"Key Catalysts",items:imp.key_catalysts,c:"var(--green)",bg:"#f0fdf4",bd:"#bbf7d0",i:"▲"}].map(({title,items,c,bg,bd,i})=>(
                        <div key={title} style={{background:bg,border:`1px solid ${bd}`,borderRadius:"8px",padding:"12px"}}>
                          <div style={{fontFamily:"var(--mono)",fontSize:"9px",color:c,letterSpacing:"0.08em",marginBottom:"8px"}}>{i} {title.toUpperCase()}</div>
                          {(items||[]).map((pt,idx)=><div key={idx} style={{display:"flex",gap:"6px",marginBottom:"5px"}}><span style={{color:c,fontSize:"9px",flexShrink:0,marginTop:"2px"}}>—</span><span style={{fontFamily:"var(--sans)",fontSize:"12px",color:"var(--slate)",lineHeight:"1.5"}}>{pt}</span></div>)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>}

                {/* Drill Down */}
                <div style={{background:"var(--white)",border:"1px solid var(--border)",borderRadius:"10px",padding:"14px",boxShadow:"0 1px 3px rgba(15,31,61,0.04)"}}>
                  <div className="section-label" style={{marginBottom:"8px"}}>Drill Down — P/E · Debt/Equity · Holdings</div>
                  <div style={{display:"flex",gap:"8px"}}>
                    <input value={followUp} onChange={e=>setFollowUp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&runFollowUp()} placeholder={`Ask anything about ${result.query}…`} className="input-light" style={{flex:1}}/>
                    <button className="btn btn-ghost" onClick={runFollowUp} disabled={followUpLoading||!followUp.trim()} style={{whiteSpace:"nowrap",color:"var(--green)",borderColor:"#bbf7d0",fontWeight:"600"}}>{followUpLoading?"…":"Drill →"}</button>
                  </div>
                  {followUpResult&&<div style={{marginTop:"10px",background:"#f0fdf4",border:"1px solid #bbf7d0",borderLeft:"3px solid var(--green)",borderRadius:"0 6px 6px 0",padding:"12px 14px",fontFamily:"var(--sans)",fontSize:"12px",color:"#15803d",lineHeight:"1.7",whiteSpace:"pre-wrap"}}>{followUpResult}</div>}
                </div>
              </div>}

              {!loading&&!result&&!error&&(
                <div style={{textAlign:"center",padding:"64px 0",background:"var(--white)",borderRadius:"12px",border:"1px solid var(--border)"}}>
                  <div style={{fontFamily:"var(--display)",fontSize:"32px",color:"var(--border2)",marginBottom:"12px",fontWeight:"400"}}>₹</div>
                  <div style={{fontFamily:"var(--display)",fontSize:"15px",fontWeight:"600",color:"var(--navy)",marginBottom:"6px"}}>Search any NSE listed company or sector</div>
                  <div style={{fontFamily:"var(--mono)",fontSize:"11px",color:"var(--muted)",letterSpacing:"0.05em"}}>Type above · Click any result for full details + live price</div>
                </div>
              )}
            </div>

            {/* ── RIGHT SIDEBAR — LIVE NEWS FEED ── */}
            <div style={{borderLeft:"1px solid var(--border)",background:"var(--white)",position:"sticky",top:"90px",height:"calc(100vh - 90px)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <LiveNewsFeed apiKey={apiKey}/>
            </div>

          </div>
        )}
      </div>

      {/* Stock Detail Modal */}
      {detailStock&&<StockDetailModal symbol={detailStock.symbol} name={detailStock.name} apiKey={apiKey} onClose={()=>setDetailStock(null)}/>}
    </div>
  );
}
