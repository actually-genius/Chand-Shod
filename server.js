import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scraperService } from './services/scraper.js';
import { configService } from './services/config.js';
import { logger } from './services/logger.js';
import {
  authService,
  requireWebAuth,
  requireApiKey,
  setSessionCookie,
  clearSessionCookie,
  extractSessionToken,
} from './services/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 1718;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static WebUI
app.use(express.static(path.join(__dirname, 'public')));

// Set up SSE client list for real-time broadcasts
const sseClients = new Set();

function broadcastSSE(type, data) {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Forward logger and scraper events to SSE clients
logger.on('log', (entry) => {
  broadcastSSE('log', entry);
});

logger.on('cleared', () => {
  broadcastSSE('logs_cleared', {});
});

scraperService.on('ratesUpdated', (payload) => {
  broadcastSSE('rates_updated', payload);
});

scraperService.on('scrapeError', (payload) => {
  broadcastSSE('scrape_error', payload);
});

// ==========================================
// AUTHENTICATION & API KEY ROUTES
// ==========================================

/**
 * GET /api/auth/status
 * Check current WebUI session status and default password state
 */
app.get('/api/auth/status', (req, res) => {
  const token = extractSessionToken(req);
  const authenticated = authService.isValidSession(token);
  res.json({
    success: true,
    authenticated,
    isDefaultPassword: authService.isDefaultPassword(),
  });
});

/**
 * POST /api/auth/login
 * Log in to WebUI using admin password
 */
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body || {};
  if (typeof password === 'string' && authService.verifyPassword(password)) {
    const sessionToken = authService.createSession();
    setSessionCookie(res, sessionToken);
    logger.info('WebUI admin logged in successfully');
    res.json({
      success: true,
      message: 'Login successful',
      sessionToken,
      isDefaultPassword: authService.isDefaultPassword(),
    });
  } else {
    logger.warn('Failed WebUI login attempt with incorrect password');
    res.status(401).json({
      success: false,
      error: 'Invalid password. (Default is "admin")',
    });
  }
});

/**
 * POST /api/auth/logout
 * Log out of WebUI and invalidate session
 */
