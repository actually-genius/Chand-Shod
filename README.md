# Chand Shod? (چند شد؟) — TGJU Rates & Crypto Engine 🚀

A high-performance, resilient **Node.js** scraping engine and RESTful API service for Iranian financial markets, foreign exchange, cryptocurrencies, and precious metals data from **TGJU** (tgju.org - Tehran Gold & Jewelry Union), accompanied by an interactive real-time WebUI dashboard with Server-Sent Events (SSE) logging.

This project delivers real-time market rates with extensive cryptocurrency tracking (both Toman and USD rates), complete gold & coin asset coverage, support for all three TGJU Gram crypto tokens, persistent user output toggles, zero-dependency API key security, and live log streaming.

> 🇮🇷 **مستندات فارسی:** برای مطالعه راهنمای فارسی پروژه، لطفاً فایل [readme_fa.md](readme_fa.md) را مشاهده کنید.

---

## 🌟 Key Features

1. **Robust Real-time Scraping from TGJU:**
   - Connects directly to TGJU AJAX endpoints (`https://call4.tgju.org/ajax.json`).
   - Simulates valid browser client requests with proper headers (`User-Agent`, `Referer`, `X-Requested-With`).
   - Resilient against network outages with automatic stale cache fallback and `stale: true` indicators.
   - Automatic Iranian Rial to Toman conversion (`Math.floor(rial / 10)`), while preserving raw Rial and USD values.

2. **Full Financial Asset Coverage (71 Supported Items):**
   - **Fiat Currencies:** Free Market US Dollar (USD), Euro (EUR), British Pound (GBP), UAE Dirham (AED), Turkish Lira (TRY), Chinese Yuan (CNY), Canadian Dollar (CAD), Australian Dollar (AUD), Swiss Franc (CHF), Russian Ruble (RUB), Japanese Yen (JPY), and regional currencies (IQD, AFN, AMD, AZN, GEL, KWD, SAR, QAR, etc.).
   - **Cryptocurrency (Crypto):** Bitcoin (BTC), Ethereum (ETH), Tether (USDT), Solana (SOL), TRON (TRON / TRX), Dogecoin (DOGE), all three Telegram Gram crypto tokens (`GRAM1`, `GRAM2`, `TON`, `GRAM_CRYPTO`), Binance Coin (BNB), Ripple (XRP), Cardano (ADA), Litecoin (LTC), Shiba Inu (SHIB), Polkadot (DOT), Avalanche (AVAX), Chainlink (LINK), PAX Gold (PAXG), and Tether Gold (XAUT).
   - **Gold & Precious Metals:** 18K Gold Gram (`GERAM18`), 24K Gold Gram (`GERAM24`), Mesghal (`MESGHAL`), Wholesale Melted Gold (`GOLD_MELTED`), Standard 750 Gold (`TGJU_GOLD18`), Second-hand 740 Gold (`GOLD_740K`), Mini Melted Gold (`GOLD_MINI`), Global Gold Ounce (`ONS`), Silver Ounce (`SILVER_ONS`), Pure Silver 999 (`SILVER_999`), Silver 925 (`SILVER_925`), Platinum (`PLATINUM`), and Palladium (`PALLADIUM`).
   - **Coins & Bubbles:** New Bahar Azadi / Emami Coin (`SEKEE`), Old Bahar Azadi (`SEKEB`), Half Coin (`NIM`), Quarter Coin (`ROB`), Gerami Coin (`GERAMI`), Retail variants, and calculated Coin Price Bubbles (`SEKEB_BLUBBER`, `NIM_BLUBBER`, `ROB_BLUBBER`, `GERAMI_BLUBBER`).

3. **Dual-Denomination Crypto Tracking:**
   - Extracts and exposes both Toman/Rial prices and global US Dollar (USD) market prices in a unified JSON entity.

4. **Support for All Three Crypto Gram Tokens & Gram Variants:**
   - In the Iranian gold market and TGJU, "Gram" refers to distinct assets across multiple categories:
     - **Raw Gold Bullion:** `GERAM18` (18-Karat Gold Gram) and `GERAM24` (24-Karat Pure Gold Gram).
     - **Minted Coins:** `GERAMI` (Central Bank 1-Gram Coin) and `RETAIL_GERAMI` (Retail 1-Gram Coin).
     - **All Three TGJU Crypto Gram Tokens:**
       - `GRAM1`: Row 1 on TGJU crypto table (ID `1764279`, `Gram prev. Toncoin #1`)
       - `GRAM2`: Row 2 on TGJU crypto table (ID `1764293`, `Gram prev. Toncoin #2`)
       - `TON`: Row 3 on TGJU crypto table / `crypto-toncoin` (ID `764637`, official `Toncoin / Gram #3`)
       - `GRAM_CRYPTO`: General alias corresponding to Gram Token #1
   - All are individually mapped and can be selectively toggled in the WebUI to control their inclusion in REST API responses.

