# 🔌 API.md — Razchly API Reference & Endpoint Specifications

This document lists the available backend REST endpoints exposed by the Express proxy server (`server.ts`).

---

## 1. Market Data Endpoints

### Get Asset Quotes
Fetches real-time price quotes and 24h price changes. Supports Indonesian Stocks, Crypto, and Gold Spot.
- **Route:** `GET /api/quotes`
- **Query Parameters:**
  - `symbols` (string, required): Comma-separated list of symbols (e.g., `BBCA,BTCUSDT,EMAS`).
- **Response Example (200 OK):**
  ```json
  {
    "BBCA": {
      "symbol": "BBCA",
      "price": 10050,
      "change": 0.5,
      "description": "Bank Central Asia Tbk IDX Stock",
      "logoid": "idx/BBCA",
      "currency": "IDR",
      "realSymbol": "IDX:BBCA"
    },
    "BTCUSDT": {
      "symbol": "BTCUSDT",
      "price": 65120.45,
      "change": 1.25,
      "description": "Bitcoin / TetherUS",
      "logoid": "crypto/X-BTC",
      "currency": "USD",
      "realSymbol": "BINANCE:BTCUSDT"
    }
  }
  ```

### Search Market Symbols
Searches TradingView markets for symbols.
- **Route:** `GET /api/search`
- **Query Parameters:**
  - `q` (string, required): Search query.
- **Response Example (200 OK):**
  ```json
  [
    { "symbol": "BBCA", "description": "Bank Central Asia Tbk", "exchange": "IDX", "type": "stock" }
  ]
  ```

---

## 2. AI & Assistant Endpoints

### OCR Receipt Analysis
Processes uploaded receipt images and parses transaction data.
- **Route:** `POST /api/gemini/analyze`
- **Request Body:**
  - `images` (array of objects, optional): Inline image parts with `mimeType` and base64 `data`.
  - `prompt` (string, optional): Guide instructions for Gemini.
  - `categories` (array, optional): List of user categories to match.
- **Response Example (200 OK):**
  ```json
  {
    "text": "[{\"date\":\"2026-07-15\",\"amount\":125000,\"type\":\"expense\",\"note\":\"Supermarket Belanja\",\"categoryId\":\"cat-123\"}]"
  }
  ```

### 6-Layer Technical Analysis
Performs detailed 6-Layer market analysis for stock or crypto assets.
- **Route:** `POST /api/gemini/trading-analysis`
- **Request Body:**
  - `symbol` (string, required): Ticker symbol.
  - `currentPrice` (number, required): Current price.
  - `candles` (array, optional): Array of historical candlesticks.
  - `engine` (string, optional): `ALICE` (local) or `GEMINI` (remote).
- **Response Example (200 OK):**
  ```json
  {
    "decision": "BUY",
    "confidence": 85,
    "indicators": {
      "rsi": 32,
      "macd": "Mulai Golden Cross",
      "sma20": 9850,
      "sma50": 9700,
      "bollingerBands": "Harga di Lower Band"
    },
    "analysis": "LAPIS 1: ... LAPIS 6: ...",
    "stopLoss": 9600,
    "takeProfit": 10500,
    "riskRewardRatio": "1:2"
  }
  ```

---

## 3. Order Execution Endpoints

### Execute Bybit Trade
Executes spot or linear perpetual contract orders on Bybit.
- **Route:** `POST /api/trade/bybit-execute`
- **Request Body:**
  - `apiKey` (string, required): Bybit API Key.
  - `apiSecret` (string, required): Bybit Secret Key.
  - `symbol` (string, required): Asset (e.g., `BTCUSDT`).
  - `side` (string, required): `Buy` or `Sell`.
  - `qty` (number, required): Order quantity.
  - `isTestnet` (boolean, optional): Connect to Testnet or Production.
- **Response Example (200 OK):**
  ```json
  {
    "retCode": 0,
    "retMsg": "OK",
    "result": {
      "orderId": "order-123456",
      "orderLinkId": ""
    }
  }
  ```
