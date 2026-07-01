import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Pool } from 'pg';

const app = express();
const port = Number(process.env.PORT || 8787);
const databaseUrl = process.env.DATABASE_URL;

app.use(express.json({ limit: '12mb' }));

const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
    })
  : null;

let dbReady: Promise<void> | null = null;

const ensureDb = async () => {
  if (!pool) {
    throw new Error('DATABASE_URL is not configured.');
  }

  dbReady ||= pool.query(`
    create table if not exists scratch_reveals (
      id text primary key,
      manage_token text not null,
      payload jsonb not null,
      active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `).then(() => undefined);

  return dbReady;
};

const buildPublicUrl = (req: express.Request, pathAndQuery: string) => {
  const configuredUrl = process.env.APP_URL?.replace(/\/$/, '');
  const origin = configuredUrl || `${req.protocol}://${req.get('host')}`;
  return `${origin}${pathAndQuery}`;
};

const getManageReveal = async (id: string, token: string | undefined) => {
  await ensureDb();
  const result = await pool!.query(
    'select id, payload, active from scratch_reveals where id = $1 and manage_token = $2',
    [id, token || '']
  );
  return result.rows[0] as { id: string; payload: unknown; active: boolean } | undefined;
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, database: Boolean(pool) });
});

app.post('/api/reveals', async (req, res) => {
  try {
    await ensureDb();
    const payload = req.body?.payload;

    if (!payload || typeof payload !== 'object' || typeof payload.imageUrl !== 'string') {
      res.status(400).json({ error: 'Invalid reveal payload.' });
      return;
    }

    const id = crypto.randomUUID();
    const manageToken = crypto.randomBytes(24).toString('base64url');

    await pool!.query(
      'insert into scratch_reveals (id, manage_token, payload) values ($1, $2, $3::jsonb)',
      [id, manageToken, JSON.stringify(payload)]
    );

    res.status(201).json({
      id,
      active: true,
      shareUrl: buildPublicUrl(req, `/?r=${encodeURIComponent(id)}`),
      manageUrl: buildPublicUrl(req, `/?manage=${encodeURIComponent(id)}&token=${encodeURIComponent(manageToken)}`),
      manageToken
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not create reveal.' });
  }
});

app.get('/api/reveals/:id', async (req, res) => {
  try {
    await ensureDb();
    const result = await pool!.query(
      'select payload, active from scratch_reveals where id = $1',
      [req.params.id]
    );
    const reveal = result.rows[0] as { payload: unknown; active: boolean } | undefined;

    if (!reveal) {
      res.status(404).json({ error: 'Reveal not found.' });
      return;
    }

    if (!reveal.active) {
      res.status(410).json({ error: 'This scratch reveal is currently switched off.' });
      return;
    }

    res.json({ payload: reveal.payload, active: reveal.active });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load reveal.' });
  }
});

app.get('/api/reveals/:id/manage', async (req, res) => {
  try {
    const reveal = await getManageReveal(req.params.id, String(req.query.token || ''));
    if (!reveal) {
      res.status(404).json({ error: 'Reveal not found.' });
      return;
    }

    res.json(reveal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load reveal management.' });
  }
});

app.patch('/api/reveals/:id', async (req, res) => {
  try {
    await ensureDb();
    const active = Boolean(req.body?.active);
    const token = String(req.body?.token || '');

    const result = await pool!.query(
      `update scratch_reveals
       set active = $1, updated_at = now()
       where id = $2 and manage_token = $3
       returning id, active`,
      [active, req.params.id, token]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Reveal not found.' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not update reveal.' });
  }
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../dist');

app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Scratch reveal server running on port ${port}`);
});
