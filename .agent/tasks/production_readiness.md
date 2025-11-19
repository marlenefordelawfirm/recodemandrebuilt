# Production Readiness & Vercel Deployment

## User Objective
The user wants to deploy the current project to Vercel and configure a custom domain (`immigration.fordelaw.org`) via GoDaddy.

## Context
- The project is a Node.js/Express backend with a static frontend.
- The frontend relies on a script (renamed from `mock.js` to `client.js`) to interact with the backend.
- The backend proxies requests to the HighLevel API.
- The user has a GoDaddy account for the domain.
- The user asked how I can access their Vercel account (I cannot).

## Strategy
1.  **Codebase Cleanup**: Ensure all references to `mock.js` are updated to `client.js`.
2.  **Vercel Configuration**:
    - Create a `vercel.json` to handle routing.
    - Create a Serverless Function adapter (`api/index.js`) because Vercel requires exporting the app, not listening on a port directly in the entry file for serverless functions.
3.  **Deployment Guide**:
    - Since I cannot access the user's Vercel account, I will provide a detailed guide (or use the `vercel` CLI if the user logs in).
    - I will assume the user might need to run `vercel login` and `vercel deploy`.
4.  **Domain Configuration**:
    - Provide the specific DNS records (A record and CNAME) the user needs to add to GoDaddy.

## Implementation Steps
1.  [ ] Fix remaining `mock.js` reference in `public/index.html`.
2.  [ ] Create `api/index.js` to export the Express app for Vercel.
3.  [ ] Modify `server/index.js` to export the app instead of just listening (or ensure `api/index.js` imports it correctly).
4.  [ ] Verify `vercel.json` configuration.
5.  [ ] Provide instructions for Vercel CLI deployment.
6.  [ ] Provide DNS records for GoDaddy.
