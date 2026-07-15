# 📦 PRODUCT.md — Razchly Product Requirements & Specifications

## 1. Product Vision
**Razchly** is an AI-powered personal finance management and productivity ecosystem designed to serve as a comprehensive personal command center. It bridges the gap between traditional budgeting, multi-asset investment tracking, algorithmic trading simulation, and gig-economy driver productivity tools (specifically tailored for Grab Partners).

Our goal is to deliver an enterprise-grade financial SaaS platform that empowers individuals to take control of their finances with the help of advanced artificial intelligence.

---

## 2. Key Target Personas
- **The Financial Tracker:** Individuals looking to centralize bank accounts, e-wallets, cash, loans, and savings goals in one secure dashboard.
- **The Smart Investor:** Retail investors tracking equity, cryptocurrency, and gold portfolios, utilizing real-time charts and simulated trading strategies.
- **The Gig-Economy Driver (Grab Partner):** Professional drivers who need specialized trackers for shift scheduling, automatic fuel/commission allocation, and time management.
- **The Tech-Savvy Budgeter:** Users who scan receipts and invoices to automatically record transactions using AI vision.

---

## 3. Core Modules & Feature Breakdown

### A. Consolidated Financial Dashboard
- **Cash Flow Tracking:** Log income, expenses, and bank/wallet transfers with multi-category classification.
- **Unified Accounts:** Manage multiple balances (e.g., Bank accounts, E-wallets, Cash-in-hand).
- **Savings Targets:** Set target amounts with progress tracking and estimated dates of completion.

### B. Multi-Asset Portfolio Tracker
- **Asset Classes:** Support for Indonesian Stocks (IDX), Cryptocurrencies (USDT/BTC/ETH), and Gold Spot prices (EMAS).
- **Interactive Visualizations:** 7-day and 30-day timeline charts with automated color indicators (green for positive growth, red for negative).
- **ARA/ARB Calculator:** Calculates Auto Rejection thresholds based on the latest Indonesia Stock Exchange (IDX) pricing fractions.

### C. AI Trading Assistant & Backtester
- **Multi-Engine AI Analysis:** Choose between the advanced Gemini API engine, local OpenAlice quantitative matrix, or Quantum 6L algorithm.
- **6-Layer Analysis Matrix:** Evaluates News, Macro Trends, S&R Zones (Bollinger Bands), Momentum Oscillators (RSI/MFI), Candlestick Price Action, and Basket Risk.
- **MT5/Bybit Bridge:** Webhook configuration interface to forward signals directly to MetaTrader 5 or execute trade orders on Bybit.

### D. Grab Partner Productivity Optimizer
- **Income Logging:** Record daily fares, tips, fuel costs, and platform fees.
- **Auto-Allocation:** Automatically distribute driver earnings across Grab Cash, Grab Dompet, and Grab Hemat wallets based on target ratios.
- **Fatigue Management:** Configure shifts and rest intervals to protect driver health.

### E. Attendance Tracker
- **Check-In/Out Logging:** Simple time clock for shift tracking.
- **Daily Performance Notes:** Add context to daily records.
- **Time Analytics:** Weekly and monthly aggregate hours reports.

### F. Debts & Loans Ledger
- **Multi-Interest Calculation:** Support flat nominal interest and percentage rates.
- **Tenor Calendaring:** Set due dates, duration terms, and track payment histories.
- **Simulated Auto-Debit:** Link loans to financial accounts for automatic simulated payments.

### G. Smart Receipt Scanner (AI Vision)
- **OCR & Data Extraction:** Upload images of receipts or invoices.
- **Gemini OCR Processing:** Parse merchant names, dates, amounts, and match appropriate categories automatically.
