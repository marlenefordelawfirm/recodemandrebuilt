import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'https://services.leadconnectorhq.com';
const FIELD_GROUPS = [
  {
    label: 'Webinar',
    fields: [
      { key: 'webinar_date', name: 'Webinar Date' },
      { key: 'webinar_time', name: 'Webinar Time' },
      { key: 'timezone', name: 'Timezone' },
      { key: 'city', name: 'City' },
      { key: 'zoom_link', name: 'Zoom Link' },
      { key: 'host_name', name: 'Host Name' },
      { key: 'host_email', name: 'Host Email' },
      { key: 'domain_name', name: 'Domain Name' },
      { key: 'booking_link', name: 'Booking Link' },
      { key: 'canva_template', name: 'Canva Template' },
      { key: 'ads_manager', name: 'Ads Manager' }
    ]
  },
  {
    label: 'Immigration',
    fields: [
      { key: 'immigration_webinar_date', name: 'immigration Webinar Date' },
      { key: 'immigration_webinar_time', name: 'immigration Webinar Time' },
      { key: 'immigration_host_email', name: 'immigration webinar host email' },
      { key: 'immigration_domain_name', name: 'immigration domain name' }
    ]
  }
];

const HL_PRIVATE_API_KEY = process.env.HL_PRIVATE_API_KEY;
const HL_LOCATION_ID = process.env.HL_LOCATION_ID;

if (!HL_PRIVATE_API_KEY || !HL_LOCATION_ID) {
  console.error('[custom-values] Missing HL_PRIVATE_API_KEY or HL_LOCATION_ID.');
  process.exit(1);
}

const command = process.argv[2] || 'list';

(async () => {
  try {
    if (command === 'ensure') {
      await ensureFields();
    }

    const values = await fetchCustomValues();
    printSummary(values);
  } catch (error) {
    console.error('[custom-values] Error:', error.message);
    process.exit(1);
  }
})();

async function ensureFields() {
  const existing = await fetchCustomValues();
  const existingNames = new Set(existing.map((val) => normalize(val.name)));

  for (const group of FIELD_GROUPS) {
    for (const field of group.fields) {
      if (existingNames.has(normalize(field.name))) {
        console.log(`Skipped "${field.name}" (already exists)`);
        continue;
      }
      await createField(field.name);
      console.log(`Created "${field.name}"`);
    }
  }
}

async function fetchCustomValues() {
  const url = `${API_BASE}/locations/${HL_LOCATION_ID}/customValues?limit=200`;
  const res = await fetch(url, { headers: buildHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data?.data || [];
}

async function createField(name) {
  const url = `${API_BASE}/locations/${HL_LOCATION_ID}/customValues`;
  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ name, value: '' })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
}

function printSummary(allValues) {
  console.log('\nCustom Value IDs:\n');
  FIELD_GROUPS.forEach((group) => {
    console.log(`${group.label}`);
    group.fields.forEach((field) => {
      const match = allValues.find((val) => normalize(val.name) === normalize(field.name));
      const id = match?.id || '';
      const status = match ? 'exists' : 'missing';
      console.log(`  ${field.key.padEnd(28)} ${status.padEnd(8)} ${id}`);
    });
    console.log('');
  });
}

function buildHeaders() {
  return {
    Authorization: `Bearer ${HL_PRIVATE_API_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Version: '2021-07-28'
  };
}

function normalize(value) {
  return (value || '').trim().toLowerCase();
}