5. **Interactive WebUI Dashboard:**
   - Clean, accessible cyber synthwave dark & purple theme with tasteful glitch styling.
   - Per-item toggle switches to control which rates are included in the REST API output.
   - Persistence of enabled/disabled states across server restarts in `data/config.json`.
   - Real-time terminal log viewer streaming events via **Server-Sent Events (SSE)**.
   - Built-in API tester playground with instant latency measurement and JSON copy.

---

## 📂 Project Structure

```text
chandshod/
├── data/
│   ├── config.json          # Persistent user configurations and item toggles
│   └── auth.json            # Hashed credentials and API key digests
├── public/                  # Static assets for the WebUI
│   ├── index.html           # Dashboard layout and components
│   ├── styles.css           # Accessible design tokens and responsive stylesheet
│   └── app.js               # Frontend application, SSE subscriber, and API client
├── services/
│   ├── auth.js              # Password authentication & API key manager
│   ├── config.js            # Configuration service and catalog of 71 master items
│   ├── logger.js            # In-memory ring buffer logger with Tehran time (UTC+03:30)
│   └── scraper.js           # Core scraping engine, parser, and interval scheduler
├── package.json             # ES Module package definition and scripts
├── server.js                # Express REST API and SSE streaming server
├── README.md                # English documentation
└── readme_fa.md             # Persian documentation
```

---

## 🛠 Tutorials: How to Run the Server

### Tutorial 1: Direct Run with Node.js (Quickstart)

#### 1. Prerequisites
- **Node.js** version 18.0.0 or higher. Verify your installation:
  ```bash
  node -v
  npm -v
  ```

#### 2. Install Dependencies
Clone the repository and install the required production dependencies (`express`, `cors`):
```bash
npm install
```

#### 3. Start the Server
You can start the server using npm scripts:

```bash
# Standard production start
npm start

# Or run directly with node
node server.js

# Or start in watch mode (auto-reloads on file changes, Node 18+)
npm run dev
```

When started, you will see output like:
```text
[INFO] TGJU Scraper API & WebUI running at http://localhost:1718
[INFO] Starting background scraper loop (interval: 60s)
[INFO] Fetching rates from TGJU: https://call4.tgju.org/ajax.json
[SUCCESS] Fetch succeeded (660ms, 73 items)
```

Open your browser and navigate to:
```text
http://localhost:1718
```

---

### Tutorial 2: Changing the Listening Port

By default, the server binds to port `1718`. You can configure a custom port via the `PORT` environment variable:

- **Linux / macOS (Bash / Zsh):**
  ```bash
  PORT=8080 npm start
  ```

- **Windows PowerShell:**
  ```powershell
  $env:PORT="8080"; npm start
  ```

- **Windows Command Prompt (CMD):**
  ```cmd
  set PORT=8080 && npm start
  ```

---

### Tutorial 3: Running 24/7 in Background with PM2 (Recommended for Production / VPS)

For continuous operation on Linux/VPS servers with automatic restart on crashes or system reboots, use **PM2**:

#### 1. Install PM2 Globally
```bash
npm install -g pm2
```

#### 2. Start the Scraper Daemon
```bash
pm2 start server.js --name "tgju-scraper"
```

#### 3. Manage the Process
```bash
# View process status
pm2 status

# Inspect real-time server logs
pm2 logs tgju-scraper

# Restart the process
pm2 restart tgju-scraper

# Stop the process
pm2 stop tgju-scraper
```

#### 4. Configure Auto-start on System Reboot
```bash
pm2 save
pm2 startup
```

---

### Tutorial 4: Running with systemd on Ubuntu / Debian

Create a systemd service file:
```bash
sudo nano /etc/systemd/system/tgju-scraper.service
```

Paste the following configuration (replace `/path/to/chandshod` and `youruser` with your actual path and username):
```ini
[Unit]
Description=TGJU Rates & Crypto Engine Scraper
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/chandshod
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=1718

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable tgju-scraper
sudo systemctl start tgju-scraper
sudo systemctl status tgju-scraper
```

---

### Tutorial 5: Running with Docker

Create a `Dockerfile` in the root directory:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 1718
VOLUME ["/app/data"]
CMD ["node", "server.js"]
```

Build and run the container:
```bash
# Build the image
docker build -t chandshod .

