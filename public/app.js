/**
 * Chand Shod? — Real-time Financial Rates & Crypto Engine Client
 */

const state = {
  items: [],
  rates: {},
  config: {},
  logs: [],
  activeCategory: 'all',
  searchQuery: '',
  logFilter: 'all',
  autoScrollLogs: true,
  status: 'connecting',
  authenticated: false,
  isDefaultPassword: true,
  apiKeys: [],
  activeRawKeys: {},
  eventSource: null,
};

// ==========================================
// Clocks
// ==========================================
function updateClocks() {
  const now = new Date();

  // UTC
  const pad = (n) => String(n).padStart(2, '0');
  const utcHours = pad(now.getUTCHours());
  const utcMins = pad(now.getUTCMinutes());
  const utcSecs = pad(now.getUTCSeconds());
  const clockUtc = document.getElementById('clock-utc');
  if (clockUtc) clockUtc.textContent = `${utcHours}:${utcMins}:${utcSecs}`;

  // Tehran (UTC+03:30)
  const tehranOffsetMs = (3 * 60 + 30) * 60 * 1000;
  const tehranDate = new Date(now.getTime() + now.getTimezoneOffset() * 60 * 1000 + tehranOffsetMs);
  const tehHours = pad(tehranDate.getHours());
  const tehMins = pad(tehranDate.getMinutes());
  const tehSecs = pad(tehranDate.getSeconds());
  const clockTehran = document.getElementById('clock-tehran');
  if (clockTehran) clockTehran.textContent = `${tehHours}:${tehMins}:${tehSecs}`;
}
setInterval(updateClocks, 1000);
updateClocks();

// ==========================================
// Toast Notification
// ==========================================
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

// ==========================================
// Theme Toggle & Brand Reload
// ==========================================
function updateThemeUI(theme) {
  const isLight = theme === 'light';
  if (isLight) {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }

  document.querySelectorAll('.theme-toggle-btn').forEach((btn) => {
    const sunIcon = btn.querySelector('.sun-icon');
    const moonIcon = btn.querySelector('.moon-icon');
    if (sunIcon) sunIcon.classList.toggle('hidden', isLight);
    if (moonIcon) moonIcon.classList.toggle('hidden', !isLight);
    btn.title = isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode';
    btn.setAttribute('aria-label', isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode');
  });
}

function initTheme() {
  const savedTheme = localStorage.getItem('tgju_theme') || 'dark';
  updateThemeUI(savedTheme);

  document.querySelectorAll('.theme-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentIsLight = document.body.classList.contains('light-theme');
      const newTheme = currentIsLight ? 'dark' : 'light';
      localStorage.setItem('tgju_theme', newTheme);
      updateThemeUI(newTheme);
    });
  });
}
initTheme();

// Reload site when clicking logo / brand title
document.getElementById('brand-reload')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.reload();
});

// ==========================================
// Tab Switching
// ==========================================
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));

    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');
  });
});

// ==========================================
// SSE Real-Time Connection
// ==========================================
function initSSE() {
  if (state.eventSource) {
    state.eventSource.close();
    state.eventSource = null;
  }
  const eventSource = new EventSource('/api/logs/stream');
  state.eventSource = eventSource;

  eventSource.addEventListener('connected', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.status) updateStatusIndicator(data.status);
      if (data.recentLogs) {
        state.logs = data.recentLogs;
        renderLogs();
      }
      if (data.config) {
        state.config = data.config;
      }
    } catch (err) {
      console.error('Error handling connected SSE:', err);
    }
  });

  eventSource.addEventListener('log', (e) => {
    try {
      const entry = JSON.parse(e.data);
      state.logs.unshift(entry);
      if (state.logs.length > 500) state.logs.pop();
      appendSingleLog(entry);
    } catch (err) {
      console.error('Error parsing SSE log:', err);
    }
  });

  eventSource.addEventListener('rates_updated', (e) => {
    try {
      const data = JSON.parse(e.data);
      state.rates = data.rates || {};
      updateStatusIndicator({ stale: false });
      renderKPIs();
      renderRatesGrid();
    } catch (err) {
      console.error('Error parsing rates_updated SSE:', err);
    }
  });

  eventSource.addEventListener('scrape_error', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.rates) state.rates = data.rates;
      updateStatusIndicator({ stale: true, error: data.error });
      renderKPIs();
      renderRatesGrid();
    } catch (err) {
      console.error('Error parsing scrape_error SSE:', err);
    }
  });

  eventSource.addEventListener('config_updated', (e) => {
    try {
      const newConfig = JSON.parse(e.data);
      state.config = newConfig;
      syncItemsWithConfig();
      renderRatesGrid();
      updateEnabledBadge();
    } catch (err) {
      console.error('Error parsing config_updated SSE:', err);
    }
  });

  eventSource.addEventListener('logs_cleared', () => {
    state.logs = [];
    renderLogs();
  });

  eventSource.onopen = () => {
    updateStatusIndicator({ online: true });
  };

  eventSource.onerror = () => {
    updateStatusIndicator({ online: false });
  };
}

function updateStatusIndicator(info) {
  const pill = document.getElementById('status-pill');
  const label = document.getElementById('status-label');
  if (!pill || !label) return;

  pill.className = 'status-pill';
  if (info.online === false) {
    pill.classList.add('error');
    label.textContent = 'Disconnected from server';
    return;
  }

  if (info.stale) {
    pill.classList.add('stale');
    label.textContent = 'Scraper Stale / Offline Fallback';
  } else {
    pill.classList.add('live');
    label.textContent = 'Live & Connected to TGJU';
  }
}

