# راهنمای موتور نرخ‌های چند شد؟ (Chand Shod? — TGJU Rates & Crypto Engine) 🚀

یک موتور جامع و مدرن بر پایه‌ی **Node.js** جهت استخراج (Scraping) نرخ لحظه‌ای طلا، سکه، ارزهای فیات و رمز ارزها از شبکه **TGJU** (شبکه اطلاع‌رسانی طلا، سکه و ارز - tgju.org) همراه با وب‌سرویس RESTful و رابط کاربری وب (WebUI) تعاملی، سیستم لاگ زنده (SSE) و قابلیت فیلتر و شخصی‌سازی داده‌های خروجی.

این پروژه به منظور استخراج بی‌وقفه داده‌های بازارهای مالی ایران طراحی شده و قابلیت‌های متعددی از جمله پشتیبانی کامل از رمز ارزها، محاسبه نرخ‌های دلاری و تومانی، مدیریت حباب سکه، مدیریت دسترسی با کلیدهای API و تفکیک انواع «گِرم» را فراهم کرده است.

> 🇬🇧 **English Documentation:** For the English version, please refer to [README.md](README.md).

---

## 🌟 ویژگی‌های کلیدی

1. **استخراج لحظه‌ای و پایدار از TGJU:**
   - اتصال مستقیم به اندپوینت‌های اصلی AJAX شبکه TGJU (`https://call4.tgju.org/ajax.json`).
   - ارسال هدرهای استاندارد مرورگر (`User-Agent`، `Referer`، `X-Requested-With`) به منظور شبیه‌سازی درخواست‌های معتبر.
   - پایداری در برابر قطعی با کش هوشمند و ارسال فلگ `stale: true` هنگام بروز خطاهای شبکه.

2. **پشتیبانی جامع از بیش از ۷۰ دارایی مالی:**
   - **ارزهای فیات:** دلار بازار آزاد تهران، یورو، پوند، درهم امارات، لیر ترکیه، یوان چین، دلار کانادا، فرانک، روبل و ارزهای منطقه‌ای (دینار، افغانی، درام، منات و...).
   - **رمز ارزها (Crypto):** بیت‌کوین (BTC)، اتریوم (ETH)، تتر (USDT)، سولانا (SOL)، ترون (TRON / TRX)، دوج‌کوین (DOGE)، تون‌کوین / گرام قدیم (TON)، بایننس کوین (BNB)، ریپل (XRP)، کاردانو (ADA) و توکن‌های طلا (PAXG، XAUT).
   - **طلا و فلزات گرانبها:** طلای ۱۸ عیار، طلای ۲۴ عیار، مثقال، طلای آبشده نقدی عمده، طلای دست دوم، انس جهانی طلا، انس نقره، نقره ۹۹۹، پلاتین و پالادیوم.
   - **سکه‌ها و حباب قیمتی:** سکه امامی، سکه بهار آزادی، نیم سکه، ربع سکه، انواع تک‌فروشی و حباب‌های قیمتی هر سکه.

3. **ارزیابی دوگانه ارزهای دیجیتال (Dual-Denomination):**
   - استخراج همزمان نرخ تومانی و نرخ جهانی دلاری رمز ارزها در یک قالب ساختاریافته.

4. **مدیریت و تفکیک اختصاصی انواع «گِرم» (طلا، سکه، و هر ۳ توکن کریپتو):**
   - در بازار طلا، سکه و سایت TGJU عنوان «گِرم» به دارایی‌های متفاوتی در سه دسته مجزا اطلاق می‌شود:
     - **طلای خام و شمش:** `GERAM18` (هر گرم طلای ۱۸ عیار) و `GERAM24` (هر گرم طلای ۲۴ عیار خالص).
     - **سکه‌های ضرب‌شده:** `GERAMI` (سکه گرمی بانک مرکزی) و `RETAIL_GERAMI` (سکه گرمی تک‌فروشی).
     - **هر ۳ توکن کریپتو گرام در TGJU:**
       - `GRAM1`: توکن گرام ردیف ۱ جدول کریپتو TGJU (شناسه ۱۷۶۴۲۷۹ - گرام پریو. تُن‌کوین)
       - `GRAM2`: توکن گرام ردیف ۲ جدول کریپتو TGJU (شناسه ۱۷۶۴۲۹۳ - گرام پریو.تُن‌کوین)
       - `TON`: توکن تون‌کوین / گرام ردیف ۳ جدول کریپتو TGJU (شناسه ۷۶۴۶۳۷ - TON تلگرام)
       - `GRAM_CRYPTO`: نام مستعار عمومی معادل گرام شماره ۱
     کاربر می‌تواند در پنل وب و داشبورد، هر یک از این موارد را به تفکیک فعال یا غیرفعال کند تا فقط موارد مدنظر در خروجی API ارسال شوند.