# Run container with persistent data volume
docker run -d \
  --name chandshod \
  -p 1718:1718 \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  chandshod
```

---

### Tutorial 6: Building a Standalone Windows Executable (.exe)

You can package **Chand Shod?** into a standalone `.exe` that runs on any 64-bit Windows machine **without requiring Node.js or npm installed**:

#### 1. Compile the Executable
Run the built-in packaging command (targets the verified pre-built `node18-win-x64` binary to avoid source compilation errors on Windows):
```bash
npm run build:exe
```

Or run directly with `pkg`:
```bash
npx @yao-pkg/pkg . --targets node18-win-x64 --output dist/chand-shod.exe
```

#### 2. Running the Binary
- The output executable `dist/chand-shod.exe` contains the entire Node.js runtime, server backend, and embedded WebUI frontend.
- Simply double-click `chand-shod.exe` or execute it from PowerShell / Command Prompt.
- All persistent configuration files (`data/config.json`, `data/auth.json`, and rate snapshots) are automatically created and preserved in a `./data/` folder directly alongside the executable.
- Access the WebUI at:
  ```text
  http://localhost:1718
  ```

---

## 🔒 Security & Authentication

The engine features zero-dependency, production-grade security implemented with Node.js native `node:crypto`:

### 1. WebUI Password Protection
- **Default Password:** `admin`
- On first visit, a full-screen login prompt is presented.
- A yellow warning badge appears in the header whenever the default password (`admin`) is active.
- **Change Password:** Navigate to the **API Keys & Security** tab in the WebUI to update the password, or call `POST /api/auth/change-password` directly.
- Password hashes are computed using Node's cryptographic `scrypt` (`crypto.scryptSync(password, salt, 64)`) and verified using timing-safe comparisons (`crypto.timingSafeEqual`) to prevent side-channel timing attacks.

### 2. API Key Enforcement for `/api/rates`
All external consumers (Telegram bots, mobile apps, microservices, cron jobs) must provide a valid API key (`csk_...`) to access `/api/rates`.

API keys can be supplied via any of the following methods:
1. **HTTP Header (Recommended):** `X-API-Key: csk_...`
2. **Authorization Header:** `Authorization: Bearer csk_...`
3. **Query Parameter:** `?api_key=csk_...`

> 💡 **WebUI Session Bypass:** If you are accessing `/api/rates` from an authenticated browser session, the server automatically recognizes your `chandshod_session` cookie and grants access without needing a separate API key.

### 3. API Key Management
Manage access keys in the **API Keys & Security** dashboard tab:
- **Issue New Key:** Enter a label/description (e.g. `Telegram Rates Bot`) and click **Issue New Key**.
- **One-Time Secret Reveal:** Keys are generated with 192 bits of entropy (`csk_` prefix + 48 hex characters). The full key is displayed **once** in a modal for copying. Stored keys are hashed with SHA-256 for maximum security.
- **Revoke Key:** Instantly deactivate a key without losing historical request counts.
- **Delete Key:** Permanently remove a key record.

---

## 📡 REST API Reference

### 1. Get Exchange Rates (`GET /api/rates`)

Retrieves scraped financial rates. Requires an API key (or active WebUI session). By default, only items marked as `enabled` in the configuration/WebUI are returned.

```http
GET /api/rates
X-API-Key: csk_your_api_key_here
```

#### Query Parameters:
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `api_key` | string | `null` | API key (alternative to `X-API-Key` or `Bearer` header). |
| `all` | boolean | `false` | When `true`, returns all 71 items regardless of user toggle selections. |
| `category` | string | `null` | Filter by category: `fiat`, `crypto`, or `gold`. |
| `symbols` | string | `null` | Comma-separated list of symbols (e.g., `USD,BTC,GERAM18`). |
| `format` | string | `full` | If `simple`, returns a lightweight key-value mapping of `{ SYMBOL: price }`. |

#### Example: Standard Full Response (`format=full`)
```json
{
  "success": true,
  "updated_at_utc": "2026-10-25T02:24:41.000Z",
  "updated_at_tehran": "02:24:41",
  "stale": false,
  "unit": "toman",
  "count": 32,
  "rates": {
    "USD": {
      "code": "USD",
      "name": "دلار آمریکا",
      "name_en": "US Dollar",
      "category": "fiat",
      "toman": 268500,
      "rial": 2685000,
      "high": 269000,
      "low": 267800,
      "change": 500,
      "change_percent": 0.19,
      "direction": "high",
      "market_time": "2026-10-25 18:42:00",
      "unit": "toman"
    },
    "BTC": {
      "code": "BTC",
      "name": "بیت‌کوین",
      "name_en": "Bitcoin",
      "category": "crypto",
      "toman": 21434024200,
      "rial": 214340242000,
      "usd": 80397.69,
      "high": 21500000000,
      "low": 21200000000,
      "change": 40513800,
      "change_percent": 0.19,
      "direction": "high",
      "market_time": "2026-10-25 01:30:44",
      "unit": "toman"
    }
  }
}
```

#### Example: Simple Format Response (`format=simple`)
```http
GET /api/rates?symbols=USD,EUR,USDT,BTC,GERAM18&format=simple
```
```json
{
  "success": true,
  "updated_at_tehran": "02:24:41",
  "updated_at_utc": "2026-10-25T02:24:41.000Z",
  "stale": false,
  "unit": "toman",
  "count": 5,
  "rates": {
    "USD": 268500,
    "EUR": 300650,
    "USDT": 266496,
    "BTC": 21434024200,
    "GERAM18": 26063300
  }
}
```

---

### 2. Catalog of All Supported Items (`GET /api/items`)
Returns the complete list of 71 assets along with their English and Persian names, categories, and current enabled status.
```http
GET /api/items
```

---

### 3. Update Configuration & Toggles (`POST /api/config`)
Persists item output toggles, scrape intervals, and server parameters to `data/config.json`.

#### Toggle a Single Item:
```http
POST /api/config
Content-Type: application/json

