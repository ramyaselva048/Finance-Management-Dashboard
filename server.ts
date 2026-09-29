import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET =
  process.env.JWT_SECRET || 'azia-finance-production-jwt-secret-key-2026';

// User-provided Neon PostgreSQL Connection String
const USER_NEON_DB_URL =
  'postgresql://neondb_owner:npg_sk1xpQ7jwdNb@ep-gentle-bird-b3h92gmz-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

function getEffectiveDbUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  if (
    envUrl &&
    !envUrl.includes('@host/') &&
    !envUrl.includes('user:password@host') &&
    !envUrl.includes('localhost:5432')
  ) {
    return envUrl;
  }
  return USER_NEON_DB_URL;
}

function normalizePgConnectionString(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.searchParams.delete('channel_binding');
    return url.toString();
  } catch {
    return rawUrl;
  }
}

let isPgConnected = false;

let pool: pg.Pool | null = null;
try {
  pool = new pg.Pool({
    connectionString: normalizePgConnectionString(getEffectiveDbUrl()),
    ssl: { rejectUnauthorized: false },
    max: 6,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 5000,
    keepAlive: true,
  });

  pool.on('error', (err) => {
    console.warn('Neon PostgreSQL pool error (in-memory fallback active):', err.message);
    isPgConnected = false;
  });
} catch (err: any) {
  console.warn('Neon PostgreSQL pool initialization failed, using in-memory mock:', err.message);
}

export interface StoredUser {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: string;
  resetCode?: string | null;
  resetCodeExpiresAt?: number | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
  fullName: string;
  role: string;
  jti: string;
  iat: number;
  exp: number;
}

// Fast in-memory revoked JTI set (also persisted to Neon PostgreSQL azia_revoked_tokens)
const revokedTokenJtis = new Set<string>();

// Initial Reference Financial Records
const INITIAL_SEED_RECORDS = [
  {
    id: 'inc-1',
    type: 'income',
    title: 'Enterprise SaaS Annual Subscriptions',
    category: 'Subscription Revenue',
    counterparty: 'Global Tech Corp',
    amount: 34500.0,
    date: '2026-09-25',
    status: 'completed',
    isDirectCost: false,
    notes: 'Q3 Enterprise licensing tier renewal',
  },
  {
    id: 'inc-2',
    type: 'income',
    title: 'Cloud Infrastructure Consulting Retainer',
    category: 'Professional Services',
    counterparty: 'Meridian Financial Group',
    amount: 21420.5,
    date: '2026-09-19',
    status: 'completed',
    isDirectCost: false,
    notes: 'Monthly advisory and architecture optimization',
  },
  {
    id: 'inc-3',
    type: 'income',
    title: 'Platform API Usage & Overages',
    category: 'Usage Revenue',
    counterparty: 'Apex Logistics Inc.',
    amount: 15800.0,
    date: '2026-09-12',
    status: 'completed',
    isDirectCost: false,
    notes: 'High-volume telemetry API processing',
  },
  {
    id: 'inc-4',
    type: 'income',
    title: 'Custom Data Analytics Integration',
    category: 'Implementation',
    counterparty: 'Vanguard Retail Partners',
    amount: 11600.0,
    date: '2026-09-04',
    status: 'completed',
    isDirectCost: false,
    notes: 'Phase 2 dashboard deployment milestone',
  },
  {
    id: 'exp-1',
    type: 'expense',
    title: 'Production Cloud Hosting & GPU Clusters',
    category: 'Cloud Infrastructure',
    counterparty: 'AWS Cloud Services',
    amount: 12830.13,
    date: '2026-09-24',
    status: 'completed',
    isDirectCost: true,
    notes: 'Primary multi-region compute & database nodes',
  },
  {
    id: 'exp-2',
    type: 'expense',
    title: 'Core Engineering & DevOps Payroll Allocation',
    category: 'Direct Labor',
    counterparty: 'Internal Payroll',
    amount: 8000.0,
    date: '2026-09-18',
    status: 'completed',
    isDirectCost: true,
    notes: 'Platform reliability & customer delivery team',
  },
  {
    id: 'exp-3',
    type: 'expense',
    title: 'Executive Office Lease & Operations',
    category: 'Facilities & Admin',
    counterparty: 'Brookfield Properties',
    amount: 6840.0,
    date: '2026-09-10',
    status: 'completed',
    isDirectCost: false,
    notes: 'Monthly headquarters lease and utilities',
  },
  {
    id: 'exp-4',
    type: 'expense',
    title: 'Performance Marketing & Lead Acquisition',
    category: 'Marketing',
    counterparty: 'AdRoll & Search Partners',
    amount: 4699.87,
    date: '2026-09-03',
    status: 'completed',
    isDirectCost: false,
    notes: 'Q3 enterprise demand generation campaign',
  },
  {
    id: 'rec-1',
    type: 'receivable',
    title: 'Invoice #INV-2094 — Annual Seat Expansion',
    category: 'Accounts Receivable',
    counterparty: 'Northstar Healthcare',
    amount: 4250.0,
    date: '2026-09-27',
    status: 'pending',
    isDirectCost: false,
    notes: 'Net-30 invoice due October 15',
  },
  {
    id: 'rec-2',
    type: 'receivable',
    title: 'Invoice #INV-2089 — Custom Security Audit',
    category: 'Accounts Receivable',
    counterparty: 'Solstice Energy Ltd.',
    amount: 3112.0,
    date: '2026-09-21',
    status: 'pending',
    isDirectCost: false,
    notes: 'Awaiting wire settlement from AP department',
  },
  {
    id: 'rec-3',
    type: 'receivable',
    title: 'Invoice #INV-2076 — Q3 SLA Support Add-on',
    category: 'Accounts Receivable',
    counterparty: 'Kestrel Media Group',
    amount: 1750.0,
    date: '2026-09-08',
    status: 'overdue',
    isDirectCost: false,
    notes: 'Follow-up reminder sent to billing contact',
  },
  {
    id: 'pay-1',
    type: 'payable',
    title: 'Bill #AP-884 — SOC2 Type II Compliance Audit',
    category: 'Accounts Payable',
    counterparty: 'Deloitte Risk Advisory',
    amount: 4100.0,
    date: '2026-09-26',
    status: 'pending',
    isDirectCost: false,
    notes: 'Scheduled for automated ACH payment',
  },
  {
    id: 'pay-2',
    type: 'payable',
    title: 'Bill #AP-879 — Enterprise SaaS Licenses (CRM)',
    category: 'Accounts Payable',
    counterparty: 'Salesforce Inc.',
    amount: 2616.0,
    date: '2026-09-16',
    status: 'pending',
    isDirectCost: false,
    notes: 'Quarterly sales team license renewal',
  },
  {
    id: 'pay-3',
    type: 'payable',
    title: 'Bill #AP-865 — Legal Retainer & IP Filing',
    category: 'Accounts Payable',
    counterparty: 'Cooley LLP',
    amount: 1500.0,
    date: '2026-09-07',
    status: 'pending',
    isDirectCost: false,
    notes: 'Corporate governance & contract review',
  },
];

