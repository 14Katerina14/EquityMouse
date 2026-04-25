# Backend

Node.js + Express API for EquityMouse.

## Current scope

- `GET /health` for a quick server status check
- `GET /api/quotes` to scrape a batch of current prices
- `GET /api/quotes/:symbol` to scrape a single symbol
- `GET /api/quotes/supported` to list supported symbols
- `GET /api/metrics/:symbol` to scrape available metrics for a single asset
- `GET /api/metrics/supported` to list symbols with metrics scraping

Important:
- prices are scraped from public web pages
- data may be delayed by a few minutes or more
- metals currently expose price reliably, but daily percentage move may be unavailable depending on page structure
- metrics coverage is best for stocks, partial for ETFs, and currently unsupported for commodities
- scraping source mappings are intentionally kept out of version control
- copy `backend/src/config/scrapingSources.example.js` to `backend/src/config/scrapingSources.local.js` for local source wiring

## Supported symbols

- `TSLA`
- `AAPL`
- `NVDA`
- `SPY`
- `VGT`
- `GOLD`
- `SILVER`
- `PALLADIUM`

## Run

1. Install dependencies:
   `npm install`
2. Start the API:
   `npm run dev`

Server default port: `4000`

## Example requests

- `http://localhost:4000/health`
- `http://localhost:4000/api/quotes`
- `http://localhost:4000/api/quotes?symbols=TSLA,AAPL,NVDA`
- `http://localhost:4000/api/quotes/SPY`
- `http://localhost:4000/api/metrics/TSLA`
- `http://localhost:4000/api/metrics/SPY`
