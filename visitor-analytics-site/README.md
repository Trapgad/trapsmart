# Visitor analytics website

A small standalone website with optional, transparent, opt-in audience analytics.
It stores aggregate page-view counts by broad browser and device categories only.

## Run locally

1. Install Node.js 18 or newer.
2. Open this folder in a terminal.
3. Run `npm start`.
4. Open http://localhost:3000.
5. Copy the temporary admin token printed in the terminal and enter it under
   **Site owner** to view aggregate totals.

Analytics are saved to `data.json` in this folder. That file is ignored by Git.

## What is and is not collected

Before any analytics request is sent, visitors see a notice and can accept or
reject. Their choice is saved in browser local storage so the prompt is not
repeated on every visit. Rejecting does not affect use of the site.

After acceptance, the site records one page view per page load and increments
aggregate counts for a broad browser family and device category. It does not
send or store names, contact details, raw user-agent strings, precise screen
dimensions, referrers, page history, cookies for tracking, or IP addresses in
the analytics data. There are no third-party analytics services.

The admin token protects the totals endpoint. For a deployment, set a private,
long `ANALYTICS_ADMIN_TOKEN` environment variable and use HTTPS. The randomly
generated token printed at startup is intended for local development; do not
publish it. Review applicable privacy laws and update the notice to match the
final site and hosting setup before launch.

This is a minimal starter, not a complete production analytics platform.