// --- Cryptographic Password Hashing (Node crypto.scrypt) ---
function hashPassword(plainPassword: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

function verifyPassword(plainPassword: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuffer = Buffer.from(keyHex, 'hex');
  const derivedBuffer = crypto.scryptSync(plainPassword, salt, 64);
  if (keyBuffer.length !== derivedBuffer.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
}

// --- In-Memory Fallback Data Store (Resilient layer) ---
const inMemoryUsers = new Map<string, StoredUser>();
let inMemoryAccountInfo = {
  holderName: 'Alicia Christensen',
  accountType: 'Savings',
  cardNumberPrefix: '4532 •••• ••••',
  lastFour: '5637',
  baseBalance: 729609.5,
};
let inMemoryFinancialRecords: any[] = JSON.parse(JSON.stringify(INITIAL_SEED_RECORDS));

// Default CFO user seeded into inMemoryUsers
const defaultCfo: StoredUser = {
  id: 'usr-alicia-01',
  fullName: 'Alicia Christensen',
  email: 'alicia@aziafinance.com',
  passwordHash: hashPassword('Finance@2026'),
  role: 'Chief Financial Officer',
  createdAt: new Date().toISOString(),
  resetCode: null,
  resetCodeExpiresAt: null,
};
inMemoryUsers.set(defaultCfo.email.toLowerCase(), defaultCfo);
inMemoryUsers.set(defaultCfo.id, defaultCfo);

// --- Standard HMAC-SHA256 JWT Implementation ---
function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

function signJwt(
  user: { id: string; email: string; fullName: string; role: string },
  expiresInSeconds: number
): { token: string; expiresAt: number; jti: string } {
  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = nowSec + expiresInSeconds;
  const jti = crypto.randomBytes(12).toString('hex');

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    jti,
    iat: nowSec,
    exp: expSec,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signingInput)
    .digest();
  const encodedSignature = base64UrlEncode(signature);

  return {
    token: `${signingInput}.${encodedSignature}`,
    expiresAt: expSec * 1000,
    jti,
  };
}

function verifyJwtFast(
  token: string
): { valid: boolean; payload?: JwtPayload; reason?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, reason: 'Malformed authentication token.' };
    }
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSig = base64UrlEncode(
      crypto.createHmac('sha256', JWT_SECRET).update(signingInput).digest()
    );

    const sigBuf = Buffer.from(encodedSignature);
    const expectedBuf = Buffer.from(expectedSig);
    if (
      sigBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return { valid: false, reason: 'Invalid token signature.' };
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JwtPayload;
    const nowSec = Math.floor(Date.now() / 1000);

    if (!payload.exp || nowSec >= payload.exp) {
      return { valid: false, reason: 'Session has expired. Please sign in again.' };
    }

    if (revokedTokenJtis.has(payload.jti)) {
      return { valid: false, reason: 'Session has been logged out or revoked.' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, reason: 'Invalid authentication token.' };
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('azia_token='));
    if (match) {
      return decodeURIComponent(match.split('=')[1]);
    }
  }
  return null;
}

function validatePasswordStrength(password: string): string | null {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one special character (e.g., @, #, $, !).';
  }
  return null;
}

function mapDbUser(row: any): StoredUser {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
    resetCode: row.reset_code,
    resetCodeExpiresAt: row.reset_code_expires_at
      ? Number(row.reset_code_expires_at)
      : null,
  };
}

