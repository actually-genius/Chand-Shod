import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const isPackaged = typeof process.pkg !== 'undefined' || Boolean(process.env.CAXA);
const ROOT_DIR = isPackaged ? process.cwd() : path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const SESSION_COOKIE_NAME = 'chandshod_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

class AuthService {
  constructor() {
    this.authData = {
      version: 1,
      password: null,
      apiKeys: [],
    };
    this.sessions = new Map(); // token -> { createdAt, expiresAt }
    this.init();
  }

  ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  init() {
    this.ensureDataDir();
    if (fs.existsSync(AUTH_FILE)) {
      try {
        const raw = fs.readFileSync(AUTH_FILE, 'utf-8');
        this.authData = JSON.parse(raw);
      } catch (err) {
        console.error('[AuthService] Error reading auth.json, reinitializing default:', err.message);
        this.initializeDefaultPassword();
      }
    } else {
      this.initializeDefaultPassword();
    }

    if (!this.authData.password) {
      this.initializeDefaultPassword();
    }
    if (!Array.isArray(this.authData.apiKeys)) {
      this.authData.apiKeys = [];
    }
  }

  save() {
    try {
      this.ensureDataDir();
      const tmpFile = `${AUTH_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.authData, null, 2), 'utf-8');
      fs.renameSync(tmpFile, AUTH_FILE);
    } catch (err) {
      console.error('[AuthService] Failed to persist auth.json:', err.message);
    }
  }

  hashPassword(password, salt = null) {
    const saltHex = salt || crypto.randomBytes(16).toString('hex');
    const hashBuffer = crypto.scryptSync(password, saltHex, 64);
    return {
      salt: saltHex,
      hash: hashBuffer.toString('hex'),
    };
  }

  verifyPassword(candidate) {
    if (!this.authData.password || !this.authData.password.hash || !this.authData.password.salt) {
      return false;
    }
    try {
      const candidateHash = crypto.scryptSync(candidate, this.authData.password.salt, 64);
      const storedHash = Buffer.from(this.authData.password.hash, 'hex');
      if (candidateHash.length !== storedHash.length) {
        return false;
      }
      return crypto.timingSafeEqual(candidateHash, storedHash);
    } catch {
      return false;
    }
  }

  initializeDefaultPassword() {
    const { salt, hash } = this.hashPassword('admin');
    this.authData.password = {
      hash,
      salt,
      algorithm: 'scrypt',
      isDefault: true,
      updatedAt: new Date().toISOString(),
    };
    this.save();
  }

  changePassword(currentPassword, newPassword) {
    if (!this.verifyPassword(currentPassword)) {
      throw new Error('Current password is incorrect');
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      throw new Error('New password must be at least 4 characters long');
    }

    const { salt, hash } = this.hashPassword(newPassword.trim());
    this.authData.password = {
      hash,
      salt,
      algorithm: 'scrypt',
      isDefault: false,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return true;
  }

  isDefaultPassword() {
    return Boolean(this.authData.password && this.authData.password.isDefault);
  }

  // ==========================================
  // Session Management
  // ==========================================
  createSession() {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    this.sessions.set(token, {
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    });
    return token;
  }

  isValidSession(token) {
    if (!token || typeof token !== 'string') return false;
    const session = this.sessions.get(token);
    if (!session) return false;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return false;
    }
    return true;
  }

  destroySession(token) {
    if (token) {
      this.sessions.delete(token);
    }
  }

  // ==========================================
  // API Key Management
  // ==========================================
  generateApiKey(name) {
    const rawKey = `csk_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const prefix = `${rawKey.slice(0, 8)}...${rawKey.slice(-4)}`;
    const id = `key_${crypto.randomBytes(8).toString('hex')}`;

    const keyRecord = {
      id,
      name: (name && String(name).trim()) || 'Unnamed Key',
      prefix,
      keyHash,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      useCount: 0,
    };

    this.authData.apiKeys.unshift(keyRecord);
    this.save();

    return {
      id: keyRecord.id,
      name: keyRecord.name,
      prefix: keyRecord.prefix,
      rawKey,
      status: keyRecord.status,
      createdAt: keyRecord.createdAt,
    };
  }

  listApiKeys() {
    return this.authData.apiKeys.map((k) => ({
      id: k.id,
      name: k.name,
      prefix: k.prefix,
      status: k.status,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      useCount: k.useCount || 0,
    }));
  }

  revokeApiKey(id) {
    const key = this.authData.apiKeys.find((k) => k.id === id);
    if (!key) {
      throw new Error('API key not found');
    }
    key.status = 'revoked';
    key.revokedAt = new Date().toISOString();
    this.save();
    return true;
  }

  deleteApiKey(id) {
    const index = this.authData.apiKeys.findIndex((k) => k.id === id);
    if (index === -1) {
      throw new Error('API key not found');
    }
    this.authData.apiKeys.splice(index, 1);
    this.save();
    return true;
  }

  verifyApiKey(candidateRawKey) {
    if (!candidateRawKey || typeof candidateRawKey !== 'string') {
      return null;
    }
    const cleanKey = candidateRawKey.trim();
    if (!cleanKey.startsWith('csk_') && cleanKey.length < 16) {
      return null;
    }

    const candidateHash = crypto.createHash('sha256').update(cleanKey).digest('hex');
    const candidateBuffer = Buffer.from(candidateHash, 'hex');

    for (const key of this.authData.apiKeys) {
      if (key.status !== 'active') continue;
      const storedBuffer = Buffer.from(key.keyHash, 'hex');
      if (candidateBuffer.length === storedBuffer.length && crypto.timingSafeEqual(candidateBuffer, storedBuffer)) {
        // Record usage
        key.lastUsedAt = new Date().toISOString();
        key.useCount = (key.useCount || 0) + 1;
        // Save asynchronously/debounced to avoid blocking request
        setTimeout(() => this.save(), 500);
        return key;
      }
    }

    return null;
  }
}

export const authService = new AuthService();

// Helper to parse cookies without external dependencies
export function parseCookies(req) {
  const list = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const key = parts.shift().trim();
    const val = decodeURIComponent(parts.join('=')).trim();
    if (key) list[key] = val;
  });

  return list;
}