{
  "itemCode": "GERAM24",
  "enabled": false
}
```

#### Bulk Update Multiple Items or Settings:
```http
POST /api/config
Content-Type: application/json

{
  "scrapeIntervalSeconds": 30,
  "autoScrape": true,
  "enabledItems": {
    "USD": true,
    "BTC": true,
    "GERAM18": true,
    "GERAM24": false
  }
}
```

---

### 4. Trigger Instant Manual Scrape (`POST /api/scrape`)
Forces an immediate on-demand fetch from TGJU outside of the background interval timer:
```http
POST /api/scrape
```

---

### 5. Engine Health & Status (`GET /api/status`)
```http
GET /api/status
```
Example response:
```json
{
  "success": true,
  "uptimeSeconds": 3600,
  "isFetching": false,
  "lastFetchedAtUtc": "2026-10-25T02:24:41.000Z",
  "lastFetchedAtTehran": "02:24:41",
  "fetchCount": 60,
  "successCount": 60,
  "failCount": 0,
  "stale": false,
  "totalRatesCount": 71,
  "scrapeIntervalSeconds": 60,
  "autoScrape": true
}
```

---

### 6. Real-time Log Stream (`GET /api/logs/stream`)
Connect via **Server-Sent Events (SSE)** to stream real-time scraping logs and rate update notifications.
```http
GET /api/logs/stream
```

---

## 💻 Integration Code Samples

### Python Example
```python
import requests

API_KEY = "csk_your_api_key_here"
headers = {"X-API-Key": API_KEY}

url = "http://localhost:1718/api/rates?symbols=USD,USDT,BTC,GERAM18&format=simple"
response = requests.get(url, headers=headers)
data = response.json()

if data.get("success"):
    rates = data.get("rates", {})
    print(f"US Dollar: {rates.get('USD'):,} Tomans")
    print(f"Tether (USDT): {rates.get('USDT'):,} Tomans")
    print(f"Bitcoin: {rates.get('BTC'):,} Tomans")
    print(f"18K Gold Gram: {rates.get('GERAM18'):,} Tomans")
```

### Node.js (Fetch API) Example
```javascript
const API_KEY = 'csk_your_api_key_here';

const res = await fetch('http://localhost:1718/api/rates?category=crypto', {
  headers: {
    'X-API-Key': API_KEY,
  },
});
const data = await res.json();

for (const [code, item] of Object.entries(data.rates)) {
  console.log(`${item.name_en} (${code}): ${item.toman?.toLocaleString()} Tomans | ${item.usd ? '$' + item.usd : ''}`);
}
```

### cURL Example
```bash
# Pass API key via header
curl -s -H "X-API-Key: csk_your_api_key_here" \
  "http://localhost:1718/api/rates?symbols=USD,EUR,BTC,GERAM18" | jq .

# Or pass via query parameter
curl -s "http://localhost:1718/api/rates?api_key=csk_your_api_key_here&format=simple" | jq .
```

---

## 🛡 Credits & License
- **Built by:** Genie ([@actually-genius](https://github.com/actually-genius))
- **Special thanks to:** V0R3X ([@V0R3X](https://t.me/V0R3X))

Distributed under the MIT License.
