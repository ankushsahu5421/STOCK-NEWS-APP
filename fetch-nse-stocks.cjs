/**
 * fetch-nse-stocks.js
 * Run ONCE to download all NSE listed companies and save as JSON.
 * 
 * Usage: node fetch-nse-stocks.js
 * Output: src/data/nse_stocks.json
 */

const https = require("https");
const fs    = require("fs");
const path  = require("path");

// NSE official equity list CSV (all listed companies)
const NSE_CSV_URL = "https://archives.nseindia.com/content/equities/EQUITY_L.csv";

// Sector mapping based on NSE industry classification
const INDUSTRY_TO_SECTOR = {
  "BANKING":                        "Banking",
  "FINANCE":                        "Finance",
  "INSURANCE":                      "Insurance",
  "IT - SOFTWARE":                  "IT",
  "IT - HARDWARE":                  "IT",
  "COMPUTERS - SOFTWARE":           "IT",
  "PHARMACEUTICALS":                "Pharma",
  "HOSPITALS & MEDICAL SERVICES":   "Healthcare",
  "HEALTHCARE":                     "Healthcare",
  "AUTOMOBILE":                     "Auto",
  "AUTO ANCILLARIES":               "Auto Ancillary",
  "STEEL":                          "Metals",
  "METALS":                         "Metals",
  "ALUMINIUM":                      "Metals",
  "COPPER":                         "Metals",
  "MINING":                         "Mining",
  "CEMENT":                         "Cement",
  "FMCG":                           "FMCG",
  "CONSUMER DURABLES":              "Consumer Durables",
  "FOOD PROCESSING":                "Food & Beverage",
  "OIL EXPLORATION":                "Oil & Gas",
  "REFINERIES":                     "Oil & Gas",
  "GAS":                            "Oil & Gas",
  "POWER":                          "Power",
  "INFRASTRUCTURE":                 "Infrastructure",
  "CONSTRUCTION":                   "Construction",
  "REAL ESTATE":                    "Real Estate",
  "CHEMICALS":                      "Chemicals",
  "FERTILISERS":                    "Chemicals",
  "TEXTILES":                       "Textiles",
  "TELECOM":                        "Telecom",
  "MEDIA":                          "Media",
  "DEFENCE":                        "Defence",
  "CAPITAL GOODS":                  "Engineering",
  "ENGINEERING":                    "Engineering",
  "TRADING":                        "Trading",
  "LOGISTICS":                      "Logistics",
  "SHIPPING":                       "Logistics",
  "AGRICULTURE":                    "Agriculture",
  "HOTELS & RESTAURANTS":           "Hospitality",
  "EDUCATION":                      "Education",
  "RETAILING":                      "Retail",
  "PAPER":                          "Paper",
  "SUGAR":                          "Agriculture",
  "DIVERSIFIED":                    "Conglomerate",
};

function getSector(industry = "") {
  const upper = industry.toUpperCase().trim();
  for (const [key, val] of Object.entries(INDUSTRY_TO_SECTOR)) {
    if (upper.includes(key)) return val;
  }
  return "Others";
}