// Helper to extract session token from cookie or Authorization header
export function extractSessionToken(req) {
  const cookies = parseCookies(req);
  if (cookies[SESSION_COOKIE_NAME]) {
    return cookies[SESSION_COOKIE_NAME];
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

// Helper to set session cookie
export function setSessionCookie(res, token) {
  const maxAgeSec = Math.floor(SESSION_TTL_MS / 1000);
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}`
  );
}

// Helper to clear session cookie
export function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  );
}

// Middleware: Require WebUI Admin Session
export function requireWebAuth(req, res, next) {
  const token = extractSessionToken(req);
  if (authService.isValidSession(token)) {
    req.sessionToken = token;
    return next();
  }
  res.status(401).json({
    success: false,
    error: 'Authentication required. Please log in to access the control panel.',
  });
}

// Middleware: Require API Key (or active WebUI Session)
export function requireApiKey(req, res, next) {
  // 1. If user has active WebUI session, allow access
  const sessionToken = extractSessionToken(req);
  if (authService.isValidSession(sessionToken)) {
    req.authType = 'session';
    return next();
  }

  // 2. Check X-API-Key header
  let candidate = req.headers['x-api-key'];

  // 3. Check Authorization header: Bearer <key>
  if (!candidate && req.headers.authorization) {
    const authHeader = req.headers.authorization.trim();
    if (authHeader.startsWith('Bearer ')) {
      candidate = authHeader.slice(7).trim();
    }
  }

  // 4. Check query parameters: api_key or key
  if (!candidate && req.query) {
    candidate = req.query.api_key || req.query.key || req.query.apiKey;
  }

  if (candidate) {
    const validKey = authService.verifyApiKey(candidate);
    if (validKey) {
      req.authType = 'api_key';
      req.apiKeyRecord = validKey;
      return next();
    }
  }

  return res.status(401).json({
    success: false,
    error: "API key required or invalid. Provide a valid key via 'X-API-Key' header, 'Authorization: Bearer <key>', or '?api_key=<key>' query parameter.",
  });
}