function mapDbRecord(row: any) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    category: row.category,
    counterparty: row.counterparty,
    amount: Number(row.amount),
    date: row.date,
    status: row.status,
    isDirectCost: Boolean(row.is_direct_cost),
    notes: row.notes || '',
  };
}

// --- Initialize & Seed Neon PostgreSQL Tables ---
async function initNeonDatabase(): Promise<void> {
  if (!pool) return;
  let client: pg.PoolClient | null = null;
  try {
    client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS azia_users (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Finance Manager',
        reset_code TEXT,
        reset_code_expires_at BIGINT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS azia_revoked_tokens (
        jti TEXT PRIMARY KEY,
        revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS azia_account_info (
        id INT PRIMARY KEY DEFAULT 1,
        holder_name TEXT NOT NULL,
        account_type TEXT NOT NULL,
        card_number_prefix TEXT NOT NULL,
        last_four TEXT NOT NULL,
        base_balance NUMERIC(15, 2) NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS azia_app_meta (
        meta_key TEXT PRIMARY KEY,
        meta_value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS azia_financial_records (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        counterparty TEXT NOT NULL,
        amount NUMERIC(15, 2) NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        is_direct_cost BOOLEAN NOT NULL DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Load revoked tokens into memory
    const revRes = await client.query('SELECT jti FROM azia_revoked_tokens');
    for (const r of revRes.rows) {
      revokedTokenJtis.add(r.jti);
    }

    // 1. Ensure default CFO user exists in Neon
    const defaultUserCheck = await client.query(
      'SELECT id FROM azia_users WHERE email = $1',
      ['alicia@aziafinance.com']
    );
    if (defaultUserCheck.rowCount === 0) {
      await client.query(
        `INSERT INTO azia_users (id, full_name, email, password_hash, role, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          'usr-alicia-01',
          'Alicia Christensen',
          'alicia@aziafinance.com',
          hashPassword('Finance@2026'),
          'Chief Financial Officer',
        ]
      );
    }

    // 2. Ensure default Account Info exists in Neon
    const accountCheck = await client.query(
      'SELECT id FROM azia_account_info WHERE id = 1'
    );
    if (accountCheck.rowCount === 0) {
      await client.query(
        `INSERT INTO azia_account_info (id, holder_name, account_type, card_number_prefix, last_four, base_balance)
         VALUES (1, $1, $2, $3, $4, $5)`,
        ['Alicia Christensen', 'Savings', '4532 •••• ••••', '5637', 729609.5]
      );
    }

    // 3. Seed Initial Financial Records ONLY once if never seeded before
    const seedMetaCheck = await client.query(
      "SELECT meta_value FROM azia_app_meta WHERE meta_key = 'initial_seed_v1'"
    );
    if (seedMetaCheck.rowCount === 0) {
      const recordsCount = await client.query(
        'SELECT COUNT(*)::int AS cnt FROM azia_financial_records'
      );
      if (recordsCount.rows[0].cnt === 0) {
        for (const rec of INITIAL_SEED_RECORDS) {
          await client.query(
            `INSERT INTO azia_financial_records
             (id, type, title, category, counterparty, amount, date, status, is_direct_cost, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO NOTHING`,
            [
              rec.id,
              rec.type,
              rec.title,
              rec.category,
              rec.counterparty,
              rec.amount,
              rec.date,
              rec.status,
              rec.isDirectCost,
              rec.notes,
            ]
          );
        }
      }
      await client.query(
        "INSERT INTO azia_app_meta (meta_key, meta_value) VALUES ('initial_seed_v1', 'completed') ON CONFLICT (meta_key) DO NOTHING"
      );
    }

    // Populate inMemory store from Neon database
    const usersRes = await client.query('SELECT * FROM azia_users');
    for (const row of usersRes.rows) {
      const u = mapDbUser(row);
      inMemoryUsers.set(u.email.toLowerCase(), u);
      inMemoryUsers.set(u.id, u);
    }

    const accRes = await client.query('SELECT * FROM azia_account_info WHERE id = 1');
    if (accRes.rowCount && accRes.rowCount > 0) {
      const r = accRes.rows[0];
      inMemoryAccountInfo = {
        holderName: r.holder_name,
        accountType: r.account_type,
        cardNumberPrefix: r.card_number_prefix,
        lastFour: r.last_four,
        baseBalance: Number(r.base_balance),
      };
    }

    const recsRes = await client.query(
      'SELECT * FROM azia_financial_records ORDER BY date DESC, created_at DESC'
    );
    if (recsRes.rowCount && recsRes.rowCount > 0) {
      inMemoryFinancialRecords = recsRes.rows.map(mapDbRecord);
    }

    isPgConnected = true;
    console.log('Neon PostgreSQL database initialized and synchronized.');
  } catch (err: any) {
    isPgConnected = false;
    console.warn('Neon DB not reachable (' + err.message + '). Active in-memory fallback enabled.');
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Initialize Neon PostgreSQL in background so server binds port 3000 immediately
  initNeonDatabase().catch((err) => {
    console.warn('Neon DB background initialization message:', err.message);
  });

  // Fast Auth Middleware
  const requireAuth = (
    req: Request & { tokenPayload?: JwtPayload; rawToken?: string },
    res: Response,
    next: NextFunction
  ) => {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: 'Authentication required. Please log in.' });
      return;
    }

    const verification = verifyJwtFast(token);
    if (!verification.valid || !verification.payload) {
      res
        .status(401)
        .json({ error: verification.reason || 'Invalid or expired session.' });
      return;
    }

    req.tokenPayload = verification.payload;
    req.rawToken = token;
    next();
  };

  // ==================== DATABASE HEALTH ENDPOINT ====================
  app.get('/api/db/status', async (_req: Request, res: Response) => {
    try {
      if (pool) {
        const result = await pool.query(
          'SELECT current_database() AS db, NOW() AS server_time, (SELECT COUNT(*)::int FROM azia_financial_records) AS record_count, (SELECT COUNT(*)::int FROM azia_users) AS user_count'
        );
        isPgConnected = true;
        res.json({
          connected: true,
          provider: 'Neon PostgreSQL',
          database: result.rows[0].db,
          serverTime: result.rows[0].server_time,
          recordCount: result.rows[0].record_count,
          userCount: result.rows[0].user_count,
        });
        return;
      }
    } catch (err: any) {
      console.error('db status query error:', err.message);
      isPgConnected = false;
      res.json({
        connected: false,
        error: err.message,
        provider: 'In-Memory Store (Resilient Fallback Active)',
        database: 'in-memory',
        serverTime: new Date().toISOString(),
        recordCount: inMemoryFinancialRecords.length,
        userCount: inMemoryUsers.size,
      });
      return;
    }

    res.json({
      connected: false,
      provider: 'In-Memory Store (Resilient Fallback Active)',
      database: 'in-memory',
      serverTime: new Date().toISOString(),
      recordCount: inMemoryFinancialRecords.length,
      userCount: inMemoryUsers.size,
    });
  });

  // ==================== AUTH ENDPOINTS ====================

  // 1. REGISTER
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { fullName, email, password, confirmPassword } = req.body || {};

      if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
        res
          .status(400)
          .json({ error: 'Please enter your full name (minimum 2 characters).' });
        return;
      }

      const normalizedEmail =
        typeof email === 'string' ? email.trim().toLowerCase() : '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
        res
          .status(400)
          .json({ error: 'Please enter a valid work or personal email address.' });
        return;
      }

      const strengthError = validatePasswordStrength(password);
      if (strengthError) {
        res.status(400).json({ error: strengthError });
        return;
      }

      if (password !== confirmPassword) {
        res
          .status(400)
          .json({ error: 'Passwords do not match. Please confirm your password.' });
        return;
      }

      // Check if user already exists in memory or DB
      let alreadyExists = inMemoryUsers.has(normalizedEmail);
      if (pool && isPgConnected) {
        try {
          const existing = await pool.query(
            'SELECT id FROM azia_users WHERE LOWER(email) = $1',
            [normalizedEmail]
          );
          if (existing.rowCount && existing.rowCount > 0) {
            alreadyExists = true;
          }
        } catch {
          isPgConnected = false;
        }
      }

      if (alreadyExists) {
        res.status(409).json({
          error:
            'An account with this email address is already registered. Please sign in instead.',
        });
        return;
      }

      const id = `usr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const passwordHash = hashPassword(password);
      const role = 'Finance Manager';
      const createdAt = new Date().toISOString();

      const newUser: StoredUser = {
        id,
        fullName: fullName.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
        createdAt,
        resetCode: null,
        resetCodeExpiresAt: null,
      };

      inMemoryUsers.set(normalizedEmail, newUser);
      inMemoryUsers.set(id, newUser);

      if (pool && isPgConnected) {
        try {
          await pool.query(
            `INSERT INTO azia_users (id, full_name, email, password_hash, role, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [id, fullName.trim(), normalizedEmail, passwordHash, role]
          );
        } catch (e: any) {
          console.warn('Could not persist user to Neon DB, stored in memory:', e.message);
          isPgConnected = false;
        }
      }

      res.status(201).json({
        message: 'Account registered successfully! You can now sign in.',
        user: {
          id: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Database error during registration.' });
    }
  });

  // 2. LOGIN
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password, rememberMe } = req.body || {};
      const normalizedEmail =
        typeof email === 'string' ? email.trim().toLowerCase() : '';

      if (!normalizedEmail || !password) {
        res
          .status(400)
          .json({ error: 'Please enter both your email address and password.' });
        return;
      }

      let user: StoredUser | null = null;
      if (pool && isPgConnected) {
        try {
          const userRes = await pool.query(
            'SELECT * FROM azia_users WHERE LOWER(email) = $1',
            [normalizedEmail]
          );
          if (userRes.rowCount && userRes.rowCount > 0) {
            user = mapDbUser(userRes.rows[0]);
            inMemoryUsers.set(user.email.toLowerCase(), user);
            inMemoryUsers.set(user.id, user);
          }
        } catch {
          isPgConnected = false;
        }
      }

      if (!user) {
        user = inMemoryUsers.get(normalizedEmail) || null;
      }

      if (!user || !verifyPassword(password, user.passwordHash)) {
        res.status(401).json({
          error:
            'Invalid email or password. Please check your credentials and try again.',
        });
        return;
      }

      const expiresInSeconds = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
      const { token, expiresAt } = signJwt(user, expiresInSeconds);

      res.setHeader(
        'Set-Cookie',
        `azia_token=${encodeURIComponent(
          token
        )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${expiresInSeconds}`
      );

      res.json({
        message: 'Login successful.',
        token,
        expiresAt,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Database error during login.' });
    }
  });

  // 3. LOGOUT
  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    const token = extractToken(req);
    if (token) {
      const verification = verifyJwtFast(token);
      if (verification.payload?.jti) {
        revokedTokenJtis.add(verification.payload.jti);
        if (pool && isPgConnected) {
          pool
            .query(
              'INSERT INTO azia_revoked_tokens (jti) VALUES ($1) ON CONFLICT DO NOTHING',
              [verification.payload.jti]
            )
            .catch(() => {});
        }
      }
    }

    res.setHeader(
      'Set-Cookie',
      'azia_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
    );
    res.json({ message: 'You have been securely logged out.' });
  });

  // 4. GET CURRENT SESSION (/api/auth/me)
  app.get(
    '/api/auth/me',
    requireAuth,
    async (req: Request & { tokenPayload?: JwtPayload }, res: Response) => {
      try {
        const payload = req.tokenPayload!;
        let user: StoredUser | null = inMemoryUsers.get(payload.sub) || inMemoryUsers.get(payload.email.toLowerCase()) || null;

        if (pool && isPgConnected) {
          try {
            const userRes = await pool.query(
              'SELECT * FROM azia_users WHERE id = $1',
              [payload.sub]
            );
            if (userRes.rowCount && userRes.rowCount > 0) {
              user = mapDbUser(userRes.rows[0]);
              inMemoryUsers.set(user.email.toLowerCase(), user);
              inMemoryUsers.set(user.id, user);
            }
          } catch {
            isPgConnected = false;
          }
        }

        if (user) {
          res.json({
            user: {
              id: user.id,
              fullName: user.fullName,
              email: user.email,
              role: user.role,
              createdAt: user.createdAt,
            },
            expiresAt: payload.exp * 1000,
          });
          return;
        }

        // Fallback to verified JWT claims
        res.json({
          user: {
            id: payload.sub,
            fullName: payload.fullName,
            email: payload.email,
            role: payload.role,
            createdAt: new Date(payload.iat * 1000).toISOString(),
          },
          expiresAt: payload.exp * 1000,
        });
      } catch {
        const payload = req.tokenPayload!;
        res.json({
          user: {
            id: payload.sub,
            fullName: payload.fullName,
            email: payload.email,
            role: payload.role,
            createdAt: new Date(payload.iat * 1000).toISOString(),
          },
          expiresAt: payload.exp * 1000,
        });
      }
    }
  );

  // 5. UPDATE USER PROFILE (/api/auth/profile)
  app.put(
    '/api/auth/profile',
    requireAuth,
    async (req: Request & { tokenPayload?: JwtPayload }, res: Response) => {
      try {
        const { fullName, email, role, currentPassword, newPassword } =
          req.body || {};
        const userId = req.tokenPayload!.sub;

        let user: StoredUser | null = inMemoryUsers.get(userId) || null;
        if (pool && isPgConnected) {
          try {
            const userRes = await pool.query(
              'SELECT * FROM azia_users WHERE id = $1',
              [userId]
            );
            if (userRes.rowCount && userRes.rowCount > 0) {
              user = mapDbUser(userRes.rows[0]);
            }
          } catch {
            isPgConnected = false;
          }
        }

        if (!user) {
          res.status(404).json({ error: 'User not found.' });
          return;
        }

        let updatedName = user.fullName;
        let updatedEmail = user.email;
        let updatedRole = user.role;
        let updatedPasswordHash = user.passwordHash;

        if (fullName && typeof fullName === 'string' && fullName.trim().length >= 2) {
          updatedName = fullName.trim();
        }

        if (email && typeof email === 'string') {
          const normalizedEmail = email.trim().toLowerCase();
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(normalizedEmail)) {
            res.status(400).json({ error: 'Please provide a valid email address.' });
            return;
          }
          if (pool && isPgConnected) {
            try {
              const dup = await pool.query(
                'SELECT id FROM azia_users WHERE LOWER(email) = $1 AND id != $2',
                [normalizedEmail, user.id]
              );
              if (dup.rowCount && dup.rowCount > 0) {
                res.status(409).json({
                  error: 'That email address is already in use by another account.',
                });
                return;
              }
            } catch {
              isPgConnected = false;
            }
          }
          updatedEmail = normalizedEmail;
        }

        if (role && typeof role === 'string' && role.trim()) {
          updatedRole = role.trim();
        }

        if (newPassword) {
          if (
            !currentPassword ||
            !verifyPassword(currentPassword, user.passwordHash)
          ) {
            res.status(400).json({ error: 'Current password is incorrect.' });
            return;
          }
          const strengthErr = validatePasswordStrength(newPassword);
          if (strengthErr) {
            res.status(400).json({ error: strengthErr });
            return;
          }
          updatedPasswordHash = hashPassword(newPassword);
        }

        const updatedUser: StoredUser = {
          ...user,
          fullName: updatedName,
          email: updatedEmail,
          role: updatedRole,
          passwordHash: updatedPasswordHash,
        };

        inMemoryUsers.set(updatedUser.id, updatedUser);
        inMemoryUsers.set(updatedUser.email.toLowerCase(), updatedUser);
        inMemoryAccountInfo.holderName = updatedName;

        if (pool && isPgConnected) {
          try {
            await pool.query(
              `UPDATE azia_users
               SET full_name = $1, email = $2, role = $3, password_hash = $4
               WHERE id = $5`,
              [updatedName, updatedEmail, updatedRole, updatedPasswordHash, user.id]
            );
            await pool.query(
              `UPDATE azia_account_info SET holder_name = $1, updated_at = NOW() WHERE id = 1`,
              [updatedName]
            );
          } catch (e: any) {
            console.warn('Could not update user in Neon DB, updated in memory:', e.message);
            isPgConnected = false;
          }
        }

        res.json({
          message: 'Profile updated successfully.',
          user: {
            id: updatedUser.id,
            fullName: updatedUser.fullName,
            email: updatedUser.email,
            role: updatedUser.role,
            createdAt: updatedUser.createdAt,
          },
        });
      } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ error: 'Error updating profile.' });
      }
    }
  );

  // 6. FORGOT PASSWORD
  app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
    try {
      const { email } = req.body || {};
      const normalizedEmail =
        typeof email === 'string' ? email.trim().toLowerCase() : '';

      if (!normalizedEmail) {
        res
          .status(400)
          .json({ error: 'Please enter your registered email address.' });
        return;
      }

      let user: StoredUser | null = inMemoryUsers.get(normalizedEmail) || null;
      if (pool && isPgConnected) {
        try {
          const userRes = await pool.query(
            'SELECT * FROM azia_users WHERE LOWER(email) = $1',
            [normalizedEmail]
          );
          if (userRes.rowCount && userRes.rowCount > 0) {
            user = mapDbUser(userRes.rows[0]);
          }
        } catch {
          isPgConnected = false;
        }
      }

      if (!user) {
        res.status(404).json({
          error:
            'No account found with that email address. Please check the email or register a new account.',
        });
        return;
      }

      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000;

      user.resetCode = resetCode;
      user.resetCodeExpiresAt = expiresAt;
      inMemoryUsers.set(normalizedEmail, user);
      inMemoryUsers.set(user.id, user);

      if (pool && isPgConnected) {
        try {
          await pool.query(
            'UPDATE azia_users SET reset_code = $1, reset_code_expires_at = $2 WHERE LOWER(email) = $3',
            [resetCode, expiresAt, normalizedEmail]
          );
        } catch {
          isPgConnected = false;
        }
      }

      res.json({
        message: `Password reset verification code generated for ${normalizedEmail}.`,
        resetCode,
        expiresInMinutes: 15,
      });
    } catch (err) {
      console.error('Forgot password error:', err);
      res.status(500).json({ error: 'Error requesting password reset.' });
    }
  });

  // 7. RESET PASSWORD
  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    try {
      const { email, resetCode, newPassword, confirmPassword } = req.body || {};
      const normalizedEmail =
        typeof email === 'string' ? email.trim().toLowerCase() : '';

      if (!normalizedEmail || !resetCode || !newPassword) {
        res.status(400).json({
          error: 'Email, verification code, and new password are required.',
        });
        return;
      }

      const strengthError = validatePasswordStrength(newPassword);
      if (strengthError) {
        res.status(400).json({ error: strengthError });
        return;
      }

      if (newPassword !== confirmPassword) {
        res
          .status(400)
          .json({ error: 'New password and confirm password do not match.' });
        return;
      }

      let user: StoredUser | null = inMemoryUsers.get(normalizedEmail) || null;
      if (pool && isPgConnected) {
        try {
          const userRes = await pool.query(
            'SELECT * FROM azia_users WHERE LOWER(email) = $1',
            [normalizedEmail]
          );
          if (userRes.rowCount && userRes.rowCount > 0) {
            user = mapDbUser(userRes.rows[0]);
          }
        } catch {
          isPgConnected = false;
        }
      }

      if (!user) {
        res.status(404).json({ error: 'Account not found.' });
        return;
      }

      if (
        !user.resetCode ||
        user.resetCode !== String(resetCode).trim() ||
        !user.resetCodeExpiresAt ||
        Date.now() > user.resetCodeExpiresAt
      ) {
        res.status(400).json({
          error:
            'Invalid or expired verification code. Please request a new password reset code.',
        });
        return;
      }

      const newHash = hashPassword(newPassword);
      user.passwordHash = newHash;
      user.resetCode = null;
      user.resetCodeExpiresAt = null;
      inMemoryUsers.set(normalizedEmail, user);
      inMemoryUsers.set(user.id, user);

      if (pool && isPgConnected) {
        try {
          await pool.query(
            `UPDATE azia_users
             SET password_hash = $1, reset_code = NULL, reset_code_expires_at = NULL
             WHERE id = $2`,
            [newHash, user.id]
          );
        } catch {
          isPgConnected = false;
        }
      }

      res.json({
        message:
          'Your password has been reset successfully. Please sign in with your new password.',
      });
    } catch (err) {
      console.error('Reset password error:', err);
      res.status(500).json({ error: 'Error resetting password.' });
    }
  });

  // 8. EXPIRE SESSION
  app.post(
    '/api/auth/expire-session',
    requireAuth,
    async (req: Request & { tokenPayload?: JwtPayload }, res: Response) => {
      if (req.tokenPayload?.jti) {
        revokedTokenJtis.add(req.tokenPayload.jti);
        if (pool && isPgConnected) {
          pool
            .query(
              'INSERT INTO azia_revoked_tokens (jti) VALUES ($1) ON CONFLICT DO NOTHING',
              [req.tokenPayload.jti]
            )
            .catch(() => {});
        }
      }
      res.setHeader(
        'Set-Cookie',
        'azia_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
      );
      res.json({ message: 'Session has been expired on the server.' });
    }
  );

  // ==================== FINANCE & ACCOUNT CRUD ENDPOINTS ====================

  // GET full financial state
  app.get('/api/finance/state', requireAuth, async (_req: Request, res: Response) => {
    try {
      if (pool && isPgConnected) {
        try {
          const [recordsRes, accountRes] = await Promise.all([
            pool.query(
              'SELECT * FROM azia_financial_records ORDER BY date DESC, created_at DESC'
            ),
            pool.query('SELECT * FROM azia_account_info WHERE id = 1'),
          ]);

          const accRow = accountRes.rows[0];
          const accountInfo = accRow
            ? {
                holderName: accRow.holder_name,
                accountType: accRow.account_type,
                cardNumberPrefix: accRow.card_number_prefix,
                lastFour: accRow.last_four,
                baseBalance: Number(accRow.base_balance),
              }
            : inMemoryAccountInfo;

          const records = recordsRes.rows.map(mapDbRecord);
          inMemoryFinancialRecords = records;
          inMemoryAccountInfo = accountInfo;

          res.json({
            connected: true,
            database: 'neondb (Neon PostgreSQL)',
            records,
            accountInfo,
          });
          return;
        } catch (e: any) {
          console.warn('Neon DB query failed, falling back to memory:', e.message);
          isPgConnected = false;
        }
      }

      res.json({
        connected: false,
        database: 'In-Memory Store (Resilient Fallback)',
        records: inMemoryFinancialRecords,
        accountInfo: inMemoryAccountInfo,
      });
    } catch (err) {
      console.error('Error fetching finance state:', err);
      res.json({
        connected: false,
        database: 'In-Memory Store (Resilient Fallback)',
        records: inMemoryFinancialRecords,
        accountInfo: inMemoryAccountInfo,
      });
    }
  });

  // CREATE a new financial record
  app.post('/api/finance/records', requireAuth, async (req: Request, res: Response) => {
    try {
      const {
        type,
        title,
        category,
        counterparty,
        amount,
        date,
        status,
        isDirectCost,
        notes,
      } = req.body || {};

      const id = `rec-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
      const newRecord = {
        id,
        type: type || 'income',
        title: title || 'Untitled Record',
        category: category || 'General',
        counterparty: counterparty || 'Counterparty',
        amount: Number(amount) || 0,
        date: date || '2026-09-28',
        status: status || 'completed',
        isDirectCost: Boolean(isDirectCost),
        notes: notes || '',
      };

      inMemoryFinancialRecords.unshift(newRecord);

      if (pool && isPgConnected) {
        try {
          await pool.query(
            `INSERT INTO azia_financial_records
             (id, type, title, category, counterparty, amount, date, status, is_direct_cost, notes, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
            [
              id,
              newRecord.type,
              newRecord.title,
              newRecord.category,
              newRecord.counterparty,
              newRecord.amount,
              newRecord.date,
              newRecord.status,
              newRecord.isDirectCost,
              newRecord.notes,
            ]
          );
        } catch (e: any) {
          console.warn('Could not insert record into Neon DB, stored in memory:', e.message);
          isPgConnected = false;
        }
      }

      res.status(201).json({
        record: newRecord,
        records: inMemoryFinancialRecords,
      });
    } catch (err) {
      console.error('Error inserting record:', err);
      res.status(500).json({ error: 'Failed to save financial record.' });
    }
  });

  // UPDATE an existing financial record
  app.put(
    '/api/finance/records/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const {
          type,
          title,
          category,
          counterparty,
          amount,
          date,
          status,
          isDirectCost,
          notes,
        } = req.body || {};

        const index = inMemoryFinancialRecords.findIndex((r) => r.id === id);
        if (index === -1) {
          res.status(404).json({ error: 'Record not found.' });
          return;
        }

        const updatedRecord = {
          ...inMemoryFinancialRecords[index],
          type: type ?? inMemoryFinancialRecords[index].type,
          title: title ?? inMemoryFinancialRecords[index].title,
          category: category ?? inMemoryFinancialRecords[index].category,
          counterparty: counterparty ?? inMemoryFinancialRecords[index].counterparty,
          amount: amount !== undefined ? Number(amount) : inMemoryFinancialRecords[index].amount,
          date: date ?? inMemoryFinancialRecords[index].date,
          status: status ?? inMemoryFinancialRecords[index].status,
          isDirectCost: isDirectCost !== undefined ? Boolean(isDirectCost) : inMemoryFinancialRecords[index].isDirectCost,
          notes: notes !== undefined ? notes : inMemoryFinancialRecords[index].notes,
        };

        inMemoryFinancialRecords[index] = updatedRecord;

        if (pool && isPgConnected) {
          try {
            await pool.query(
              `UPDATE azia_financial_records
               SET type = $1, title = $2, category = $3, counterparty = $4, amount = $5,
                   date = $6, status = $7, is_direct_cost = $8, notes = $9
               WHERE id = $10`,
              [
                updatedRecord.type,
                updatedRecord.title,
                updatedRecord.category,
                updatedRecord.counterparty,
                updatedRecord.amount,
                updatedRecord.date,
                updatedRecord.status,
                updatedRecord.isDirectCost,
                updatedRecord.notes,
                id,
              ]
            );
          } catch (e: any) {
            console.warn('Could not update record in Neon DB, updated in memory:', e.message);
            isPgConnected = false;
          }
        }

        res.json({
          record: updatedRecord,
          records: inMemoryFinancialRecords,
        });
      } catch (err) {
        console.error('Error updating record:', err);
        res.status(500).json({ error: 'Failed to update financial record.' });
      }
    }
  );

  // DELETE a financial record
  app.delete(
    '/api/finance/records/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        inMemoryFinancialRecords = inMemoryFinancialRecords.filter((r) => r.id !== id);

        if (pool && isPgConnected) {
          try {
            await pool.query('DELETE FROM azia_financial_records WHERE id = $1', [id]);
          } catch (e: any) {
            console.warn('Could not delete record from Neon DB, deleted in memory:', e.message);
            isPgConnected = false;
          }
        }

        res.json({
          deletedId: id,
          records: inMemoryFinancialRecords,
        });
      } catch (err) {
        console.error('Error deleting record:', err);
        res.status(500).json({ error: 'Failed to delete financial record.' });
      }
    }
  );

  // UPDATE Account Info
  app.put('/api/finance/account', requireAuth, async (req: Request, res: Response) => {
    try {
      const { holderName, accountType, cardNumberPrefix, lastFour, baseBalance } =
        req.body || {};

      inMemoryAccountInfo = {
        holderName: holderName || inMemoryAccountInfo.holderName,
        accountType: accountType || inMemoryAccountInfo.accountType,
        cardNumberPrefix: cardNumberPrefix || inMemoryAccountInfo.cardNumberPrefix,
        lastFour: lastFour || inMemoryAccountInfo.lastFour,
        baseBalance: baseBalance !== undefined ? Number(baseBalance) : inMemoryAccountInfo.baseBalance,
      };

      if (pool && isPgConnected) {
        try {
          await pool.query(
            `UPDATE azia_account_info
             SET holder_name = $1, account_type = $2, card_number_prefix = $3, last_four = $4, base_balance = $5, updated_at = NOW()
             WHERE id = 1`,
            [
              inMemoryAccountInfo.holderName,
              inMemoryAccountInfo.accountType,
              inMemoryAccountInfo.cardNumberPrefix,
              inMemoryAccountInfo.lastFour,
              inMemoryAccountInfo.baseBalance,
            ]
          );
        } catch (e: any) {
          console.warn('Could not update account in Neon DB, updated in memory:', e.message);
          isPgConnected = false;
        }
      }

      res.json({
        accountInfo: inMemoryAccountInfo,
      });
    } catch (err) {
      console.error('Error updating account info:', err);
      res.status(500).json({ error: 'Failed to update account info.' });
    }
  });

  // RESET financial records & account info back to initial reference state
  app.post(
    '/api/finance/reset',
    requireAuth,
    async (req: Request & { tokenPayload?: JwtPayload }, res: Response) => {
      try {
        const holderName = req.tokenPayload?.fullName || 'Alicia Christensen';
        inMemoryFinancialRecords = JSON.parse(JSON.stringify(INITIAL_SEED_RECORDS));
        inMemoryAccountInfo = {
          holderName,
          accountType: 'Savings',
          cardNumberPrefix: '4532 •••• ••••',
          lastFour: '5637',
          baseBalance: 729609.5,
        };

        if (pool && isPgConnected) {
          const client = await pool.connect();
          try {
            await client.query('BEGIN');
            await client.query('DELETE FROM azia_financial_records');
            for (const rec of INITIAL_SEED_RECORDS) {
              await client.query(
                `INSERT INTO azia_financial_records
                 (id, type, title, category, counterparty, amount, date, status, is_direct_cost, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                  rec.id,
                  rec.type,
                  rec.title,
                  rec.category,
                  rec.counterparty,
                  rec.amount,
                  rec.date,
                  rec.status,
                  rec.isDirectCost,
                  rec.notes,
                ]
              );
            }
            await client.query(
              `UPDATE azia_account_info
               SET holder_name = $1, account_type = 'Savings', card_number_prefix = '4532 •••• ••••', last_four = '5637', base_balance = 729609.50, updated_at = NOW()
               WHERE id = 1`,
              [holderName]
            );
            await client.query('COMMIT');
          } catch (e: any) {
            await client.query('ROLLBACK').catch(() => {});
            console.warn('Could not reset Neon DB, reset in memory only:', e.message);
            isPgConnected = false;
          } finally {
            client.release();
          }
        }

        res.json({
          records: inMemoryFinancialRecords,
          accountInfo: inMemoryAccountInfo,
        });
      } catch (err) {
        console.error('Error resetting financial data:', err);
        res.status(500).json({ error: 'Failed to reset financial records.' });
      }
    }
  );

  // Vite middleware in development, static assets in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `Azia Finance Monitoring Server running on http://0.0.0.0:${PORT}`
    );
  });
}

startServer();