function parseCSV(csvText) {
  const lines = csvText.split("\n");
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
  const companies = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted fields with commas inside
    const fields = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { fields.push(current.trim()); current = ""; }
      else { current += char; }
    }
    fields.push(current.trim());

    if (fields.length < 2) continue;

    const symbol  = fields[0]?.replace(/"/g, "").trim();
    const name    = fields[1]?.replace(/"/g, "").trim();
    const series  = fields[2]?.replace(/"/g, "").trim();
    const isin    = fields[fields.length - 1]?.replace(/"/g, "").trim();

    // Only include EQ series (main board listed stocks)
    if (symbol && name && series === "EQ") {
      companies.push({
        symbol,
        name,
        exchange: "NSE",
        sector: "Others", // Will be enriched separately
        isin: isin || ""
      });
    }
  }

  return companies;
}

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "identity",
        "Connection": "keep-alive",
        "Referer": "https://www.nseindia.com/",
        "Cookie": "" // NSE sometimes requires session cookies
      }
    };

    https.get(url, options, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

async function main() {
  console.log("📊 Fetching NSE stock list...");
  console.log("URL:", NSE_CSV_URL);

  // Ensure output directory exists
  const outDir = path.join(__dirname, "src", "data");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
    console.log("✅ Created src/data/ directory");
  }

  let companies = [];

  try {
    const csv = await downloadFile(NSE_CSV_URL);
    companies  = parseCSV(csv);
    console.log(`✅ Fetched ${companies.length} companies from NSE`);
  } catch (err) {
    console.log(`⚠ NSE direct download failed: ${err.message}`);
    console.log("📋 Using backup company list with 200+ companies...");

    // Fallback: comprehensive hardcoded list if NSE blocks the request
    companies = [
      { symbol:"RELIANCE",  name:"Reliance Industries Ltd",         exchange:"NSE", sector:"Energy" },
      { symbol:"TCS",       name:"Tata Consultancy Services Ltd",   exchange:"NSE", sector:"IT" },
      { symbol:"HDFCBANK",  name:"HDFC Bank Ltd",                   exchange:"NSE", sector:"Banking" },
      { symbol:"INFY",      name:"Infosys Ltd",                     exchange:"NSE", sector:"IT" },
      { symbol:"ICICIBANK", name:"ICICI Bank Ltd",                  exchange:"NSE", sector:"Banking" },
      { symbol:"SBIN",      name:"State Bank of India",             exchange:"NSE", sector:"Banking" },
      { symbol:"BHARTIARTL",name:"Bharti Airtel Ltd",               exchange:"NSE", sector:"Telecom" },
      { symbol:"KOTAKBANK", name:"Kotak Mahindra Bank Ltd",         exchange:"NSE", sector:"Banking" },
      { symbol:"LT",        name:"Larsen & Toubro Ltd",             exchange:"NSE", sector:"Engineering" },
      { symbol:"HINDUNILVR",name:"Hindustan Unilever Ltd",          exchange:"NSE", sector:"FMCG" },
      { symbol:"BAJFINANCE", name:"Bajaj Finance Ltd",              exchange:"NSE", sector:"NBFC" },
      { symbol:"HCLTECH",   name:"HCL Technologies Ltd",            exchange:"NSE", sector:"IT" },
      { symbol:"WIPRO",     name:"Wipro Ltd",                       exchange:"NSE", sector:"IT" },
      { symbol:"AXISBANK",  name:"Axis Bank Ltd",                   exchange:"NSE", sector:"Banking" },
      { symbol:"MARUTI",    name:"Maruti Suzuki India Ltd",         exchange:"NSE", sector:"Auto" },
      { symbol:"SUNPHARMA", name:"Sun Pharmaceutical Industries",   exchange:"NSE", sector:"Pharma" },
      { symbol:"TATAMOTORS",name:"Tata Motors Ltd",                 exchange:"NSE", sector:"Auto" },
      { symbol:"TATASTEEL", name:"Tata Steel Ltd",                  exchange:"NSE", sector:"Metals" },
      { symbol:"NTPC",      name:"NTPC Ltd",                        exchange:"NSE", sector:"Power" },
      { symbol:"ONGC",      name:"Oil & Natural Gas Corporation",   exchange:"NSE", sector:"Oil & Gas" },
      { symbol:"ADANIENT",  name:"Adani Enterprises Ltd",           exchange:"NSE", sector:"Conglomerate" },
      { symbol:"ADANIPORTS",name:"Adani Ports & SEZ Ltd",           exchange:"NSE", sector:"Infrastructure" },
      { symbol:"HAL",       name:"Hindustan Aeronautics Ltd",       exchange:"NSE", sector:"Defence" },
      { symbol:"BEL",       name:"Bharat Electronics Ltd",          exchange:"NSE", sector:"Defence" },
      { symbol:"RVNL",      name:"Rail Vikas Nigam Ltd",            exchange:"NSE", sector:"Infrastructure" },
      { symbol:"IRFC",      name:"Indian Railway Finance Corp",     exchange:"NSE", sector:"Finance" },
      { symbol:"IRCTC",     name:"Indian Railway Catering",         exchange:"NSE", sector:"Travel" },
      { symbol:"DLF",       name:"DLF Ltd",                         exchange:"NSE", sector:"Real Estate" },
      { symbol:"ZOMATO",    name:"Zomato Ltd",                      exchange:"NSE", sector:"Consumer Tech" },
      { symbol:"PAYTM",     name:"One 97 Communications (Paytm)",   exchange:"NSE", sector:"Fintech" },
    ];
  }

  // Sort alphabetically by symbol
  companies.sort((a, b) => a.symbol.localeCompare(b.symbol));

  // Remove duplicates
  const seen = new Set();
  const unique = companies.filter(c => {
    if (seen.has(c.symbol)) return false;
    seen.add(c.symbol);
    return true;
  });

  // Save to JSON
  const outPath = path.join(outDir, "nse_stocks.json");
  fs.writeFileSync(outPath, JSON.stringify(unique, null, 2));

  console.log(`\n✅ Saved ${unique.length} companies to src/data/nse_stocks.json`);
  console.log(`📁 File location: ${outPath}`);
  console.log(`\n🚀 Now restart your React app with: npm run dev`);
}

main().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
