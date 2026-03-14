"""
===================================================
  AI SENTIMENT TAGGING MICROSERVICE
  Stack: FastAPI + Gemini API + FinBERT fallback
  Run:   uvicorn sentiment_service:app --port 8001
===================================================
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import httpx
import asyncio
import json
import re
import os
from datetime import datetime

app = FastAPI(title="Sentiment Analysis Microservice", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://yourdomain.com"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDyaLJmWQcTD6rMNf8c5WXU3WQMQeUY8sA")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

# ─── Pydantic Models ──────────────────────────────────────────
class ArticleInput(BaseModel):
    id: str
    headline: str
    full_text: Optional[str] = None
    source: Optional[str] = None

class SentimentResult(BaseModel):
    id: str
    headline: str
    sentiment: str              # Bullish | Bearish | Neutral
    sentiment_score: float      # -1.0 to 1.0
    confidence: float           # 0.0 to 1.0
    classification: str         # SIGNAL | NOISE
    pestel_tag: Optional[str]
    filing_type: str            # Official Filing | Rumour/Speculation | News Report
    company_symbols: List[str]
    sector_tags: List[str]
    keywords: List[str]
    summary: str                # 1-line summary for display
    processed_at: str

class BatchInput(BaseModel):
    articles: List[ArticleInput]

class BatchResult(BaseModel):
    results: List[SentimentResult]
    total: int
    processing_time_ms: float

# ─── PESTEL Keywords ──────────────────────────────────────────
PESTEL_KEYWORDS = {
    "Political":     ["election","government","policy","minister","parliament","BJP","congress","regulation","tariff","sanction","geopolitical"],
    "Economic":      ["GDP","inflation","RBI","repo rate","interest rate","CPI","IIP","fiscal","budget","tax","forex","dollar","rupee","FII","FDI"],
    "Social":        ["consumer","demographic","rural","urban","employment","labour","workforce","strike","protest","ESG","CSR"],
    "Technological": ["AI","machine learning","digital","cloud","5G","EV","semiconductor","patent","R&D","automation","startup","IPO tech"],
    "Environmental": ["climate","green","renewable","solar","carbon","emission","ESG","sustainability","drought","monsoon","pollution"],
    "Legal":         ["court","SEBI","CCI","ED","CBI","fraud","scam","penalty","fine","compliance","lawsuit","arbitration","insolvency","NCLT"]
}

FILING_KEYWORDS = {
    "Official Filing": ["BSE filing","NSE filing","SEBI","board approved","board meeting","results announced","QIP","rights issue","AGM","EGM","regulatory"],
    "Rumour/Speculation": ["sources say","reportedly","rumour","speculation","unconfirmed","according to sources","may","could","might consider","whispers"]
}

NSE_SYMBOLS = [
    "RELIANCE","TCS","HDFCBANK","INFY","ICICIBANK","SBIN","BHARTIARTL","WIPRO","LT",
    "AXISBANK","KOTAKBANK","SUNPHARMA","MARUTI","BAJFINANCE","NTPC","ONGC","ADANIENT",
    "ADANIPORTS","TATAMOTORS","TATASTEEL","HINDUNILVR","ITC","DRREDDY","CIPLA","ULTRACEMCO",
    "HCLTECH","TECHM","COALINDIA","POWERGRID","GRASIM","TITAN","ZOMATO","IRFC","RVNL",
    "HAL","BEL","IRCTC","JIOFIN","DIVISLAB","BAJAJFINSV","NESTLEIND","ASIANPAINT","LTIM",
    "INDUSINDBK","M&M","HDFCLIFE","PAYTM","NIFTY","SENSEX","BANKNIFTY"
]

SECTOR_KEYWORDS = {
    "IT": ["software","IT","technology","cloud","digital","SaaS","tech services"],
    "Banking": ["bank","loan","NPA","credit","deposit","CASA","net interest","NIM"],
    "Pharma": ["drug","pharma","API","FDA","formulation","biotech","medicine"],
    "Energy": ["oil","gas","refinery","petroleum","crude","fuel","LNG"],
    "Auto": ["vehicle","automobile","EV","electric vehicle","car","truck","2-wheeler"],
    "Telecom": ["telecom","spectrum","5G","ARPU","subscribers","broadband"],
    "FMCG": ["consumer goods","FMCG","volume growth","rural demand","pricing"],
    "Infrastructure": ["infrastructure","roads","railways","ports","airport"],
    "Defence": ["defence","military","DRDO","HAL","BEL","indigenisation"],
    "Real Estate": ["real estate","housing","residential","commercial","RERA"],
}

# ─── Rule-based pre-tagger (fast, no API call needed) ─────────
def rule_based_tag(headline: str, full_text: str = "") -> dict:
    text = (headline + " " + (full_text or "")).lower()

    # PESTEL
    pestel_tag = None
    for tag, keywords in PESTEL_KEYWORDS.items():
        if any(kw.lower() in text for kw in keywords):
            pestel_tag = tag
            break

    # Filing type
    filing_type = "News Report"
    for ftype, keywords in FILING_KEYWORDS.items():
        if any(kw.lower() in text for kw in keywords):
            filing_type = ftype
            break

    # Company symbols
    text_upper = (headline + " " + (full_text or "")).upper()
    symbols = [s for s in NSE_SYMBOLS if re.search(rf'\b{s}\b', text_upper)]

    # Sectors
    sector_tags = []
    for sector, keywords in SECTOR_KEYWORDS.items():
        if any(kw.lower() in text for kw in keywords):
            sector_tags.append(sector)

    # Classification (SIGNAL vs NOISE)
    signal_patterns = [
        r'results?|earnings?|profit|revenue|EPS|dividend|acquisition|merger|deal|order|contract',
        r'board approv|SEBI|filing|QIP|rights issue|AGM|policy rate|repo|RBI decision'
    ]
    is_signal = any(re.search(p, text, re.IGNORECASE) for p in signal_patterns)
    classification = "SIGNAL" if is_signal else "NOISE"

    return {
        "pestel_tag": pestel_tag,
        "filing_type": filing_type,
        "company_symbols": symbols[:5],
        "sector_tags": sector_tags[:3],
        "classification": classification
    }

# ─── Gemini Sentiment Analysis ────────────────────────────────
SENTIMENT_SYSTEM_PROMPT = """You are a financial NLP engine analyzing Indian stock market news.