5. **رابط کاربری تعاملی (WebUI Dashboard):**
   - طراحی واکنش‌گرا با دو حالت تیره و روشن.
   - کلیدهای سوییچ (Toggle) اختصاصی برای تک‌تک آیتم‌ها و ذخیره دائمی انتخاب‌ها در `data/config.json`.
   - کنسول تست زنده API با قابلیت انتخاب پارامترها و کپی خروجی JSON.
   - کنسول ترمینال لاگ‌های زنده با استفاده از **Server-Sent Events (SSE)** بدون نیاز به رفرش صفحه.

---

## 📂 ساختار پروژه

```text
chandshod/
├── data/
│   ├── config.json          # پیکربندی پایدار و انتخاب‌های فعال/غیرفعال آیتم‌ها
│   └── auth.json            # هش رمز عبور و دایجست کلیدهای دسترسی API
├── public/                  # دارایی‌های رابط کاربری وب (WebUI)
│   ├── index.html           # ساختار داشبورد و کامپوننت‌های تعاملی
│   ├── styles.css           # استایل‌های مدرن CSS، متغیرهای تم و ریسپانسیو
│   └── app.js               # منطق کلاینت، اتصال SSE و تعامل با API
├── services/
│   ├── auth.js              # سیستم احراز هویت و مدیریت کلیدهای API
│   ├── config.js            # تعریف متادیتا و کاتالوگ جامع دارایی‌ها (Master Items)
│   ├── logger.js            # مدیریت لاگ‌های درون‌حافظه‌ای و زمان محلی تهران (UTC+03:30)
│   └── scraper.js           # موتور هسته اسکرپر، پارس کردن مقادیر و زمان‌بندی دوره‌ای
├── package.json             # تعاریف پکیج، اسکریپت‌ها و وابستگی‌ها (Express, Cors)
├── server.js                # سرور Express و تعریف اندپوینت‌های REST و SSE
├── README.md                # مستندات انگلیسی
└── readme_fa.md             # مستندات فارسی
```

---

## 🛠 آموزش گام‌به‌گام راه‌اندازی و اجرای سرور

### روش ۱: اجرای مستقیم با Node.js

#### ۱. پیش‌نیازها
- نصب **Node.js** نسخه 18 یا بالاتر. برای بررسی نسخه نصب‌شده:
  ```bash
  node -v
  npm -v
  ```

#### ۲. نصب وابستگی‌ها
در پوشه پروژه دستور زیر را وارد کنید:
```bash
npm install
```

#### ۳. اجرای سرور
```bash
# اجرای استاندارد
npm start

# یا اجرای مستقیم فایل
node server.js

# یا حالت توسعه با ریلود خودکار هنگام تغییر فایل‌ها
npm run dev
```

پس از اجرا، پیام زیر در ترمینال نمایش داده می‌شود:
```text
[INFO] TGJU Scraper API & WebUI running at http://localhost:1718
[INFO] Starting background scraper loop (interval: 60s)
[INFO] Fetching rates from TGJU: https://call4.tgju.org/ajax.json
[SUCCESS] Fetch succeeded (660ms, 71 items)
```

اکنون می‌توانید آدرس زیر را در مرورگر باز کنید:
```text
http://localhost:1718
```

---

