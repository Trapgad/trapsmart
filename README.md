# TRAP MARKET — Marketplace Starter

A responsive Alibaba-inspired multi-category marketplace starter for TRAP MARKET.

## Included in this starter

- Responsive marketplace homepage
- Product catalogue with category filters and search
- Product cards, stock display and wholesale minimum quantity
- Shopping cart with quantity controls and wishlist
- Demo checkout that creates and stores orders
- Basic seller product-listing form
- Simple Express API and JSON-file persistence
- Prices displayed in Ghana cedis (GH₵)

## Requirements

- Node.js 18 or newer
- npm

## Run locally

1. Extract the ZIP file.
2. Open the `trap-market` folder in VS Code.
3. Open a terminal in that folder.
4. Run:

   ```bash
   npm install
   npm start
   ```

5. Visit http://localhost:3000

The first run creates `data.json` and loads sample products.

## Important before public launch

This is a functional starter/demo, not yet a production-ready Alibaba clone.

The current checkout records an order but does **not** charge a card or collect Mobile Money. The payment options are labels only until you configure a merchant account and implement verified Paystack or Hubtel payment initialization and webhook handling.

The seller product endpoint is intentionally open for local demonstration. Before public deployment, add:
- Firebase Authentication (or another secure identity provider)
- Role-based authorization for buyer, seller and admin
- Seller verification and product moderation
- Secure database rules and server-side validation
- A real database such as Firestore or PostgreSQL
- Payment provider integration with verified webhooks
- Shipping rates, delivery provider integration and tracking
- Rate limiting, logging, backups, privacy policy and terms
- Image upload service and file validation

Do not deploy the demo API publicly with real customer data until these controls are implemented.

## API routes

- `GET /api/health` — API health
- `GET /api/products` — list/search/filter products
- `POST /api/products` — add a product (demo only; no authentication)
- `POST /api/orders` — create an order (demo checkout; no online payment)
- `GET /api/orders` — list orders (demo only; no authentication)
- `POST /api/messages` — save a contact message

## Deploy

You can deploy the Node app to a Node-compatible host such as Render or Railway. Set the start command to `npm start`. For Vercel, configure a serverless function/API deployment rather than assuming this persistent JSON-file server will work unchanged: serverless filesystems are generally ephemeral, so move data to a hosted database first.

## Brand and design

- Brand: TRAP MARKET
- Tagline: YOUR WORLD. ONE MARKETPLACE.
- Palette: deep emerald, orange accent, white and soft neutral backgrounds
- Currency display: Ghana cedis (GH₵)
