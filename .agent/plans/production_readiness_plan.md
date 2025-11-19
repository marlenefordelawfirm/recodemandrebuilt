# Implementation Plan - Production Readiness

## Proposed Changes

### Frontend
- **File**: `public/index.html`
- **Change**: Replace the remaining `<script src="mock.js"></script>` with `<script src="client.js"></script>`.

### Backend
- **File**: `server/index.js`
- **Change**: Modify to export the `app` instance. Wrap the `app.listen` call so it only runs when the file is executed directly (not when imported by Vercel).
- **New File**: `api/index.js`
- **Content**: Import `app` from `../server/index.js` and export it as the default handler.

### Configuration
- **File**: `vercel.json`
- **Content**: Ensure rewrites point `/api/*` to `api/index.js` and everything else to `public/`.

## Verification Plan
- **Local Testing**: Run `npm start` to ensure the server still works locally.
- **Vercel Simulation**: If `vercel` CLI is available, run `vercel dev`.

## Deployment Instructions (for User)
1.  Run `npx vercel login`
2.  Run `npx vercel` (to deploy)
3.  Configure Domain in Vercel Dashboard -> Settings -> Domains.
4.  Update GoDaddy DNS with provided records.
