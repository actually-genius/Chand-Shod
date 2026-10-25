import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EventEmitter } from 'node:events';
import { configService, MASTER_ITEMS } from './config.js';
import { logger } from './logger.js';

const isPackaged = typeof process.pkg !== 'undefined' || Boolean(process.env.CAXA);
const ROOT_DIR = isPackaged ? process.cwd() : path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const LATEST_RATES_FILE = path.join(DATA_DIR, 'latest-rates.json');

const FALLBACK_GRAM_TOKENS = {
  GRAM1: { usd: 1.65, rial: 4398900, toman: 439890, rowId: '1764279' },
  GRAM2: { usd: 1.25, rial: 3332500, toman: 333250, rowId: '1764293' },
  TON:   { usd: 1.64, rial: 4372200, toman: 437220, rowId: '764637' },
};

export class ScraperService extends EventEmitter {
  constructor() {
    super();
    this.lastRates = {};
    this.cryptoGramTokens = { ...FALLBACK_GRAM_TOKENS };
    this.stale = true;
    this.lastFetchedAt = null;
    this.lastFetchedAtTehran = null;
    this.lastError = null;
    this.timer = null;
    this.isFetching = false;
    this.fetchCount = 0;
    this.successCount = 0;
    this.failCount = 0;

    // Load any existing snapshot on startup
    this.loadCachedSnapshot();
  }

  loadCachedSnapshot() {
    try {
      if (fs.existsSync(LATEST_RATES_FILE)) {
        const raw = fs.readFileSync(LATEST_RATES_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data && data.rates) {
          this.lastRates = data.rates;
          this.stale = data.stale !== undefined ? data.stale : true;
          this.lastFetchedAt = data.fetched_at_utc ? new Date(data.fetched_at_utc) : null;
          this.lastFetchedAtTehran = data.fetched_at_tehran || null;
          logger.info(`Loaded cached rates snapshot with ${Object.keys(this.lastRates).length} items`);
        }
      }
    } catch (err) {
      logger.warn(`Could not load cached snapshot: ${err.message}`);
    }
  }