// ==========================================
// Data Loaders
// ==========================================
async function loadInitialData() {
  try {
    const [itemsRes, ratesRes, configRes] = await Promise.all([
      fetch('/api/items').then((r) => r.json()).catch(() => ({})),
      fetch('/api/rates?all=true').then((r) => r.json()).catch(() => ({})),
      fetch('/api/config').then((r) => r.json()).catch(() => ({})),
    ]);

    if (itemsRes.error && itemsRes.error.includes('Authentication')) {
      state.authenticated = false;
      showLoginModal();
      return;
    }

    if (itemsRes.success) {
      state.items = itemsRes.items;
    }
    if (ratesRes.success) {
      state.rates = ratesRes.rates || {};
      updateStatusIndicator({ stale: ratesRes.stale });
    }
    if (configRes.success) {
      state.config = configRes.config || {};
      populateSettingsForm(state.config);
    }

    syncItemsWithConfig();
    renderKPIs();
    renderRatesGrid();
    updateEnabledBadge();
  } catch (err) {
    console.error('Error loading initial data:', err);
    showToast('Error loading initial rates data', 'error');
  }
}

function syncItemsWithConfig() {
  if (!state.config || !state.config.enabledItems) return;
  for (const item of state.items) {
    if (Object.prototype.hasOwnProperty.call(state.config.enabledItems, item.code)) {
      item.enabled = Boolean(state.config.enabledItems[item.code]);
    }
  }
}

function updateEnabledBadge() {
  const badge = document.getElementById('enabled-count-badge');
  const tabRatesCount = document.getElementById('tab-rates-count');
  if (!badge) return;

  const total = state.items.length;
  const enabled = state.items.filter((i) => i.enabled).length;
  badge.textContent = `${enabled} / ${total}`;
  if (tabRatesCount) tabRatesCount.textContent = total;
}

// ==========================================
// Render KPIs
// ==========================================
function renderKPIs() {
  const formatToman = (num) => (num !== null && num !== undefined ? num.toLocaleString('en-US') : '--');

  const usd = state.rates.USD;
  if (usd && usd.toman) {
    document.getElementById('kpi-usd').textContent = formatToman(usd.toman);
    document.getElementById('kpi-usd-sub').textContent = `${usd.market_time_fa || usd.market_time || 'Free Market'}`;
  }

  const usdt = state.rates.USDT;
  if (usdt && usdt.toman) {
    document.getElementById('kpi-usdt').textContent = formatToman(usdt.toman);
    document.getElementById('kpi-usdt-sub').textContent = `$${usdt.usd || 1} • USD Tether`;
  }

  const btc = state.rates.BTC;
  if (btc && btc.toman) {
    document.getElementById('kpi-btc').textContent = `$${(btc.usd || 0).toLocaleString('en-US')}`;
    document.getElementById('kpi-btc-sub').textContent = `${formatToman(btc.toman)} Tomans`;
  }

  const geram18 = state.rates.GERAM18;
  if (geram18 && geram18.toman) {
    document.getElementById('kpi-geram18').textContent = formatToman(geram18.toman);
    document.getElementById('kpi-geram18-sub').textContent = `18K Gold Benchmark Gram`;
  }

  const sekee = state.rates.SEKEE;
  if (sekee && sekee.toman) {
    document.getElementById('kpi-sekee').textContent = formatToman(sekee.toman);
    document.getElementById('kpi-sekee-sub').textContent = `Emami Gold Coin`;
  }

  const ton = state.rates.TON;
  if (ton && ton.toman) {
    document.getElementById('kpi-ton').textContent = `$${ton.usd || '--'}`;
    document.getElementById('kpi-ton-sub').textContent = `${formatToman(ton.toman)} Tomans`;
  }
}