app.post('/api/auth/logout', (req, res) => {
  const token = extractSessionToken(req);
  authService.destroySession(token);
  clearSessionCookie(res);
  logger.info('WebUI admin logged out');
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * POST /api/auth/change-password
 * Change admin password (requires current password verification)
 */
app.post('/api/auth/change-password', requireWebAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    authService.changePassword(currentPassword, newPassword);
    logger.info('Admin password changed successfully');
    res.json({
      success: true,
      message: 'Password changed successfully',
      isDefaultPassword: false,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/auth/keys
 * List all issued API keys (masked preview)
 */
app.get('/api/auth/keys', requireWebAuth, (req, res) => {
  try {
    const keys = authService.listApiKeys();
    res.json({ success: true, keys });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/keys
 * Generate and issue a new API key
 */
app.post('/api/auth/keys', requireWebAuth, (req, res) => {
  try {
    const { name } = req.body || {};
    const newKey = authService.generateApiKey(name);
    logger.info(`New API key generated: "${newKey.name}" (${newKey.prefix})`);
    res.json({
      success: true,
      message: 'API key generated successfully. Copy your secret key now.',
      key: newKey,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/keys/:id/revoke
 * Revoke an active API key
 */
app.post('/api/auth/keys/:id/revoke', requireWebAuth, (req, res) => {
  try {
    authService.revokeApiKey(req.params.id);
    logger.info(`API key revoked (ID: ${req.params.id})`);
    res.json({ success: true, message: 'API key revoked successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/auth/keys/:id
 * Permanently delete an API key
 */
app.delete('/api/auth/keys/:id', requireWebAuth, (req, res) => {
  try {
    authService.deleteApiKey(req.params.id);
    logger.info(`API key deleted (ID: ${req.params.id})`);
    res.json({ success: true, message: 'API key deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// API ROUTES
// ==========================================

/**
 * GET /api/rates
 * Returns rates for enabled items (requires valid API key or active WebUI session)
 * Query options:
 *   - ?all=true
 *   - ?category=fiat,crypto,gold,coin
 *   - ?symbols=USD,EUR,BTC,GERAM18
 *   - ?format=simple|full
 *   - ?api_key=csk_...
 */
app.get('/api/rates', requireApiKey, (req, res) => {
  try {
    const { all, category, symbols, format } = req.query;
    const ratesData = scraperService.getRates({
      all: all === 'true' || all === '1',
      category: category ? String(category) : null,
      symbols: symbols ? String(symbols) : null,
      format: format === 'simple' ? 'simple' : 'full',
    });
    res.json(ratesData);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/items
 * Returns catalog of all supported items with enabled toggle state
 */
app.get('/api/items', requireWebAuth, (req, res) => {
  try {
    const items = configService.getMasterItems();
    res.json({
      success: true,
      total: items.length,
      items,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/config
 * Returns current configuration
 */
app.get('/api/config', requireWebAuth, (req, res) => {
  try {
    res.json({
      success: true,
      config: configService.getConfig(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/config
 * Updates configuration (toggles for items, intervals, etc.)
 */
app.post('/api/config', requireWebAuth, (req, res) => {
  try {
    const {
      itemCode,
      enabled,
      enabledItems,
      action,
      category,
      scrapeIntervalSeconds,
      autoScrape,
      tgjuUrl,
    } = req.body;

    // Single item toggle
    if (itemCode !== undefined && enabled !== undefined) {
      configService.setItemEnabled(itemCode, enabled);
      logger.info(`Item ${itemCode} API sending option set to: ${enabled}`);
    }

    // Bulk items toggle
    if (enabledItems && typeof enabledItems === 'object') {
      configService.setMultipleItemsEnabled(enabledItems);
      logger.info(`Updated API sending options for ${Object.keys(enabledItems).length} items`);
    }

    // Bulk category toggle
    if (action === 'toggle_category' && category) {
      configService.bulkToggleCategory(category, Boolean(enabled));
      logger.info(`Category '${category}' items set to enabled=${enabled}`);
    }

    // Scrape interval update
    if (scrapeIntervalSeconds !== undefined) {
      const oldInterval = configService.getConfig().scrapeIntervalSeconds;
      configService.setScrapeInterval(scrapeIntervalSeconds);
      if (oldInterval !== scrapeIntervalSeconds) {
        scraperService.restart();
        logger.info(`Scrape interval updated to ${scrapeIntervalSeconds}s`);
      }
    }

    // Auto-scrape toggle
    if (autoScrape !== undefined) {
      configService.setAutoScrape(autoScrape);
      logger.info(`Auto-scrape set to: ${autoScrape}`);
    }

    // Custom TGJU URL
    if (tgjuUrl !== undefined && tgjuUrl.trim()) {
      const current = configService.getConfig();
      current.tgjuUrl = tgjuUrl.trim();
      configService.saveConfig(current);
      logger.info(`TGJU URL updated to: ${tgjuUrl.trim()}`);
    }

    broadcastSSE('config_updated', configService.getConfig());

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      config: configService.getConfig(),
      items: configService.getMasterItems(),
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/scrape
 * Manually trigger an immediate scrape from TGJU
 */
app.post('/api/scrape', requireWebAuth, async (req, res) => {
  try {
    logger.info('Manual scrape requested via API');
    const rates = await scraperService.fetch();
    res.json({
      success: true,
      message: 'Scrape completed',
      stale: scraperService.stale,
      count: Object.keys(rates).length,
      status: scraperService.getStatus(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/status
 * Scraper status, uptime, health, and stats
 */
app.get('/api/status', requireWebAuth, (req, res) => {
  try {
    const status = scraperService.getStatus();
    res.json({
      success: true,
      uptimeSeconds: Math.floor(process.uptime()),
      ...status,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/logs
 * Retrieve recent log entries
 */
app.get('/api/logs', requireWebAuth, (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const level = req.query.level ? String(req.query.level) : null;
    res.json({
      success: true,
      logs: logger.getLogs(limit, level),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/logs/clear
 * Clear logs in memory
 */
app.post('/api/logs/clear', requireWebAuth, (req, res) => {
  try {
    logger.clear();
    res.json({ success: true, message: 'Logs cleared' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/logs/stream
 * Server-Sent Events (SSE) endpoint for real-time logs and updates
 */
app.get('/api/logs/stream', requireWebAuth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial connected event with current status & recent logs
  const initPayload = {
    status: scraperService.getStatus(),
    recentLogs: logger.getLogs(30),
    config: configService.getConfig(),
  };
  res.write(`event: connected\ndata: ${JSON.stringify(initPayload)}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Start server and scraper
app.listen(PORT, () => {
  logger.info(`TGJU Scraper API & WebUI running at http://localhost:${PORT}`);
  scraperService.start();
});