### روش ۲: تغییر پورت پیش‌فرض (Port Configuration)
به طور پیش‌فرض سرور روی پورت `1718` اجرا می‌شود. برای تغییر آن:

- **در لینوکس / مک (Linux/macOS):**
  ```bash
  PORT=8080 npm start
  ```

- **در ویندوز PowerShell:**
  ```powershell
  $env:PORT="8080"; npm start
  ```

- **در ویندوز CMD:**
  ```cmd
  set PORT=8080 && npm start
  ```

---

### روش ۳: اجرای مداوم در پس‌زمینه با PM2 (پیشنهادی برای سرور و لینوکس)
برای اینکه سرور به صورت ۲۴ ساعته در پس‌زمینه اجرا شود و در صورت ری‌استارت سیستم یا بروز خطا خودکار راه‌اندازی مجدد گردد، از ابزار **PM2** استفاده کنید:

```bash
# ۱. نصب PM2 به صورت سراسری
npm install -g pm2

# ۲. اجرای پروژه تحت مدیریت PM2
pm2 start server.js --name "tgju-scraper"

# ۳. مشاهده وضعیت سرویس
pm2 status

# ۴. مشاهده لاگ‌های زنده
pm2 logs tgju-scraper

# ۵. ذخیره سرویس برای اجرا پس از ریبوت سرور
pm2 save
pm2 startup
```

---

### روش ۴: اجرا با Docker