// ==========================================
// Render Rates Grid
// ==========================================
function renderRatesGrid() {
  const grid = document.getElementById('rates-grid');
  if (!grid) return;

  let filtered = state.items;

  // Category filter
  if (state.activeCategory === 'enabled') {
    filtered = filtered.filter((i) => i.enabled);
  } else if (state.activeCategory !== 'all') {
    filtered = filtered.filter((i) => i.category === state.activeCategory);
  }

  // Search query filter
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.trim().toLowerCase();
    filtered = filtered.filter(
      (i) =>
        i.code.toLowerCase().includes(q) ||
        (i.name && i.name.toLowerCase().includes(q)) ||
        (i.nameEn && i.nameEn.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted);">
        No items matched your search query.
      </div>
    `;
    return;
  }

  const categoryLabels = {
    fiat: 'Fiat FX',
    crypto: 'Crypto',
    gold: 'Gold & Coin',
  };

  grid.innerHTML = filtered
    .map((item) => {
      const rate = state.rates[item.code] || {};
      const isChecked = item.enabled ? 'checked' : '';

      // Toman / USD values
      let priceMain = '--';
      let unitLabel = 'Tomans';
      if (item.unit === 'usd') {
        priceMain = rate.usd ? `$${rate.usd.toLocaleString('en-US')}` : '--';
        unitLabel = 'USD';
      } else {
        priceMain = rate.toman !== null && rate.toman !== undefined ? rate.toman.toLocaleString('en-US') : '--';
      }

      // Change calculation
      let changeBadge = '<span class="rate-change-badge neutral">0%</span>';
      if (rate.change_percent !== undefined && rate.change_percent !== null) {
        if (rate.change_percent > 0) {
          changeBadge = `<span class="rate-change-badge positive">+${rate.change_percent}% ▲</span>`;
        } else if (rate.change_percent < 0) {
          changeBadge = `<span class="rate-change-badge negative">${rate.change_percent}% ▼</span>`;
        }
      }

      // Secondary USD price for cryptos
      let usdSub = '';
      if (rate.usd && item.unit !== 'usd') {
        usdSub = `<div class="rate-price-usd">$${rate.usd.toLocaleString('en-US')}</div>`;
      }

      const displayNameEn = item.nameEn || item.name;
      const displayNameFa = item.name || '';

      return `
        <div class="rate-card category-${item.category} ${item.enabled ? 'is-enabled' : ''}" data-code="${item.code}">
          <div class="rate-card-top">
            <div class="rate-identity">
              <div class="rate-code-row">
                <span class="rate-code">${item.code}</span>
                <span class="category-tag ${item.category}">${categoryLabels[item.category] || item.category}</span>
              </div>
              <div class="rate-name">${displayNameEn}</div>
              <div class="rate-name-en">${displayNameFa}</div>
            </div>

            <label class="toggle-switch" title="Toggle item inclusion in REST API responses">
              <input type="checkbox" class="rate-item-toggle" data-code="${item.code}" ${isChecked}>
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="rate-card-middle">
            <div class="rate-price-row">
              <div class="rate-price-main">${priceMain} <span class="rate-unit">${unitLabel}</span></div>
              ${changeBadge}
            </div>
            ${usdSub}
          </div>

          <div class="rate-card-bottom">
            <span>${rate.market_time || rate.market_time_fa || 'TGJU'}</span>
            <span class="rate-api-status ${item.enabled ? 'active' : 'inactive'}">
              ${item.enabled ? '✓ Active in API' : '✕ Disabled'}
            </span>
          </div>
        </div>
      `;
    })
    .join('');

  // Attach change event listener to each toggle
  grid.querySelectorAll('.rate-item-toggle').forEach((cb) => {
    cb.addEventListener('change', async (e) => {
      const code = e.target.getAttribute('data-code');
      const enabled = e.target.checked;
      await toggleItemAPI(code, enabled);
    });
  });
}

// ==========================================
// Toggle Item in API
// ==========================================
async function toggleItemAPI(code, enabled) {
  try {
    // Optimistic UI update
    const item = state.items.find((i) => i.code === code);
    if (item) item.enabled = enabled;
    updateEnabledBadge();

    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemCode: code, enabled }),
    });

    const data = await res.json();
    if (data.success) {
      showToast(`${code} successfully ${enabled ? 'enabled in API output' : 'disabled from API output'}`, 'success');
    } else {
      throw new Error(data.error);
    }
  } catch (err) {
    showToast(`Error updating item status: ${err.message}`, 'error');
    // Rollback
    const item = state.items.find((i) => i.code === code);
    if (item) item.enabled = !enabled;
    renderRatesGrid();
    updateEnabledBadge();
  }
}

// ==========================================
// Bulk Actions
// ==========================================
async function bulkToggleCategory(category, enabled) {
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_category', category, enabled }),
    });
    const data = await res.json();
    if (data.success) {
      state.items = data.items;
      renderRatesGrid();
      updateEnabledBadge();
      showToast(`Category ${category} ${enabled ? 'enabled' : 'disabled'}`, 'success');
    }
  } catch (err) {
    showToast(`Bulk toggle failed: ${err.message}`, 'error');
  }
}

// Filter category chips & native dropdown
const categorySelect = document.getElementById('category-select');
if (categorySelect) {
  categorySelect.addEventListener('change', (e) => {
    state.activeCategory = e.target.value;
    document.querySelectorAll('.cat-chip').forEach((c) => {
      c.classList.toggle('active', c.getAttribute('data-category') === state.activeCategory);
    });
    renderRatesGrid();
  });
}

document.querySelectorAll('.cat-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.cat-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    state.activeCategory = chip.getAttribute('data-category');
    if (categorySelect) {
      categorySelect.value = state.activeCategory;
      categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    renderRatesGrid();
  });
});

// Search input
const searchInput = document.getElementById('rates-search-input');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderRatesGrid();
  });
}

// Bulk Buttons
document.getElementById('btn-enable-all')?.addEventListener('click', () => bulkToggleCategory('all', true));
document.getElementById('btn-disable-all')?.addEventListener('click', () => bulkToggleCategory('all', false));
document.getElementById('btn-toggle-fiat-all')?.addEventListener('click', () => bulkToggleCategory('fiat', true));
document.getElementById('btn-toggle-crypto-all')?.addEventListener('click', () => bulkToggleCategory('crypto', true));
document.getElementById('btn-toggle-gold-all')?.addEventListener('click', () => bulkToggleCategory('gold', true));

// Scrape Now Button
const btnScrapeNow = document.getElementById('btn-scrape-now');
if (btnScrapeNow) {
  btnScrapeNow.addEventListener('click', async () => {
    const icon = btnScrapeNow.querySelector('.spin-icon');
    if (icon) icon.classList.add('spinning');
    btnScrapeNow.disabled = true;

    try {
      showToast('Scraping fresh rates from TGJU...', 'info');
      const res = await fetch('/api/scrape', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`Scrape successful (${data.count} rates updated)`, 'success');
        try {
          await loadInitialData();
        } catch {}
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      showToast(`Scrape failed: ${err.message}`, 'error');
    } finally {
      if (icon) icon.classList.remove('spinning');
      btnScrapeNow.disabled = false;
    }
  });
}

// ==========================================
// API Tester Tab
// ==========================================
const testerUrlInput = document.getElementById('tester-url-input');
const btnSendTest = document.getElementById('btn-send-test');
const resStatus = document.getElementById('res-status');
const resTime = document.getElementById('res-time');
const resCount = document.getElementById('res-count');
const responseCodeBox = document.getElementById('response-code-box');
const codeSnippetBox = document.getElementById('code-snippet-box');

// Preset dropdown & buttons
const testerPresetSelect = document.getElementById('tester-preset-select');
if (testerPresetSelect) {
  testerPresetSelect.addEventListener('change', (e) => {
    const url = e.target.value;
    if (testerUrlInput) {
      testerUrlInput.value = url;
      updateCodeSnippet(url);
    }
  });
}

document.querySelectorAll('.preset-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const url = btn.getAttribute('data-url');
    if (testerUrlInput) {
      testerUrlInput.value = url;
      if (testerPresetSelect) {
        testerPresetSelect.value = url;
        testerPresetSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      updateCodeSnippet(url);
    }
  });
});

const testerMethodSelect = document.getElementById('tester-method-select');
if (testerMethodSelect) {
  testerMethodSelect.addEventListener('change', () => {
    updateCodeSnippet(testerUrlInput ? testerUrlInput.value : '/api/rates');
  });
}

if (testerUrlInput) {
  testerUrlInput.addEventListener('input', (e) => {
    updateCodeSnippet(e.target.value);
  });
}

let activeSnippetLang = 'curl';
document.querySelectorAll('.code-tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.code-tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeSnippetLang = btn.getAttribute('data-lang');
    updateCodeSnippet(testerUrlInput ? testerUrlInput.value : '/api/rates');
  });
});

const testerKeySelect = document.getElementById('tester-key-select');
if (testerKeySelect) {
  testerKeySelect.addEventListener('change', () => {
    updateCodeSnippet(testerUrlInput ? testerUrlInput.value : '/api/rates');
  });
}

function updateCodeSnippet(endpoint) {
  if (!codeSnippetBox) return;
  const origin = window.location.origin && window.location.origin.startsWith('http') ? window.location.origin : 'http://localhost:1718';
  const fullUrl = `${origin}${endpoint}`;
  const method = testerMethodSelect ? testerMethodSelect.value : 'GET';

  const selectedKeyId = testerKeySelect ? testerKeySelect.value : 'session';
  const isKey = selectedKeyId !== 'session';
  const rawKey = (isKey && state.activeRawKeys[selectedKeyId]) || (isKey ? 'csk_YOUR_API_KEY' : null);

  if (activeSnippetLang === 'curl') {
    if (isKey) {
      codeSnippetBox.textContent = `curl -X ${method} "${fullUrl}" \\\n  -H "X-API-Key: ${rawKey}"`;
    } else {
      codeSnippetBox.textContent = `curl -X ${method} "${fullUrl}"`;
    }
  } else if (activeSnippetLang === 'python') {
    const pyMethod = method.toLowerCase();
    if (isKey) {
      codeSnippetBox.textContent = `import requests\n\nheaders = {\n    "X-API-Key": "${rawKey}"\n}\n\nr = requests.${pyMethod}("${fullUrl}", headers=headers)\ndata = r.json()\nprint(data)`;
    } else {
      codeSnippetBox.textContent = `import requests\n\nr = requests.${pyMethod}("${fullUrl}")\ndata = r.json()\nprint(data)`;
    }
  } else if (activeSnippetLang === 'js') {
    if (isKey) {
      codeSnippetBox.textContent = `const res = await fetch("${fullUrl}", {\n  method: "${method}",\n  headers: {\n    "X-API-Key": "${rawKey}"\n  }\n});\nconst data = await res.json();\nconsole.log(data);`;
    } else {
      codeSnippetBox.textContent = `const res = await fetch("${fullUrl}", {\n  method: "${method}"\n});\nconst data = await res.json();\nconsole.log(data);`;
    }
  }
}

if (btnSendTest) {
  btnSendTest.addEventListener('click', async () => {
    const endpoint = testerUrlInput.value.trim() || '/api/rates';
    const method = testerMethodSelect ? testerMethodSelect.value : 'GET';
    btnSendTest.disabled = true;
    btnSendTest.textContent = 'Sending...';

    const selectedKeyId = testerKeySelect ? testerKeySelect.value : 'session';
    const fetchHeaders = {};

    if (selectedKeyId !== 'session') {
      const activeKey = state.activeRawKeys[selectedKeyId];
      if (activeKey) {
        fetchHeaders['X-API-Key'] = activeKey;
      } else {
        // If not in memory (page reload), pass a demo invalid key or query
        fetchHeaders['X-API-Key'] = 'csk_demo_unrevealed_key';
      }
    }

    const t0 = performance.now();
    try {
      const res = await fetch(endpoint, {
        method,
        headers: Object.keys(fetchHeaders).length ? fetchHeaders : undefined,
      });
      const elapsed = Math.round(performance.now() - t0);
      const data = await res.json();

      resStatus.textContent = `${res.status} ${res.statusText || 'OK'}`;
      resStatus.style.color = res.ok ? 'var(--success)' : 'var(--danger)';
      resTime.textContent = `${elapsed}ms`;
      resCount.textContent = data.count !== undefined ? data.count : Object.keys(data.rates || {}).length;

      responseCodeBox.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      resStatus.textContent = 'FAILED';
      resStatus.style.color = 'var(--danger)';
      resTime.textContent = '--';
      resCount.textContent = '0';
      responseCodeBox.textContent = `Error: ${err.message}`;
    } finally {
      btnSendTest.disabled = false;
      btnSendTest.textContent = 'Send Request';
    }
  });
}

// Copy JSON button
document.getElementById('btn-copy-json')?.addEventListener('click', () => {
  if (!responseCodeBox) return;
  navigator.clipboard.writeText(responseCodeBox.textContent);
  showToast('JSON response copied to clipboard', 'success');
});

// ==========================================
// Live Logs Console
// ==========================================
function renderLogs() {
  const container = document.getElementById('terminal-logs');
  if (!container) return;

  let filtered = state.logs;
  if (state.logFilter !== 'all') {
    filtered = filtered.filter((l) => l.level === state.logFilter);
  }

  container.innerHTML = filtered
    .map(
      (entry) => `
      <div class="log-entry level-${entry.level}">
        <span class="log-time">[${entry.timeTehran || '--:--:--'}]</span>
        <span class="log-badge ${entry.level}">${entry.level.toUpperCase()}</span>
        <span class="log-message">${escapeHtml(entry.message)}</span>
      </div>
    `
    )
    .join('');

  if (state.autoScrollLogs) {
    const box = document.getElementById('terminal-box');
    if (box) box.scrollTop = box.scrollHeight;
  }
}

function appendSingleLog(entry) {
  const container = document.getElementById('terminal-logs');
  if (!container) return;

  if (state.logFilter !== 'all' && entry.level !== state.logFilter) {
    return;
  }

  const el = document.createElement('div');
  el.className = `log-entry level-${entry.level}`;
  el.innerHTML = `
    <span class="log-time">[${entry.timeTehran || '--:--:--'}]</span>
    <span class="log-badge ${entry.level}">${entry.level.toUpperCase()}</span>
    <span class="log-message">${escapeHtml(entry.message)}</span>
  `;

  container.appendChild(el);

  if (state.autoScrollLogs) {
    const box = document.getElementById('terminal-box');
    if (box) box.scrollTop = box.scrollHeight;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Logs Controls & native dropdown
const logFilterSelect = document.getElementById('log-filter-select');
if (logFilterSelect) {
  logFilterSelect.addEventListener('change', (e) => {
    state.logFilter = e.target.value;
    document.querySelectorAll('.log-filter-btn').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-filter') === state.logFilter);
    });
    renderLogs();
  });
}

document.querySelectorAll('.log-filter-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.log-filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.logFilter = btn.getAttribute('data-filter');
    if (logFilterSelect) {
      logFilterSelect.value = state.logFilter;
      logFilterSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    renderLogs();
  });
});

const btnPauseLogs = document.getElementById('btn-pause-logs');
if (btnPauseLogs) {
  btnPauseLogs.addEventListener('click', () => {
    state.autoScrollLogs = !state.autoScrollLogs;
    btnPauseLogs.textContent = state.autoScrollLogs ? 'Pause Scroll' : 'Resume Scroll';
    btnPauseLogs.classList.toggle('active', !state.autoScrollLogs);
  });
}

document.getElementById('btn-clear-logs')?.addEventListener('click', async () => {
  try {
    await fetch('/api/logs/clear', { method: 'POST' });
    state.logs = [];
    renderLogs();
    showToast('Logs cleared successfully', 'info');
  } catch (err) {
    showToast(`Failed to clear logs: ${err.message}`, 'error');
  }
});

// ==========================================
// Settings Form
// ==========================================
function populateSettingsForm(cfg) {
  const selInterval = document.getElementById('setting-interval');
  const selAutoScrape = document.getElementById('setting-auto-scrape');
  const inpUrl = document.getElementById('setting-url');

  if (selInterval && cfg.scrapeIntervalSeconds) {
    selInterval.value = String(cfg.scrapeIntervalSeconds);
    selInterval.dispatchEvent(new Event('change', { bubbles: true }));
  }
  if (selAutoScrape && cfg.autoScrape !== undefined) {
    selAutoScrape.value = String(cfg.autoScrape);
    selAutoScrape.dispatchEvent(new Event('change', { bubbles: true }));
  }
  if (inpUrl && cfg.tgjuUrl) {
    inpUrl.value = cfg.tgjuUrl;
  }
}

const settingsForm = document.getElementById('settings-form');
if (settingsForm) {
  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const interval = parseInt(document.getElementById('setting-interval').value, 10);
    const autoScrape = document.getElementById('setting-auto-scrape').value === 'true';
    const tgjuUrl = document.getElementById('setting-url').value.trim();

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scrapeIntervalSeconds: interval,
          autoScrape,
          tgjuUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Settings saved successfully', 'success');
        const alertEl = document.getElementById('settings-save-alert');
        if (alertEl) {
          alertEl.textContent = '✓ Saved';
          setTimeout(() => (alertEl.textContent = ''), 3000);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      showToast(`Failed to save settings: ${err.message}`, 'error');
    }
  });
}

// ==========================================
// Authentication & Security (WebUI & API Keys)
// ==========================================

function showLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) modal.classList.remove('hidden');
  document.querySelectorAll('.session-only').forEach((el) => el.classList.add('hidden'));
  const input = document.getElementById('login-password-input');
  if (input) {
    input.value = '';
    setTimeout(() => input.focus(), 60);
  }
  const errBox = document.getElementById('login-error-alert');
  if (errBox) errBox.classList.add('hidden');
}

function hideLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) modal.classList.add('hidden');
  document.querySelectorAll('.session-only').forEach((el) => el.classList.remove('hidden'));
}

function updateDefaultPasswordUI(isDefault) {
  const badge = document.getElementById('default-pwd-badge');
  const cardWarning = document.getElementById('pwd-card-warning');
  if (badge) {
    if (isDefault) badge.classList.remove('hidden');
    else badge.classList.add('hidden');
  }
  if (cardWarning) {
    if (isDefault) cardWarning.classList.remove('hidden');
    else cardWarning.classList.add('hidden');
  }
}

async function checkAuthStatus() {
  try {
    const res = await fetch('/api/auth/status');
    const data = await res.json();
    state.authenticated = Boolean(data.authenticated);
    state.isDefaultPassword = Boolean(data.isDefaultPassword);

    updateDefaultPasswordUI(state.isDefaultPassword);

    if (state.authenticated) {
      hideLoginModal();
      loadInitialData();
      initSSE();
      loadApiKeys();
    } else {
      showLoginModal();
    }
  } catch (err) {
    console.error('Error checking auth status:', err);
    showLoginModal();
  }
}

// Password eye visibility toggles
document.querySelectorAll('.btn-toggle-eye').forEach((btn) => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (input) {
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    }
  });
});

// Login Form Submit
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('login-password-input');
    const errBox = document.getElementById('login-error-alert');
    const btnSubmit = document.getElementById('btn-login-submit');
    const password = input ? input.value : '';

    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Verifying...';
    }
    if (errBox) errBox.classList.add('hidden');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        state.authenticated = true;
        state.isDefaultPassword = Boolean(data.isDefaultPassword);
        hideLoginModal();
        updateDefaultPasswordUI(state.isDefaultPassword);
        showToast('Signed in successfully', 'success');
        loadInitialData();
        initSSE();
        loadApiKeys();
      } else {
        if (errBox) {
          errBox.textContent = data.error || 'Invalid password. (Default is "admin")';
          errBox.classList.remove('hidden');
        }
      }
    } catch (err) {
      if (errBox) {
        errBox.textContent = `Login failed: ${err.message}`;
        errBox.classList.remove('hidden');
      }
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Unlock Dashboard';
      }
    }
  });
}

// Logout button
document.getElementById('btn-logout')?.addEventListener('click', async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {}
  state.authenticated = false;
  if (state.eventSource) {
    state.eventSource.close();
    state.eventSource = null;
  }
  showToast('Logged out of WebUI', 'info');
  showLoginModal();
});

// Default password warning badge in header: click jumps directly to security tab
document.getElementById('default-pwd-badge')?.addEventListener('click', () => {
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
  const secBtn = document.querySelector('[data-tab="tab-security"]');
  const secContent = document.getElementById('tab-security');
  if (secBtn) secBtn.classList.add('active');
  if (secContent) secContent.classList.add('active');
  document.getElementById('change-password-form')?.scrollIntoView({ behavior: 'smooth' });
});

// Change Password Form
const changePwdForm = document.getElementById('change-password-form');
if (changePwdForm) {
  changePwdForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('pwd-current').value;
    const newPassword = document.getElementById('pwd-new').value;
    const confirmPassword = document.getElementById('pwd-confirm').value;
    const feedback = document.getElementById('pwd-change-feedback');
    const btnSubmit = document.getElementById('btn-submit-change-pwd');

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match!', 'error');
      if (feedback) {
        feedback.textContent = '✕ Passwords do not match';
        feedback.style.color = 'var(--danger-ink)';
      }
      return;
    }

    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Updating...';
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        state.isDefaultPassword = false;
        updateDefaultPasswordUI(false);
        changePwdForm.reset();
        showToast('Password updated successfully! Default password warning cleared.', 'success');
        if (feedback) {
          feedback.textContent = '✓ Password updated successfully';
          feedback.style.color = 'var(--success-ink)';
          setTimeout(() => (feedback.textContent = ''), 4000);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      showToast(`Failed to update password: ${err.message}`, 'error');
      if (feedback) {
        feedback.textContent = `✕ ${err.message}`;
        feedback.style.color = 'var(--danger-ink)';
      }
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Update Password';
      }
    }
  });
}

// API Key Management Functions
async function loadApiKeys() {
  try {
    const res = await fetch('/api/auth/keys');
    if (res.status === 401) {
      showLoginModal();
      return;
    }
    const data = await res.json();
    if (data.success) {
      state.apiKeys = data.keys || [];
      renderApiKeysTable();
      updateTesterKeySelect();
    }
  } catch (err) {
    console.error('Failed to load API keys:', err);
  }
}

function renderApiKeysTable() {
  const tbody = document.getElementById('keys-table-body');
  if (!tbody) return;

  if (!state.apiKeys || state.apiKeys.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="table-empty">
          No API keys issued yet. Use the form above to generate your first key.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = state.apiKeys
    .map((k) => {
      const isActive = k.status === 'active';
      const statusBadge = isActive
        ? `<span class="badge badge-active">Active</span>`
        : `<span class="badge badge-revoked">Revoked</span>`;

      const createdDate = k.createdAt
        ? new Date(k.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
        : '--';
      const lastUsed = k.lastUsedAt
        ? new Date(k.lastUsedAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
        : 'Never';

      const revokeBtn = isActive
        ? `<button class="btn btn-secondary btn-xs btn-revoke-key" data-id="${k.id}" data-name="${escapeHtml(k.name)}" title="Deactivate key">Revoke</button>`
        : `<button class="btn btn-secondary btn-xs" disabled title="Already revoked">Revoked</button>`;

      const deleteBtn = `<button class="btn btn-danger btn-xs btn-delete-key" data-id="${k.id}" data-name="${escapeHtml(k.name)}" title="Delete key permanently">Delete</button>`;

      return `
        <tr class="${isActive ? '' : 'row-revoked'}">
          <td class="key-name-col">
            <strong>${escapeHtml(k.name)}</strong>
          </td>
          <td>
            <code class="key-prefix-code">${escapeHtml(k.prefix)}</code>
          </td>
          <td>${statusBadge}</td>
          <td class="text-muted text-sm">${createdDate}</td>
          <td class="text-muted text-sm">${lastUsed}</td>
          <td><span class="badge-count">${k.useCount || 0}</span></td>
          <td style="text-align: right;">
            <div class="row-actions">
              ${revokeBtn}
              ${deleteBtn}
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  // Wire revoke buttons
  tbody.querySelectorAll('.btn-revoke-key').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      if (confirm(`Are you sure you want to revoke the API key "${name}"? External requests using this key will be rejected.`)) {
        await revokeApiKey(id);
      }
    });
  });

  // Wire delete buttons
  tbody.querySelectorAll('.btn-delete-key').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      if (confirm(`Permanently delete API key "${name}"? This cannot be undone.`)) {
        await deleteApiKey(id);
      }
    });
  });
}

