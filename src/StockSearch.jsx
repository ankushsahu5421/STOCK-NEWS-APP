import { useState, useEffect, useRef, useCallback } from "react";
import NSE_STOCKS from "./data/nse_stocks.json";

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const SECTOR_COLORS = {
  "IT":{ bg:"#dbeafe", text:"#1d4ed8" },"Banking":{ bg:"#dcfce7", text:"#166534" },
  "Pharma":{ bg:"#fce7f3", text:"#9d174d" },"Energy":{ bg:"#fef3c7", text:"#92400e" },
  "Auto":{ bg:"#e0e7ff", text:"#3730a3" },"FMCG":{ bg:"#f0fdf4", text:"#14532d" },
  "Defence":{ bg:"#fee2e2", text:"#991b1b" },"Infrastructure":{ bg:"#fff7ed", text:"#9a3412" },
  "Metals":{ bg:"#f1f5f9", text:"#334155" },"Power":{ bg:"#fefce8", text:"#713f12" },
  "Real Estate":{ bg:"#fdf4ff", text:"#7e22ce" },"Chemicals":{ bg:"#ecfdf5", text:"#065f46" },
  "Finance":{ bg:"#eff6ff", text:"#1e40af" },"Telecom":{ bg:"#f0f9ff", text:"#0369a1" },
  "default":{ bg:"#f3f4f6", text:"#374151" },
};
function getSectorColor(s){ return SECTOR_COLORS[s]||SECTOR_COLORS["default"]; }

function HighlightMatch({ text, query }) {
  if (!query) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return <span>{text.slice(0,idx)}<mark style={{background:"#fef08a",color:"#111827",borderRadius:"2px",padding:"0 1px"}}>{text.slice(idx,idx+query.length)}</mark>{text.slice(idx+query.length)}</span>;
}

function LivePriceCard({ company, onClose }) {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(false);
      try {
        const sym = `${company.symbol}.NS`;
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`;
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice) {
          setPrice({ current:meta.regularMarketPrice, prev:meta.previousClose||meta.chartPreviousClose, high:meta.regularMarketDayHigh, low:meta.regularMarketDayLow, volume:meta.regularMarketVolume, marketState:meta.marketState });
        } else setError(true);
      } catch { setError(true); }
      finally { setLoading(false); }
    })();
  }, [company.symbol]);

  const change = price ? price.current - price.prev : 0;
  const pct = price ? (change/price.prev*100) : 0;
  const up = change >= 0;
  const sc = getSectorColor(company.sector);

  return (
    <div style={{position:"absolute",top:"calc(100% + 8px)",left:0,right:0,background:"#fff",border:"2px solid #387ed1",borderRadius:"10px",padding:"16px",boxShadow:"0 8px 32px rgba(0,0,0,0.15)",zIndex:1001}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
            <div style={{background:"#1e3a5f",color:"#fff",borderRadius:"5px",padding:"3px 10px",fontSize:"13px",fontWeight:"700"}}>{company.symbol}</div>
            <span style={{fontSize:"10px",color:"#9ca3af",background:"#f3f4f6",padding:"2px 6px",borderRadius:"3px"}}>NSE</span>
            {price?.marketState==="REGULAR"&&<span style={{fontSize:"10px",color:"#16a34a",background:"#dcfce7",padding:"2px 6px",borderRadius:"3px",fontWeight:"600"}}>● Market Open</span>}
          </div>
          <div style={{fontSize:"13px",color:"#374151",marginTop:"5px",fontWeight:"500"}}>{company.name}</div>
          <span style={{background:sc.bg,color:sc.text,fontSize:"10px",fontWeight:"600",padding:"2px 7px",borderRadius:"4px",display:"inline-block",marginTop:"4px"}}>{company.sector||"Others"}</span>
        </div>
        <button onClick={onClose} style={{border:"none",background:"#f3f4f6",borderRadius:"5px",width:"28px",height:"28px",cursor:"pointer",color:"#6b7280",fontSize:"14px"}}>✕</button>
      </div>

      {loading&&<div style={{textAlign:"center",padding:"20px",color:"#9ca3af",fontSize:"13px"}}><div style={{width:"22px",height:"22px",border:"2px solid #e5e7eb",borderTop:"2px solid #387ed1",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto 10px"}}/>Fetching live price…</div>}
      {error&&!loading&&<div style={{background:"#fef9f0",border:"1px solid #fed7aa",borderRadius:"6px",padding:"10px 12px",fontSize:"12px",color:"#9a3412",marginBottom:"10px"}}>⚠ Price unavailable. Market may be closed or symbol not listed.<br/><a href={`https://www.nseindia.com/get-quotes/equity?symbol=${company.symbol}`} target="_blank" rel="noopener noreferrer" style={{color:"#387ed1"}}>Check on NSE →</a></div>}

      {price&&!loading&&<>
        <div style={{display:"flex",alignItems:"baseline",gap:"12px",marginBottom:"14px",flexWrap:"wrap"}}>
          <div style={{fontSize:"32px",fontWeight:"700",color:"#111827"}}>₹{price.current?.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
          <div style={{fontSize:"15px",fontWeight:"700",color:up?"#16a34a":"#dc2626"}}>{up?"▲":"▼"} {Math.abs(change).toFixed(2)} ({Math.abs(pct).toFixed(2)}%)</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"12px"}}>
          {[{l:"Prev Close",v:`₹${price.prev?.toFixed(2)}`,c:"#374151"},{l:"Day High",v:`₹${price.high?.toFixed(2)}`,c:"#16a34a"},{l:"Day Low",v:`₹${price.low?.toFixed(2)}`,c:"#dc2626"}].map(({l,v,c})=>(
            <div key={l} style={{background:"#f9fafb",borderRadius:"6px",padding:"8px 10px",textAlign:"center",border:"1px solid #f3f4f6"}}>
              <div style={{fontSize:"10px",color:"#9ca3af",marginBottom:"3px"}}>{l}</div>
              <div style={{fontSize:"13px",fontWeight:"700",color:c}}>{v||"—"}</div>
            </div>
          ))}
        </div>
        {price.volume>0&&<div style={{textAlign:"center",fontSize:"11px",color:"#9ca3af",marginBottom:"12px"}}>Volume: <strong style={{color:"#374151"}}>{price.volume?.toLocaleString("en-IN")}</strong> shares</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
          <a href={`https://www.tradingview.com/chart/?symbol=NSE:${company.symbol}`} target="_blank" rel="noopener noreferrer" style={{display:"block",textAlign:"center",background:"#387ed1",color:"#fff",padding:"9px",borderRadius:"6px",fontSize:"12px",fontWeight:"600",textDecoration:"none"}}>📈 TradingView Chart</a>
          <a href={`https://www.screener.in/company/${company.symbol}`} target="_blank" rel="noopener noreferrer" style={{display:"block",textAlign:"center",background:"#f0fdf4",border:"1px solid #86efac",color:"#16a34a",padding:"9px",borderRadius:"6px",fontSize:"12px",fontWeight:"600",textDecoration:"none"}}>📊 Screener.in</a>
        </div>
      </>}
    </div>
  );
}