می‌توانید به راحتی یک `Dockerfile` ایجاد کرده و پروژه را در کانتینر ایزوله اجرا کنید:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 1718
CMD ["node", "server.js"]
```

ساخت و اجرای کانتینر:
```bash
docker build -t chandshod .
docker run -d -p 1718:1718 --name chandshod-app -v $(pwd)/data:/app/data chandshod
```

---

### روش ۵: ساخت فایل اجرایی مستقل ویندوز (Standalone .exe)

شما می‌توانید کل پروژه را به یک فایل اجرایی مستقل `.exe` بدون نیاز به نصب بودن Node.js یا npm در سیستم مقصد تبدیل کنید:

#### ۱. کامپایل و خروجی گرفتن:
دستور ساخت فایل اجرایی مستقل ویندوز (هدف‌گذاری روی باینری آماده `node18-win-x64` جهت جلوگیری از خطای کامپایل سورس در ویندوز):
```bash
npm run build:exe
```
یا اجرای مستقیم:
```bash
npx @yao-pkg/pkg . --targets node18-win-x64 --output dist/chand-shod.exe
```

#### ۲. اجرا و نگهداری داده‌ها:
- فایل خروجی در مسیر `dist/chand-shod.exe` شامل تمام موتور Node.js، سرور Express و رابط کاربری WebUI به صورت تعبیه‌شده است.
- با دوبار کلیک روی `chand-shod.exe`، سرور در پورت `1718` اجرا شده و پوشه `data/` برای ذخیره دائمی کلیدهای API و تنظیمات به صورت خودکار در کنار فایل `.exe` ایجاد می‌گردد.
- دسترسی به داشبورد:
  ```text
  http://localhost:1718
  ```

---

## 🔒 امنیت و احراز هویت (Security & API Keys)

این سیستم مجهز به لایه امنیتی داخلی بر پایه کتابخانه بومی `node:crypto` بدون نیاز به پکیج‌های خارجی است:

### ۱. حفاظت از داشبورد با رمز عبور (WebUI Password)
- **رمز عبور پیش‌فرض:** `admin`
- در اولین ورود، صفحه لاگین به کاربر نمایش داده می‌شود.
- در صورت فعال بودن رمز پیش‌فرض (`admin`)، یک برچسب هشدار زرد رنگ در هدر نمایش داده می‌شود.
- **تغییر رمز عبور:** از تب **API Keys & Security** در داشبورد یا فراخوانی متد `POST /api/auth/change-password` می‌توانید رمز عبور را تغییر دهید.
- رمزهای عبور با الگوریتم امنیتی `scrypt` با سالت ۱۶ بایتی تصادفی هش شده و به صورت ضد حملات زمانی (`timingSafeEqual`) اعتبارسنجی می‌شوند.

### ۲. الزام کلید API برای استفاده از `/api/rates`
تمام کلاینت‌های خارجی (ربات‌های تلگرام، اپلیکیشن‌های موبایل، مایکروسرویس‌ها و اسکریپت‌ها) برای فراخوانی اندپوینت `/api/rates` موظف به ارائه کلید معتبر (`csk_...`) هستند.

کلید API را به یکی از روش‌های زیر می‌توانید ارسال کنید:
1. **هدر اختصاصی (پیشنهادی):** `X-API-Key: csk_...`
2. **هدر احراز هویت استاندار:** `Authorization: Bearer csk_...`
3. **پارامتر کوئری:** `?api_key=csk_...`

> 💡 **ورود خودکار مرورگر:** در صورتی که در داشبورد وارد (Login) شده باشید، درخواست‌های مرورگر از طریق کوکی امن `chandshod_session` شناسایی شده و نیازی به وارد کردن دستی کلید در تست‌ها ندارید.

### ۳. مدیریت کلیدهای API
در تب **API Keys & Security**:
- **صدور کلید جدید:** نام یا برچسب سرویس (مثلاً `Telegram Rates Bot`) را وارد کرده و دکمه **Issue New Key** را بزنید.
- **نمایش یک‌باره کلید:** کلید اصلی به صورت کامل یک بار نمایش داده می‌شود. در دیتابیس صرفاً هش SHA-256 آن ذخیره می‌گردد.
- **غیرفعال‌سازی (Revoke):** بدون حذف تاریخچه و شمارنده درخواست‌ها، دسترسی کلید مسدود می‌شود.
- **حذف دائم (Delete):** کلید به صورت دائمی از سامانه حذف می‌گردد.

---

## 📡 مستندات وب‌سرویس (REST API)

### ۱. دریافت نرخ‌ها (`GET /api/rates`)

این اندپوینت نرخ‌های استخراج شده را بازمی‌گرداند. نیازمند کلید API یا نشست فعال داشبورد است. به صورت پیش‌فرض تنها آیتم‌هایی که در تنظیمات فعال شده‌اند بازگردانده می‌شوند.

```http
GET /api/rates
X-API-Key: csk_your_api_key_here
```

#### پارامترهای اختیاری Query:
| پارامتر | نوع | پیش‌فرض | توضیحات |
| :--- | :--- | :--- | :--- |
| `api_key` | string | - | کلید API (جایگزین هدر X-API-Key). |
| `all` | boolean | `false` | در صورت `true`، تمام ۷۱ آیتم حتی اگر در پنل غیرفعال باشند برگردانده می‌شوند. |
| `category` | string | - | فیلتر بر اساس دسته‌بندی: `fiat`، `crypto`، `gold`. |
| `symbols` | string | - | لیست کدهای جدا شده با ویرگول (مثال: `USD,BTC,GERAM18`). |
| `format` | string | `full` | اگر `simple` باشد، تنها یک شیء ساده از `SYMBOL: price` برمی‌گردد. |

#### نمونه پاسخ کامل (`format=full`):
```json
{
  "success": true,
  "timestamp": "2026-10-25T02:24:41.000Z",
  "tehranTime": "02:24:41",
  "stale": false,
  "summary": "02:24:41  USD 268,500 · EUR 300,650 · USDT 266,496 · BTC 21,434,024,200 · GERAM18 26,063,300 · SEKEE 264,460,000",
  "count": 32,
  "rates": {
    "USD": {
      "code": "USD",
      "key": "price_dollar_rl",
      "name": "دلار آمریکا",
      "nameEn": "US Dollar",
      "category": "fiat",
      "toman": 268500,
      "rial": 2685000,
      "high": 269000,
      "low": 267800,
      "change": 500,
      "changePercent": 0.19,
      "updatedAt": "18:42",
      "status": "high",
      "unit": "toman",
      "stale": false
    },
    "BTC": {
      "code": "BTC",
      "key": "crypto-bitcoin-irr",
      "name": "بیت‌کوین",
      "nameEn": "Bitcoin",
      "category": "crypto",
      "toman": 21434024200,
      "rial": 214340242000,
      "usd": 79828.7,
      "high": 21500000000,
      "low": 21200000000,
      "change": 120000000,
      "changePercent": 0.56,
      "updatedAt": "02:24",
      "status": "high",
      "unit": "toman",
      "stale": false
    }
  }
}
```

#### نمونه پاسخ ساده (`format=simple`):
```http
GET /api/rates?symbols=USD,EUR,USDT,BTC,GERAM18&format=simple
```
```json
{
  "success": true,
  "tehranTime": "02:24:41",
  "stale": false,
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

### ۲. فهرست کامل آیتم‌ها و وضعیت ارسال (`GET /api/items`)
تمام آیتم‌های قابل استخراج را همراه با نام فارسی/انگلیسی، دسته‌بندی و وضعیت فعال/غیرفعال بودن برمی‌گرداند.
```http
GET /api/items
```

---

### ۳. تغییر تنظیمات و فعال/غیرفعال‌سازی آیتم‌ها (`POST /api/config`)
انتخاب‌های کاربر را در فایل `data/config.json` ذخیره می‌کند.

#### فعال/غیرفعال کردن یک آیتم خاص:
```json
POST /api/config
Content-Type: application/json

{
  "itemCode": "GERAM24",
  "enabled": false
}
```

#### فعال/غیرفعال کردن دسته‌ای یا تغییر بازه زمانی:
```json
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

### ۴. استخراج فوری دستی (`POST /api/scrape`)
درخواست یک واکشی آنی از TGJU خارج از زمان‌بندی خودکار:
```http
POST /api/scrape
```

---

### ۵. بررسی وضعیت و سلامت سرور (`GET /api/status`)
```http
GET /api/status
```

---

### ۶. کنسول لاگ‌ها و جریان رویدادها (`GET /api/logs/stream`)
اتصال از نوع **Server-Sent Events (SSE)** برای دریافت زنده لاگ‌ها و بروزرسانی لحظه‌ای نرخ‌ها در کلاینت‌های وب یا اسکریپت‌های نظارتی.
```http
GET /api/logs/stream
```

---

## 💻 نمونه کدهای اتصال به وب‌سرویس

### نمونه Python:
```python
import requests

API_KEY = "csk_your_api_key_here"
headers = {"X-API-Key": API_KEY}

url = "http://localhost:1718/api/rates?symbols=USD,USDT,BTC,GERAM18&format=simple"
response = requests.get(url, headers=headers)
data = response.json()

if data.get("success"):
    rates = data.get("rates", {})
    print(f"دلار: {rates.get('USD'):,} تومان")
    print(f"تتر: {rates.get('USDT'):,} تومان")
    print(f"بیت‌کوین: {rates.get('BTC'):,} تومان")
    print(f"گرم ۱۸ عیار: {rates.get('GERAM18'):,} تومان")
```

### نمونه Node.js / JavaScript:
```javascript
const API_KEY = 'csk_your_api_key_here';

const res = await fetch('http://localhost:1718/api/rates?category=crypto', {
  headers: {
    'X-API-Key': API_KEY,
  },
});
const data = await res.json();

for (const [code, item] of Object.entries(data.rates)) {
  console.log(`${item.name} (${code}): ${item.toman?.toLocaleString()} تومان | ${item.usd ? '$' + item.usd : ''}`);
}
```

### نمونه cURL:
```bash
# ارسال از طریق هدر
curl -s -H "X-API-Key: csk_your_api_key_here" \
  "http://localhost:1718/api/rates?symbols=USD,EUR,BTC,GERAM18" | jq .

# ارسال از طریق Query Parameter
curl -s "http://localhost:1718/api/rates?api_key=csk_your_api_key_here&format=simple" | jq .
```

---

## 🛡 سازندگان و مجوز
- **توسعه‌دهنده:** Genie ([@actually-genius](https://github.com/actually-genius))
- **تشکر ویژه از:** V0R3X ([@V0R3X](https://t.me/V0R3X))

منتشر شده تحت مجوز MIT.
