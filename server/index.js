import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const PORT = process.env.PORT || 5174;
const HL_PRIVATE_API_KEY = process.env.HL_PRIVATE_API_KEY;
const HL_LOCATION_ID = process.env.HL_LOCATION_ID;
const CUSTOM_VALUE_MAP = parseCustomValueIds(process.env.HL_CUSTOM_VALUE_IDS || '');
const API_BASE = 'https://services.leadconnectorhq.com';

if (!HL_PRIVATE_API_KEY || !HL_LOCATION_ID) {
  console.warn('[server] Missing HL_PRIVATE_API_KEY or HL_LOCATION_ID. API routes will respond with 500.');
}

const app = express();
app.use(express.json());

app.get('/api/custom-values', async (req, res) => {
  try {
    ensureConfig();
    const ids = Object.values(CUSTOM_VALUE_MAP);
    if (!ids.length) {
      return res.json({ values: {} });
    }

    const url = `${API_BASE}/locations/${HL_LOCATION_ID}/customValues?limit=200`;
    const data = await requestHighLevel(url);
    const values = {};

    if (Array.isArray(data?.data)) {
      for (const entry of data.data) {
        const key = findKeyById(entry.id);
        if (key) {
          values[key] = entry.value ?? '';
        }
      }
    }

    return res.json({ values });
  } catch (error) {
    console.error('[server] Failed to fetch custom values', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to fetch custom values' });
  }
});

app.put('/api/custom-values', async (req, res) => {
  try {
    ensureConfig();
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Request body must be a JSON object' });
    }

    const incoming = req.body.values || req.body;
    const customValues = Object.entries(incoming)
      .map(([key, value]) => ({ key, id: CUSTOM_VALUE_MAP[key], value: value ?? '' }))
      .filter(entry => !!entry.id)
      .map(({ id, value }) => ({ id, value }));

    if (!customValues.length) {
      return res.status(400).json({ error: 'No valid fields supplied for update' });
    }

    const url = `${API_BASE}/locations/${HL_LOCATION_ID}/customValues/bulk`;
    await requestHighLevel(url, {
      method: 'PUT',
      body: JSON.stringify({ customValues })
    });

    res.json({ success: true, values: incoming });
  } catch (error) {
    console.error('[server] Failed to update custom values', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update custom values' });
  }
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');
app.use(express.static(publicDir));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  return res.sendFile(path.join(publicDir, 'index.html'));
});

// Export app for Vercel
export default app;

// Only listen if run directly (not imported)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`[server] Listening on http://localhost:${PORT}`);
  });
}

function parseCustomValueIds(value) {
  return value
    .split(',')
    .map(chunk => chunk.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const [key, id] = pair.split(':').map(part => part.trim());
      if (key && id) {
        acc[key] = id;
      }
      return acc;
    }, {});
}

function findKeyById(id) {
  return Object.keys(CUSTOM_VALUE_MAP).find(key => CUSTOM_VALUE_MAP[key] === id);
}

function ensureConfig() {
  if (!HL_PRIVATE_API_KEY || !HL_LOCATION_ID) {
    const error = new Error('HighLevel credentials are not configured');
    error.statusCode = 500;
    throw error;
  }
}

async function requestHighLevel(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${HL_PRIVATE_API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Version: '2021-07-28'
    },
    body: options.body
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`HighLevel API error (${response.status}): ${body}`);
    error.statusCode = response.status;
    throw error;
  }

  if (response.status === 204) return {};

  return response.json();
}
