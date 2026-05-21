# Bitcoin Blockchain Explorer

A web-based Bitcoin blockchain explorer built with Node.js, Express, and vanilla JavaScript. This application allows users to browse blocks, transactions, and addresses on the Bitcoin network in real time.

**Diploma thesis project** — ULIM (International Independent University of Moldova), Faculty of Computer Science, Engineering and Design, Department of Information Technologies, 2026.

## Features

- Universal search (block height, block hash, TXID, Bitcoin address)
- Latest blocks overview with auto-refresh (every 30 seconds)
- Detailed block, transaction, and address pages
- Mempool fee recommendations (fast / medium / economy)
- In-memory caching with configurable TTL
- Responsive dark-themed UI with Bitcoin orange accents
- Error handling at all levels (API, server, client)

## Tech Stack

- **Back-end:** Node.js + Express
- **Front-end:** HTML5, CSS3, vanilla JavaScript (SPA)
- **Data sources:** Blockstream Esplora API, mempool.space API
- **Caching:** Custom in-memory TTL cache

## Project Structure

```
bitcoin-explorer/
  server.js              — Entry point, Express setup
  routes/api.js          — REST API endpoints
  services/bitcoinApi.js — External API wrapper (Blockstream + mempool.space)
  utils/cache.js         — In-memory TTL cache
  utils/formatter.js     — Formatting utilities (satoshi to BTC)
  public/
    index.html           — SPA markup
    styles.css           — Dark theme styles
    app.js               — Client-side logic
  .env                   — Environment config (PORT)
  package.json           — Dependencies
```

## Installation

```bash
git clone https://github.com/laylayer808-blip/bitcoin-explorer.git
cd bitcoin-explorer
npm install
```

## Usage

```bash
# Create .env file
echo "PORT=3000" > .env

# Start the server
npm start

# Or with auto-restart on changes (Node.js 18+)
npm run dev
```

Open http://localhost:3000 in your browser.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/status` | Network height + fee recommendations |
| `GET /api/blocks` | Latest 10 blocks |
| `GET /api/block/:hash` | Block details by hash |
| `GET /api/tx/:txid` | Transaction details by TXID |
| `GET /api/address/:addr` | Address info + recent transactions |
| `GET /api/search/:query` | Universal search with auto-detection |

## License

This project was created for educational purposes as part of a bachelor's thesis.
