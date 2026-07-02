# Grove: Crypto Portfolio Tracker

A production-grade, full-stack cryptocurrency portfolio tracker engineered with a focus on data accuracy, high-frequency real-time updates, and robust system architecture.

Built to solve the common issues with free crypto trackers: API rate limits, inaccurate historical analytics, and delayed price updates. 

## 🚀 Live Demo
* **Frontend (Vercel):** https://cypher-sight.vercel.app/
<!-- * **Backend API (Render):** [Replace with your Render URL] -->

## 🏗 System Architecture & Technical Highlights

This project was built to demonstrate senior-level backend architectural patterns and frontend performance optimizations:

### 1. Market Data Engine & Caching
To circumvent CoinGecko's aggressive free-tier rate limits, the backend implements a **dual-layer cache system** driven by a Node.js background worker (`node-cron`). 
- The worker polls global market data, top 100 coins, and historical charts every 5 minutes.
- Data is persisted to MongoDB and served to the client instantly.
- Implements a graceful fallback system: if the upstream API fails, the backend serves stale cached data with an explicit "stale reason" warning to the frontend rather than failing the request.

### 2. High-Frequency WebSocket Integration
The client UI displays sub-second price updates via a direct integration with the Binance Public WebSocket stream. 
- The backend acts as a relay, mapping Binance stream symbols to CoinGecko IDs, and broadcasting delta payloads to connected React clients.
- To prevent UI jank during high-frequency updates, interactive components (like the Price Alert configuration form) are strictly decoupled and memoized using `React.memo` and stable DOM keys, preventing them from re-rendering and losing focus when the parent table updates.

### 3. Secure Token Rotation & Concurrency Handling
Authentication uses a highly secure JWT flow: short-lived Access Tokens (stored strictly in memory via Redux) and long-lived Refresh Tokens (stored in HttpOnly cookies).
- **Token Reuse Detection:** Implements session family tracking. If a compromised or duplicated refresh token is used, the backend detects the anomaly and instantly revokes all active sessions for that user.
- **Mutex Queueing:** The frontend RTK Query interceptor implements a Mutex pattern. If multiple parallel API requests fail with `401 Unauthorized`, the interceptor halts all outgoing requests, executes a single token refresh in the background, and seamlessly releases the queued requests once the new token is acquired.

### 4. Database Optimization
Heavy analytical endpoints (calculating average buy prices, realized/unrealized profit, and historical allocation) rely on optimized MongoDB queries. 
- Compound indexes (`{ user: 1, timestamp: -1 }` and `{ user: 1, coinId: 1 }`) on `Transaction` and `PriceAlert` schemas guarantee `O(log n)` query performance and eliminate collection scans as a user's transaction history grows.

### 5. Automated Price Alerts
Users can define `ABOVE` or `BELOW` target price thresholds. The backend cron worker evaluates all active alerts against the synchronized market cache every 5 minutes and dispatches responsive HTML transactional emails using **Brevo** (Nodemailer).

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
* Node-Cron & Nodemailer

## 🛠 Local Development Setup

### Prerequisites
* Node.js (v18+)
* MongoDB (Local instance or MongoDB Atlas)

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

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).