export default function StockSearch({ onSelect, placeholder }) {
  const [input, setInput] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [focused, setFocused] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [recentSearches, setRecentSearches] = useState(() => { try { return JSON.parse(localStorage.getItem("recentStocks")||"[]"); } catch { return []; } });
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debouncedQ = useDebounce(input, 120);
  const ph = placeholder || `Search all ${NSE_STOCKS.length.toLocaleString()} NSE listed stocks…`;

  const search = useCallback((q) => {
    if (!q||q.length<1) { setResults([]); return; }
    setLoading(true);
    const lower = q.toLowerCase();
    const scored = NSE_STOCKS.map(c => {
      let score = 0;
      const sym=(c.symbol||"").toLowerCase(), name=(c.name||"").toLowerCase(), sect=(c.sector||"").toLowerCase();
      if(sym===lower) score+=100; else if(sym.startsWith(lower)) score+=80; else if(name.startsWith(lower)) score+=60; else if(sym.includes(lower)) score+=40; else if(name.includes(lower)) score+=20; else if(sect.includes(lower)) score+=10;
      return score>0?{...c,score}:null;
    }).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,10);
    setResults(scored); setLoading(false); setFocused(-1);
  }, []);

  useEffect(() => { search(debouncedQ); setIsOpen(debouncedQ.length>0); if(debouncedQ.length>0) setSelectedCompany(null); }, [debouncedQ, search]);

  const handleSelect = (company) => {
    setInput(company.symbol); setIsOpen(false); setSelectedCompany(company);
    const updated = [company,...recentSearches.filter(r=>r.symbol!==company.symbol)].slice(0,5);
    setRecentSearches(updated);
    try { localStorage.setItem("recentStocks", JSON.stringify(updated)); } catch {}
    if(onSelect) onSelect(company);
  };

  const handleKeyDown = (e) => {
    if(!isOpen) return;
    if(e.key==="ArrowDown"){e.preventDefault();setFocused(f=>Math.min(f+1,results.length-1));}
    else if(e.key==="ArrowUp"){e.preventDefault();setFocused(f=>Math.max(f-1,-1));}
    else if(e.key==="Enter"&&focused>=0) handleSelect(results[focused]);
    else if(e.key==="Escape") setIsOpen(false);
  };

  useEffect(() => {
    const h = (e) => { if(!dropdownRef.current?.contains(e.target)&&!inputRef.current?.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown",h); return ()=>document.removeEventListener("mousedown",h);
  }, []);

  const showRecent = input.length===0&&recentSearches.length>0;
  const displayList = showRecent ? recentSearches : results;

  return (
    <div style={{position:"relative",width:"100%",maxWidth:"560px"}}>
      <div style={{display:"flex",alignItems:"center",background:"#fff",border:isOpen?"2px solid #387ed1":"2px solid #e5e7eb",borderRadius:(isOpen&&displayList.length>0)?"8px 8px 0 0":"8px",boxShadow:isOpen?"0 0 0 3px rgba(56,126,209,0.1)":"0 1px 3px rgba(0,0,0,0.06)",transition:"all 0.15s",overflow:"hidden"}}>
        <span style={{padding:"0 12px",color:"#9ca3af",fontSize:"16px",flexShrink:0}}>🔍</span>
        <input ref={inputRef} value={input} onChange={e=>{setInput(e.target.value);setIsOpen(true);setSelectedCompany(null);}} onFocus={()=>{if(input.length>0||recentSearches.length>0)setIsOpen(true);}} onKeyDown={handleKeyDown} placeholder={ph} autoComplete="off" spellCheck={false} style={{flex:1,border:"none",outline:"none",padding:"12px 0",fontSize:"14px",color:"#111827",background:"transparent",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}/>
        <span style={{padding:"0 10px",fontSize:"10px",color:"#9ca3af",flexShrink:0,whiteSpace:"nowrap"}}>{NSE_STOCKS.length.toLocaleString()} stocks</span>
        {loading&&<span style={{padding:"0 8px",color:"#9ca3af",fontSize:"11px"}}>⏳</span>}
        {input&&<button onClick={()=>{setInput("");setResults([]);setIsOpen(false);setSelectedCompany(null);inputRef.current?.focus();}} style={{padding:"0 12px",border:"none",background:"none",cursor:"pointer",color:"#9ca3af",fontSize:"16px"}}>✕</button>}
      </div>

      {isOpen&&displayList.length>0&&(
        <div ref={dropdownRef} style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"2px solid #387ed1",borderTop:"1px solid #e5e7eb",borderRadius:"0 0 8px 8px",boxShadow:"0 8px 24px rgba(0,0,0,0.12)",zIndex:1000,overflow:"hidden"}}>
          <div style={{padding:"6px 14px",fontSize:"10px",fontWeight:"700",color:"#9ca3af",letterSpacing:"0.1em",textTransform:"uppercase",background:"#f9fafb",borderBottom:"1px solid #f3f4f6"}}>
            {showRecent?"🕐 Recent searches":`${results.length} results — click for live price`}
          </div>
          {displayList.map((company,i)=>{
            const sc=getSectorColor(company.sector);
            return (
              <div key={company.symbol+i} onMouseDown={()=>handleSelect(company)} onMouseEnter={()=>setFocused(i)} style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px 14px",cursor:"pointer",background:i===focused?"#eff6ff":"#fff",borderBottom:i<displayList.length-1?"1px solid #f9fafb":"none",transition:"background 0.1s"}}>
                <div style={{background:"#1e3a5f",color:"#fff",borderRadius:"5px",padding:"4px 8px",fontSize:"11px",fontWeight:"700",minWidth:"90px",textAlign:"center",flexShrink:0}}>{company.symbol}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:"13px",fontWeight:"500",color:"#111827",lineHeight:"1.3",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><HighlightMatch text={company.name} query={input}/></div>
                  <div style={{fontSize:"11px",color:"#6b7280",marginTop:"1px"}}>NSE · {company.sector||"Others"}</div>
                </div>
                {company.sector&&<span style={{background:sc.bg,color:sc.text,borderRadius:"4px",padding:"2px 7px",fontSize:"10px",fontWeight:"600",flexShrink:0,maxWidth:"90px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{company.sector}</span>}
                {i===focused&&<span style={{color:"#387ed1",fontSize:"12px",flexShrink:0}}>💰</span>}
              </div>
            );
          })}
          <div style={{padding:"5px 14px",fontSize:"10px",color:"#d1d5db",background:"#fafafa",borderTop:"1px solid #f3f4f6",display:"flex",gap:"12px"}}>
            <span>↑↓ navigate</span><span>↵ select</span><span>Esc close</span>
          </div>
        </div>
      )}

      {selectedCompany&&!isOpen&&<LivePriceCard company={selectedCompany} onClose={()=>setSelectedCompany(null)}/>}
    </div>
  );
}
