# Grove: Crypto Portfolio Tracker

A full-stack cryptocurrency portfolio tracker designed to handle API rate limits, store historical analytics, and process real-time price updates.

## 🚀 Live Demo
* **Frontend (Vercel):** https://grove-crypto-tracker.vercel.app/
* **Live API Docs (Swagger):** https://cypher-sight.onrender.com/api-docs/

## 🏗 System Architecture & Technical Highlights

This project demonstrates several backend and frontend patterns:

### 1. Market Data Engine & Caching
To circumvent CoinGecko's aggressive free-tier rate limits, the backend implements a **dual-layer cache system** driven by a Node.js background worker (`node-cron`). 
- The worker polls global market data, top 100 coins, and historical charts every 5 minutes.
- Data is persisted to MongoDB and served to the client instantly.
- If the upstream API fails, the backend serves cached data with a 'stale' warning flag to the frontend rather than failing the request.

### 2. High-Frequency WebSocket Integration
The client UI displays sub-second price updates via a direct integration with the Binance Public WebSocket stream. 
- The backend acts as a relay, mapping Binance stream symbols to CoinGecko IDs, and broadcasting delta payloads to connected React clients.
- To prevent UI blocking during frequent updates, interactive components are decoupled and memoized using `React.memo` and stable DOM keys. This prevents them from re-rendering when the parent table updates.

### 3. Secure Token Rotation & Concurrency Handling
Authentication uses a standard JWT flow: short-lived Access Tokens (stored in memory via Redux) and long-lived Refresh Tokens (stored in HttpOnly cookies).
- **Token Reuse Detection:** Implements session family tracking. If a compromised or duplicated refresh token is used, the backend detects the anomaly and instantly revokes all active sessions for that user.
- **Mutex Queueing:** The frontend RTK Query interceptor implements a Mutex pattern. If multiple parallel API requests fail with `401 Unauthorized`, the interceptor halts all outgoing requests, executes a single token refresh, and releases the queued requests once the new token is acquired.

### 4. Database Optimization
Heavy analytical endpoints (calculating average buy prices, realized/unrealized profit, and historical allocation) rely on optimized MongoDB queries. 
- Compound indexes (`{ user: 1, timestamp: -1 }` and `{ user: 1, coinId: 1 }`) on `Transaction` and `PriceAlert` schemas are used to support indexed lookups and avoid collection scans for transaction history.

### 5. Automated Price Alerts
Users can define `ABOVE` or `BELOW` target price thresholds. The backend cron worker evaluates all active alerts against the synchronized market cache every 5 minutes and dispatches transactional emails using the **Brevo API**.

### 6. Pragmatic Architecture Decisions
* **Cost-Optimized Background Processing:** To optimize deployment costs on Render's free tier, the BullMQ background worker (handling email alerts) is initialized concurrently within the main Express process. While logically decoupled and queue-driven, this monolithic deployment avoids the need for a separate paid worker instance. It is designed to be easily extracted to a dedicated Docker container for horizontal scaling in a real production environment.
* **State Management (Context vs Redux):** RTK Query is used for standard API data fetching, but high-frequency WebSocket updates (Binance live prices) are piped through a dedicated React Context (`LivePriceProvider`). This prevents the entire Redux store from updating on every tick, reducing unnecessary re-renders.
* **Authentication Security:** Implemented JWT token rotation with short-lived access tokens (memory/auth header) and long-lived HTTP-only cookies for refresh tokens to protect against XSS and CSRF.
* **Automated Testing & CI:** Unit tests (Vitest) cover core backend logic and validation. A GitHub Actions pipeline automatically runs the test suite on pushes to `main` as a basic quality gate.
* **Containerized Deployment:** The backend API and Redis cache are deployed using Docker, ensuring environment parity between local development and the Render production server.

## 💻 Tech Stack

**Frontend:**
* React 18 (Vite)
* TypeScript
* Redux Toolkit (RTK Query for data fetching & caching)
* Tailwind CSS & custom CSS modules (vibrant dark-mode glassmorphism design)
* Recharts (for portfolio allocation and 7-day performance visualizations)

**Backend:**
* Node.js & Express
* TypeScript
* MongoDB (Mongoose ODM)
* JWT Authentication (HttpOnly Cookies)
* WebSockets (`ws`)
* Node-Cron & Brevo API

## 🛠 Local Development Setup

### Prerequisites
* Node.js (v18+)
* MongoDB (Local instance or MongoDB Atlas)
* Docker and Docker Compose (For running Redis and the Backend)

### 1. Clone & Install
```bash
git clone https://github.com/mohanishp9/crypto_portfolio_tracker.git
cd crypto_portfolio_tracker

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Environment Variables
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<your-cluster>.mongodb.net/crypto-tracker
JWT_SECRET=super-secret-jwt-key
ACCESS_TOKEN_SECRET=super-secret-access-key
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN_DAYS=7d
COINGECKO_API_KEY=your-coingecko-key
BREVO_API_KEY=your-brevo-key
BREVO_SENDER_EMAIL=your@email.com
BREVO_SENDER_NAME="Grove Portfolio Tracker"
CLIENT_URL=http://localhost:5173
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run the Application
You will need two terminal windows.

**Terminal 1 (Backend & Redis via Docker):**
```bash
docker-compose up --build -d
```
*(This starts both the Node API and Redis on ports 5000 and 6379 respectively.)*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).