async function revokeApiKey(id) {
  try {
    const res = await fetch(`/api/auth/keys/${encodeURIComponent(id)}/revoke`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('API key revoked', 'info');
      await loadApiKeys();
    } else {
      throw new Error(data.error);
    }
  } catch (err) {
    showToast(`Failed to revoke key: ${err.message}`, 'error');
  }
}

async function deleteApiKey(id) {
  try {
    const res = await fetch(`/api/auth/keys/${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('API key deleted', 'info');
      await loadApiKeys();
    } else {
      throw new Error(data.error);
    }
  } catch (err) {
    showToast(`Failed to delete key: ${err.message}`, 'error');
  }
}

function updateTesterKeySelect() {
  const sel = document.getElementById('tester-key-select');
  if (!sel) return;

  const previousVal = sel.value;
  sel.innerHTML = '<option value="session">WebUI Admin Session (Automatic Cookie / Bearer)</option>';

  for (const k of state.apiKeys) {
    const opt = document.createElement('option');
    opt.value = k.id;
    const isCached = Boolean(state.activeRawKeys[k.id]);
    opt.textContent = `Key: ${k.name} (${k.prefix}) [${k.status}]${isCached ? ' ✓ In Memory' : ''}`;
    sel.appendChild(opt);
  }

  if (previousVal && Array.from(sel.options).some((o) => o.value === previousVal)) {
    sel.value = previousVal;
  }
  sel.dispatchEvent(new Event('change', { bubbles: true }));
}

// Key Reveal Modal
function showKeyRevealModal(key) {
  const modal = document.getElementById('key-reveal-modal');
  if (!modal) return;

  const nameEl = document.getElementById('reveal-key-name');
  const inputEl = document.getElementById('reveal-raw-key');
  const snippetEl = document.getElementById('reveal-snippet-curl');

  if (nameEl) nameEl.textContent = `API Key: ${key.name}`;
  if (inputEl) inputEl.value = key.rawKey;

  const origin = window.location.origin && window.location.origin.startsWith('http') ? window.location.origin : 'http://localhost:1718';
  if (snippetEl) {
    snippetEl.textContent = `curl -X GET "${origin}/api/rates" \\\n  -H "X-API-Key: ${key.rawKey}"`;
  }

  modal.classList.remove('hidden');
}

document.getElementById('btn-close-reveal-modal')?.addEventListener('click', () => {
  const modal = document.getElementById('key-reveal-modal');
  if (modal) modal.classList.add('hidden');
});

document.getElementById('btn-copy-reveal-key')?.addEventListener('click', () => {
  const inputEl = document.getElementById('reveal-raw-key');
  if (inputEl && inputEl.value) {
    navigator.clipboard.writeText(inputEl.value);
    showToast('API key copied to clipboard!', 'success');
  }
});

// Issue Key Form Submit
const issueKeyForm = document.getElementById('issue-key-form');
if (issueKeyForm) {
  issueKeyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('new-key-name');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) return;

    const btnSubmit = document.getElementById('btn-issue-key');
    if (btnSubmit) btnSubmit.disabled = true;

    try {
      const res = await fetch('/api/auth/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.success && data.key) {
        if (nameInput) nameInput.value = '';
        state.activeRawKeys[data.key.id] = data.key.rawKey;
        showToast('API key issued successfully!', 'success');
        showKeyRevealModal(data.key);
        await loadApiKeys();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      showToast(`Failed to issue key: ${err.message}`, 'error');
    } finally {
      if (btnSubmit) btnSubmit.disabled = false;
    }
  });
}

// Initial Kickoff
checkAuthStatus();

// ==========================================
// Custom Themed Dropdown Component
// ==========================================
function setupCustomDropdown(selectEl) {
  if (!selectEl || selectEl.dataset.customized === 'true') return;
  selectEl.dataset.customized = 'true';

  // Mark native select as visually hidden (accessible, forms work, pointer-events none)
  selectEl.classList.add('custom-select-native');

  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-select-wrapper';
  if (selectEl.id) wrapper.dataset.for = selectEl.id;

  // Class modifiers based on parent/type
  if (selectEl.classList.contains('method-tag-select')) {
    wrapper.classList.add('method-tag-wrapper');
  } else if (selectEl.classList.contains('category-select-dropdown')) {
    wrapper.classList.add('category-select-wrapper');
  } else if (selectEl.classList.contains('log-filter-dropdown')) {
    wrapper.classList.add('log-filter-wrapper');
  } else if (selectEl.classList.contains('form-input')) {
    wrapper.classList.add('form-input-wrapper');
  }

  // Trigger button
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'custom-select-trigger';
  if (selectEl.classList.contains('method-tag-select')) {
    trigger.classList.add('method-tag-trigger');
  }
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const valueSpan = document.createElement('span');
  valueSpan.className = 'custom-select-value';

  const arrowSpan = document.createElement('span');
  arrowSpan.className = 'custom-select-arrow';
  arrowSpan.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

  trigger.appendChild(valueSpan);
  trigger.appendChild(arrowSpan);

  // Options Menu
  const menu = document.createElement('div');
  menu.className = 'custom-select-menu';
  menu.setAttribute('role', 'listbox');

  function renderOptions() {
    menu.innerHTML = '';
    const options = Array.from(selectEl.options);
    const selectedOption = selectEl.options[selectEl.selectedIndex] || options[0];

    valueSpan.textContent = selectedOption ? selectedOption.text : '';

    options.forEach((opt, idx) => {
      const optEl = document.createElement('div');
      optEl.className = 'custom-select-option';
      optEl.setAttribute('role', 'option');
      optEl.dataset.value = opt.value;
      optEl.dataset.index = String(idx);

      const isSelected = opt.value === selectEl.value;
      if (isSelected) {
        optEl.classList.add('is-selected');
        optEl.setAttribute('aria-selected', 'true');
      }

      const textSpan = document.createElement('span');
      textSpan.className = 'option-text';
      textSpan.textContent = opt.text;
      optEl.appendChild(textSpan);

      if (isSelected) {
        const checkSpan = document.createElement('span');
        checkSpan.className = 'option-check';
        checkSpan.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        optEl.appendChild(checkSpan);
      }

      optEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (selectEl.value !== opt.value) {
          selectEl.value = opt.value;
          selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
        syncFromSelect();
        closeMenu();
      });

      menu.appendChild(optEl);
    });
  }

  function syncFromSelect() {
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    if (selectedOption) {
      valueSpan.textContent = selectedOption.text;
    }
    menu.querySelectorAll('.custom-select-option').forEach((item) => {
      const isSelected = item.dataset.value === selectEl.value;
      item.classList.toggle('is-selected', isSelected);
      item.setAttribute('aria-selected', isSelected ? 'true' : 'false');

      const existingCheck = item.querySelector('.option-check');
      if (isSelected && !existingCheck) {
        const checkSpan = document.createElement('span');
        checkSpan.className = 'option-check';
        checkSpan.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        item.appendChild(checkSpan);
      } else if (!isSelected && existingCheck) {
        existingCheck.remove();
      }
    });
  }

  function openMenu() {
    // Close other custom dropdowns
    document.querySelectorAll('.custom-select-wrapper.is-open').forEach((w) => {
      if (w !== wrapper) {
        w.classList.remove('is-open');
        const trig = w.querySelector('.custom-select-trigger');
        if (trig) trig.setAttribute('aria-expanded', 'false');
      }
    });

    // Check vertical overflow to open up or down
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < 280 && rect.top > 280) {
      wrapper.classList.add('opens-up');
    } else {
      wrapper.classList.remove('opens-up');
    }

    // Check horizontal alignment for right edge
    if (rect.right + 120 > window.innerWidth && rect.left > 150) {
      menu.style.left = 'auto';
      menu.style.right = '0';
    } else {
      menu.style.left = '0';
      menu.style.right = 'auto';
    }

    wrapper.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');

    const selItem = menu.querySelector('.custom-select-option.is-selected');
    if (selItem) {
      selItem.scrollIntoView({ block: 'nearest' });
    }
  }

  function closeMenu() {
    wrapper.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    menu.querySelectorAll('.custom-select-option').forEach(el => el.classList.remove('is-highlighted'));
  }

  function toggleMenu() {
    if (wrapper.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Keyboard navigation
  trigger.addEventListener('keydown', (e) => {
    const isOpen = wrapper.classList.contains('is-open');
    const optionEls = Array.from(menu.querySelectorAll('.custom-select-option'));
    let highlightedIndex = optionEls.findIndex(el => el.classList.contains('is-highlighted'));
    if (highlightedIndex === -1) {
      highlightedIndex = optionEls.findIndex(el => el.classList.contains('is-selected'));
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        openMenu();
      } else {
        highlightedIndex = (highlightedIndex + 1) % optionEls.length;
        optionEls.forEach((el, idx) => el.classList.toggle('is-highlighted', idx === highlightedIndex));
        optionEls[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        openMenu();
      } else {
        highlightedIndex = (highlightedIndex - 1 + optionEls.length) % optionEls.length;
        optionEls.forEach((el, idx) => el.classList.toggle('is-highlighted', idx === highlightedIndex));
        optionEls[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isOpen) {
        openMenu();
      } else {
        const targetOption = optionEls[highlightedIndex] || optionEls.find(el => el.classList.contains('is-selected'));
        if (targetOption) {
          targetOption.click();
        } else {
          closeMenu();
        }
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      if (isOpen) {
        closeMenu();
        if (e.key === 'Escape') e.preventDefault();
      }
    }
  });

  // Native select change event handler
  selectEl.addEventListener('change', () => {
    syncFromSelect();
  });

  // Connect associated label if exists
  if (selectEl.id) {
    const label = document.querySelector(`label[for="${selectEl.id}"]`);
    if (label) {
      label.addEventListener('click', (e) => {
        e.preventDefault();
        trigger.focus();
        toggleMenu();
      });
    }
  }

  // Watch for dynamic changes in select options (e.g. API keys loading)
  const observer = new MutationObserver(() => {
    renderOptions();
  });
  observer.observe(selectEl, { childList: true });

  renderOptions();

  // Mount in DOM: replace select with wrapper, put select inside wrapper
  selectEl.parentNode.insertBefore(wrapper, selectEl);
  wrapper.appendChild(selectEl);
  wrapper.appendChild(trigger);
  wrapper.appendChild(menu);
}

function initCustomSelects() {
  document.querySelectorAll('select').forEach((sel) => {
    setupCustomDropdown(sel);
  });
}

// Global click-outside & escape listeners
document.addEventListener('click', (e) => {
  if (!e.target.closest('.custom-select-wrapper')) {
    document.querySelectorAll('.custom-select-wrapper.is-open').forEach((w) => {
      w.classList.remove('is-open');
      const trig = w.querySelector('.custom-select-trigger');
      if (trig) trig.setAttribute('aria-expanded', 'false');
    });
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.custom-select-wrapper.is-open').forEach((w) => {
      w.classList.remove('is-open');
      const trig = w.querySelector('.custom-select-trigger');
      if (trig) trig.setAttribute('aria-expanded', 'false');
    });
  }
});

// Initialize Custom Selects
initCustomSelects();