For each headline provided, return ONLY a valid JSON array with this exact structure per item:
[
  {
    "id": "article_id",
    "sentiment": "Bullish" | "Bearish" | "Neutral",
    "sentiment_score": number between -1.0 (most bearish) and 1.0 (most bullish),
    "confidence": number between 0.0 and 1.0,
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "summary": "One sentence max. What happened and why it matters for the stock/market."
  }
]

RULES:
- Bullish: positive earnings, deal wins, policy support, upgrades, expansion
- Bearish: losses, downgrades, regulatory action, bad macro, management issues  
- Neutral: routine filings, mixed signals, awaiting outcomes
- Be precise. A repo rate hike is Bearish for rate-sensitive stocks but Neutral for IT.
- Return ONLY the JSON array. No markdown. No explanation."""

async def call_gemini_sentiment(articles: List[ArticleInput]) -> List[dict]:
    """Call Gemini API for batch sentiment analysis."""
    
    headlines_text = "\n".join([
        f'ID: {a.id} | Headline: {a.headline}'
        + (f' | Context: {a.full_text[:200]}' if a.full_text else '')
        for a in articles
    ])

    payload = {
        "system_instruction": {"parts": [{"text": SENTIMENT_SYSTEM_PROMPT}]},
        "contents": [{"parts": [{"text": f"Analyze these {len(articles)} headlines:\n\n{headlines_text}"}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 2000}
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(GEMINI_URL, json=payload)
        response.raise_for_status()
        data = response.json()

    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
    clean = raw_text.strip().replace("```json", "").replace("```", "").strip()
    return json.loads(clean)

# ─── Main Processing Pipeline ─────────────────────────────────
async def process_articles(articles: List[ArticleInput]) -> List[SentimentResult]:
    start = datetime.now()

    # Step 1: Rule-based pre-processing (instant)
    rule_tags = {a.id: rule_based_tag(a.headline, a.full_text) for a in articles}

    # Step 2: AI sentiment (batch call to Gemini)
    try:
        ai_results = await call_gemini_sentiment(articles)
        ai_map = {r["id"]: r for r in ai_results}
    except Exception as e:
        print(f"Gemini error: {e}. Using rule-based fallback.")
        ai_map = {}

    # Step 3: Merge results
    results = []
    article_map = {a.id: a for a in articles}
    
    for article in articles:
        rt = rule_tags.get(article.id, {})
        ai = ai_map.get(article.id, {})

        # Fallback sentiment via simple keyword matching
        if not ai:
            text = article.headline.lower()
            bullish_words = ["profit","growth","wins","beats","strong","positive","upgrade","rally","surge"]
            bearish_words = ["loss","decline","falls","misses","weak","negative","downgrade","fraud","penalty"]
            b_count = sum(1 for w in bullish_words if w in text)
            be_count = sum(1 for w in bearish_words if w in text)
            if b_count > be_count:
                ai = {"sentiment":"Bullish","sentiment_score":0.4,"confidence":0.5,"keywords":[],"summary":article.headline}
            elif be_count > b_count:
                ai = {"sentiment":"Bearish","sentiment_score":-0.4,"confidence":0.5,"keywords":[],"summary":article.headline}
            else:
                ai = {"sentiment":"Neutral","sentiment_score":0.0,"confidence":0.6,"keywords":[],"summary":article.headline}

        results.append(SentimentResult(
            id=article.id,
            headline=article.headline,
            sentiment=ai.get("sentiment","Neutral"),
            sentiment_score=round(float(ai.get("sentiment_score", 0.0)), 4),
            confidence=round(float(ai.get("confidence", 0.5)), 4),
            classification=rt.get("classification","NOISE"),
            pestel_tag=rt.get("pestel_tag"),
            filing_type=rt.get("filing_type","News Report"),
            company_symbols=rt.get("company_symbols",[]),
            sector_tags=rt.get("sector_tags",[]),
            keywords=ai.get("keywords",[]),
            summary=ai.get("summary", article.headline),
            processed_at=datetime.utcnow().isoformat()
        ))

    return results

# ─── API Endpoints ────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "sentiment-analysis", "version": "1.0.0"}

@app.post("/analyze", response_model=SentimentResult)
async def analyze_single(article: ArticleInput):
    """Analyze a single article."""
    results = await process_articles([article])
    return results[0]

@app.post("/analyze/batch", response_model=BatchResult)
async def analyze_batch(batch: BatchInput):
    """
    Analyze up to 50 articles in one call.
    Used by the news ingestion pipeline.
    """
    if len(batch.articles) > 50:
        raise HTTPException(status_code=400, detail="Max 50 articles per batch")
    
    start = datetime.now()
    results = await process_articles(batch.articles)
    elapsed = (datetime.now() - start).total_seconds() * 1000

    return BatchResult(
        results=results,
        total=len(results),
        processing_time_ms=round(elapsed, 2)
    )

@app.get("/sentiment/heatmap")
async def sector_heatmap(db_results: list = None):
    """
    Returns sector-level sentiment aggregation for heatmap visualization.
    In production: query this from PostgreSQL aggregation.
    """
    # Mock data - replace with real DB query:
    # SELECT sector_tag, AVG(sentiment_score), COUNT(*) 
    # FROM news_articles, unnest(sector_tags) as sector_tag 
    # WHERE published_at > NOW() - INTERVAL '24 hours'
    # GROUP BY sector_tag
    return {
        "heatmap": [
            {"sector": "IT",            "score": 0.42,  "count": 18, "label": "Bullish"},
            {"sector": "Banking",       "score": -0.21, "count": 24, "label": "Bearish"},
            {"sector": "Pharma",        "score": 0.15,  "count": 9,  "label": "Neutral"},
            {"sector": "Energy",        "score": 0.63,  "count": 12, "label": "Bullish"},
            {"sector": "Auto",          "score": -0.08, "count": 7,  "label": "Neutral"},
            {"sector": "Infrastructure","score": 0.55,  "count": 15, "label": "Bullish"},
            {"sector": "FMCG",          "score": 0.02,  "count": 6,  "label": "Neutral"},
            {"sector": "Defence",       "score": 0.71,  "count": 8,  "label": "Bullish"},
        ],
        "generated_at": datetime.utcnow().isoformat()
    }

# ─── RSS Ingestion Worker (run as background task) ────────────
RSS_FEEDS = {
    "Economic Times":     "https://economictimes.indiatimes.com/markets/rss.cms",
    "Moneycontrol":       "https://www.moneycontrol.com/rss/business.xml",
    "LiveMint":           "https://www.livemint.com/rss/markets",
    "Business Standard":  "https://www.business-standard.com/rss/markets-106.rss",
    "NDTV Profit":        "https://feeds.feedburner.com/ndtvprofit-latest",
    "Financial Express":  "https://www.financialexpress.com/market/feed/",
}

@app.post("/ingest/rss")
async def trigger_rss_ingestion(background_tasks: BackgroundTasks):
    """
    Trigger RSS ingestion in background.
    Call this endpoint every 15 minutes via a cron job.
    """
    background_tasks.add_task(ingest_rss_feeds)
    return {"message": "RSS ingestion started in background", "feeds": len(RSS_FEEDS)}

async def ingest_rss_feeds():
    """
    Fetch all RSS feeds, parse new articles, run sentiment pipeline.
    In production: save results to PostgreSQL.
    """
    import xml.etree.ElementTree as ET

    for source, url in RSS_FEEDS.items():
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers={
                    "User-Agent": "Mozilla/5.0 (compatible; StockIntelligenceBot/1.0)"
                })
                
            root = ET.fromstring(response.text)
            items = root.findall(".//item")
            
            articles = []
            for i, item in enumerate(items[:10]):  # process latest 10 per feed
                title = item.find("title")
                link  = item.find("link")
                desc  = item.find("description")
                
                if title is not None and link is not None:
                    articles.append(ArticleInput(
                        id=f"{source}_{i}_{hash(title.text)}",
                        headline=title.text.strip(),
                        full_text=desc.text[:500] if desc is not None and desc.text else None,
                        source=source
                    ))

            if articles:
                results = await process_articles(articles)
                # TODO: Save to PostgreSQL
                # await db.execute(INSERT INTO news_articles ...)
                print(f"✓ {source}: {len(results)} articles processed")

        except Exception as e:
            print(f"✗ {source} feed error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("sentiment_service:app", host="0.0.0.0", port=8001, reload=True)