  saveSnapshot() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmp = `${LATEST_RATES_FILE}.tmp`;
      const payload = {
        fetched_at_utc: this.lastFetchedAt ? this.lastFetchedAt.toISOString() : null,
        fetched_at_tehran: this.lastFetchedAtTehran,
        unit: 'toman',
        stale: this.stale,
        count: Object.keys(this.lastRates).length,
        rates: this.lastRates,
      };
      fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tmp, LATEST_RATES_FILE);
    } catch (err) {
      logger.error(`Failed to save latest rates snapshot: ${err.message}`);
    }
  }

  /**
   * Main fetch function - core scraping engine for market rates
   */
  async fetch() {
    if (this.isFetching) {
      logger.info('Scrape already in progress, skipping overlapping call');
      return this.lastRates;
    }

    this.isFetching = true;
    this.fetchCount++;
    const startedAt = Date.now();
    const config = configService.getConfig();
    const url = config.tgjuUrl || 'https://call4.tgju.org/ajax.json';
    const timeout = (config.timeoutSeconds || 15) * 1000;

    logger.info(`Fetching rates from TGJU: ${url}`);

    try {
      // Fetch TGJU ajax.json and crypto Gram tokens from tgju.org/crypto in parallel
      const cryptoGramPromise = fetch('https://www.tgju.org/crypto', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(Math.min(timeout, 8000)),
      })
        .then(async (res) => {
          if (!res.ok) return null;
          const html = await res.text();
          const parsed = {};
          const rows = [
            { rowId: '1764279', code: 'GRAM1' },
            { rowId: '1764293', code: 'GRAM2' },
            { rowId: '764637',  code: 'TON' },
          ];
          for (const r of rows) {
            const idx = html.indexOf(`data-market-row="${r.rowId}"`);
            if (idx === -1) continue;
            const end = html.indexOf('</tr>', idx);
            const rowHtml = html.slice(idx, end);
            const pMatch = rowHtml.match(/data-market-name="p">([^<]+)/);
            const irrMatch = rowHtml.match(/data-market-p="[^"]*"\s*>\s*([^<]+)/);
            const usd = pMatch ? parseFloat(pMatch[1].replace(/,/g, '').trim()) : null;
            const rial = irrMatch ? parseInt(irrMatch[1].replace(/,/g, '').trim(), 10) : null;
            const toman = rial ? Math.floor(rial / 10) : null;
            if (usd !== null || toman !== null) {
              parsed[r.code] = { usd, rial, toman, rowId: r.rowId };
            }
          }
          return parsed;
        })
        .catch(() => null);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://www.tgju.org/',
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const current = json?.current || {};

      // Verification check: verify "USD" is present in out (price_dollar_rl)
      if (!current.price_dollar_rl) {
        throw new Error('Invalid TGJU response: price_dollar_rl missing from current object');
      }

      // Update live crypto Gram tokens if crypto page responded
      const liveGrams = await cryptoGramPromise;
      if (liveGrams) {
        if (liveGrams.GRAM1) this.cryptoGramTokens.GRAM1 = liveGrams.GRAM1;
        if (liveGrams.GRAM2) this.cryptoGramTokens.GRAM2 = liveGrams.GRAM2;
        if (liveGrams.TON) this.cryptoGramTokens.TON = liveGrams.TON;
      }

      const parsedRates = {};

      for (const item of MASTER_ITEMS) {
        // Special handler for the distinct crypto Gram tokens extracted from TGJU crypto table
        if (item.code === 'GRAM1' || item.code === 'GRAM_CRYPTO') {
          const g = this.cryptoGramTokens.GRAM1 || FALLBACK_GRAM_TOKENS.GRAM1;
          parsedRates[item.code] = {
            code: item.code,
            name: item.name,
            name_en: item.nameEn,
            category: item.category,
            subgroup: item.subgroup || null,
            unit: item.unit,
            toman: g.toman,
            rial: g.rial,
            usd: g.usd,
            change: 0,
            change_percent: 0,
            direction: '',
            high: null,
            low: null,
            market_time: this.lastFetchedAtTehran || '',
            market_time_fa: 'لحظه‌ای کریپتو',
            market_time_en: 'Live Crypto',
          };
          continue;
        }

        if (item.code === 'GRAM2') {
          const g = this.cryptoGramTokens.GRAM2 || FALLBACK_GRAM_TOKENS.GRAM2;
          parsedRates.GRAM2 = {
            code: 'GRAM2',
            name: item.name,
            name_en: item.nameEn,
            category: item.category,
            subgroup: item.subgroup || null,
            unit: item.unit,
            toman: g.toman,
            rial: g.rial,
            usd: g.usd,
            change: 0,
            change_percent: 0,
            direction: '',
            high: null,
            low: null,
            market_time: this.lastFetchedAtTehran || '',
            market_time_fa: 'لحظه‌ای کریپتو',
            market_time_en: 'Live Crypto',
          };
          continue;
        }

        const node = current[item.key];
        if (!node || node.p === undefined || node.p === null) {
          // If TON is missing from current node, fallback to liveGramTokens.TON
          if (item.code === 'TON' && this.cryptoGramTokens.TON) {
            const g = this.cryptoGramTokens.TON;
            parsedRates.TON = {
              code: 'TON',
              name: item.name,
              name_en: item.nameEn,
              category: item.category,
              subgroup: item.subgroup || null,
              unit: item.unit,
              toman: g.toman,
              rial: g.rial,
              usd: g.usd,
              change: 0,
              change_percent: 0,
              direction: '',
              high: null,
              low: null,
              market_time: '',
              market_time_fa: '',
              market_time_en: '',
            };
          }
          continue;
        }

        const rawP = String(node.p || '').replace(/,/g, '').trim();
        if (!rawP) continue;

        let toman = null;
        let rial = null;
        let usd = null;

        if (item.unit === 'usd') {
          // Pure USD items (like ONS, Silver ounce, etc.)
          const floatVal = parseFloat(rawP);
          if (!isNaN(floatVal)) {
            usd = floatVal;
          }
        } else {
          // Standard IRR items -> converted to Toman by Math.floor(rial / 10)
          const num = parseInt(rawP, 10);
          if (!isNaN(num)) {
            rial = num;
            toman = Math.floor(num / 10);
          }
        }

        // For cryptos with secondary USD key
        if (item.usdKey && current[item.usdKey]) {
          const usdNode = current[item.usdKey];
          const rawUsd = String(usdNode.p || '').replace(/,/g, '').trim();
          const floatUsd = parseFloat(rawUsd);
          if (!isNaN(floatUsd)) {
            usd = floatUsd;
          }
        }

        // Change values
        const rawChange = String(node.d || '0').replace(/,/g, '').trim();
        const changeRial = parseInt(rawChange, 10) || 0;
        const changeToman = item.unit === 'usd' ? parseFloat(rawChange) || 0 : Math.floor(changeRial / 10);
        const changePercent = parseFloat(node.dp) || 0;

        // High / Low
        let highToman = null;
        let lowToman = null;
        if (node.h) {
          const rawH = String(node.h).replace(/,/g, '').trim();
          highToman = item.unit === 'usd' ? parseFloat(rawH) : Math.floor(parseInt(rawH, 10) / 10);
        }
        if (node.l) {
          const rawL = String(node.l).replace(/,/g, '').trim();
          lowToman = item.unit === 'usd' ? parseFloat(rawL) : Math.floor(parseInt(rawL, 10) / 10);
        }

        parsedRates[item.code] = {
          code: item.code,
          name: item.name,
          name_en: item.nameEn,
          category: item.category,
          subgroup: item.subgroup || null,
          unit: item.unit,
          toman,
          rial,
          usd,
          change: changeToman,
          change_percent: changePercent,
          direction: node.dt || '',
          high: highToman,
          low: lowToman,
          market_time: node.ts || '',
          market_time_fa: node.t || '',
          market_time_en: node.t_en || '',
        };
      }

      if (!parsedRates.USD) {
        throw new Error('no dollar in the answer');
      }

      const elapsed = Date.now() - startedAt;
      this.lastRates = parsedRates;
      this.stale = false;
      this.lastFetchedAt = new Date();
      this.lastFetchedAtTehran = logger.getTehranTime(this.lastFetchedAt);
      this.lastError = null;
      this.successCount++;

      this.saveSnapshot();

      // Print formatted summary line
      const lineSummary = this.formatSummaryLine(this.lastRates, false);
      logger.success(`Fetch succeeded (${elapsed}ms, ${Object.keys(this.lastRates).length} items): ${lineSummary}`);

      this.emit('ratesUpdated', {
        rates: this.lastRates,
        stale: false,
        updatedAt: this.lastFetchedAt,
        timeTehran: this.lastFetchedAtTehran,
      });

      return this.lastRates;
    } catch (err) {
      this.failCount++;
      this.lastError = err.message;
      this.stale = true;
      logger.error(`Fetch failed: ${err.message}`);

      if (Object.keys(this.lastRates).length > 0) {
        const staleSummary = this.formatSummaryLine(this.lastRates, true);
        logger.warn(`Retaining previous rates (marked stale): ${staleSummary}`);
      }

      this.emit('scrapeError', {
        error: err.message,
        rates: this.lastRates,
        stale: true,
      });

      return this.lastRates;
    } finally {
      this.isFetching = false;
    }
  }

  formatSummaryLine(rates, isStale) {
    const stamp = this.lastFetchedAtTehran || logger.getTehranTime();
    const codes = ['USD', 'EUR', 'USDT', 'BTC', 'GERAM18', 'SEKEE'];
    const parts = [];
    for (const code of codes) {
      const r = rates[code];
      if (r && r.toman !== null && r.toman !== undefined) {
        parts.push(`${code} ${r.toman.toLocaleString('en-US')}`);
      }
    }
    return `${stamp}  ${parts.join(' · ')}${isStale ? '  (stale)' : ''}`;
  }

  start() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    const config = configService.getConfig();
    const intervalSec = config.scrapeIntervalSeconds || 60;

    logger.info(`Starting background scraper loop (interval: ${intervalSec}s)`);

    // Initial fetch immediately
    this.fetch();

    this.timer = setInterval(() => {
      const currentConfig = configService.getConfig();
      if (currentConfig.autoScrape !== false) {
        this.fetch();
      }
    }, intervalSec * 1000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('Background scraper stopped');
    }
  }

  restart() {
    this.stop();
    this.start();
  }

  getRates(options = {}) {
    const { all = false, category = null, symbols = null, format = 'full' } = options;
    const config = configService.getConfig();
    const enabledMap = config.enabledItems || {};

    let targetItems = MASTER_ITEMS;

    // Filter by symbols if provided
    if (symbols) {
      const symbolList = symbols.split(',').map((s) => s.trim().toUpperCase());
      targetItems = targetItems.filter((i) => symbolList.includes(i.code));
    }

    // Filter by category if provided
    if (category) {
      const catList = category.split(',').map((c) => c.trim().toLowerCase());
      targetItems = targetItems.filter((i) => catList.includes(i.category.toLowerCase()));
    }

    // Filter by enabled state unless all=true was requested
    if (!all && !symbols) {
      targetItems = targetItems.filter((i) => enabledMap[i.code] === true);
    }

    const result = {};
    for (const item of targetItems) {
      const rate = this.lastRates[item.code];
      if (rate) {
        if (format === 'simple') {
          result[item.code] = rate.toman !== null ? rate.toman : rate.usd;
        } else {
          result[item.code] = rate;
        }
      }
    }

    return {
      success: true,
      stale: this.stale,
      unit: 'toman',
      updated_at_utc: this.lastFetchedAt ? this.lastFetchedAt.toISOString() : null,
      updated_at_tehran: this.lastFetchedAtTehran,
      count: Object.keys(result).length,
      rates: result,
    };
  }

  getStatus() {
    const config = configService.getConfig();
    return {
      isFetching: this.isFetching,
      stale: this.stale,
      lastFetchedAtUtc: this.lastFetchedAt ? this.lastFetchedAt.toISOString() : null,
      lastFetchedAtTehran: this.lastFetchedAtTehran,
      lastError: this.lastError,
      fetchCount: this.fetchCount,
      successCount: this.successCount,
      failCount: this.failCount,
      totalRatesCount: Object.keys(this.lastRates).length,
      scrapeIntervalSeconds: config.scrapeIntervalSeconds,
      autoScrape: config.autoScrape,
      tgjuUrl: config.tgjuUrl,
    };
  }
}

export const scraperService = new ScraperService();
