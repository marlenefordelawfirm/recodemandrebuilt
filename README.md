# RECO Demand Rebuilt

This repo hosts the Express API and static client assets that power the RECO Demand webinar builder. The backend proxies to the HighLevel (LeadConnector) API so webinar details can stay in sync with HighLevel custom values, and the frontend mirrors the in-app builder experience with custom pickers for dates, times, and timezones.

## Project structure

- `server/` – Express app that serves `public/` and exposes `/api/custom-values` GET/PUT routes for HighLevel.
- `public/` – Static builder UI with timezone ticker, custom date/time pickers, and state hydration from the API.
- `tools/customValues.js` – CLI helper to inspect or create HighLevel custom values directly from the terminal.

## Prerequisites

- Node.js 18+
- A HighLevel/LeadConnector private API key with access to the target location.
- npm (ships with Node).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file and add:
   ```
   PORT=5174                # optional; defaults to 5174
   HL_PRIVATE_API_KEY=...   # HighLevel private API key
   HL_LOCATION_ID=...       # HighLevel location ID
   HL_CUSTOM_VALUE_IDS=key:id,key:id,...
   ```
   - `HL_CUSTOM_VALUE_IDS` maps each builder field to the HighLevel custom value ID (ex: `webinar_date:abc123,webinar_time:def456`).
   - Use the `custom-values` tool below to list IDs and confirm they exist.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with Nodemon for local development (auto-restarts on file changes). |
| `npm start` | Start the API with Node for production or staging. |
| `npm run custom-values` | List all configured webinar and immigration custom values plus their IDs. Pass `ensure` to create any missing fields (e.g., `npm run custom-values -- ensure`). |

## Custom values helper

`tools/customValues.js` uses the same `.env` credentials as the server to read/write HighLevel custom values:

```bash
npm run custom-values           # prints IDs + “exists/missing” status
npm run custom-values -- ensure # creates any missing fields before printing the summary
```

This is handy for onboarding new locations or double-checking that the builder’s fields line up with the remote IDs stored in `HL_CUSTOM_VALUE_IDS`.

## Deploying

1. Make sure tests or manual checks pass locally.
2. Commit your changes.
3. Push to `master` (or open a PR) – the repo is configured for deploys via Vercel.
