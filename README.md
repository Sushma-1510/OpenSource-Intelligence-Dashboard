# Open Source Intelligence Dashboard (OSINT)

A production-quality MERN full-stack application that discovers, analyzes, and visualizes trending open-source projects from GitHub and forum discussions from Reddit in real-time.

Features a curated, glassmorphic dark-mode dashboard styled with Tailwind CSS, utilizing high-performance native Recharts visualizations and custom server-side caching engines.

---

## Technical Architecture

The project has a clean separation of concerns, separating the backend Express server from the React client:

```
open-source-dashboard/
│
├── client/                     # Vite + React Frontend Dashboard
│   ├── src/
│   │   ├── components/         # Reusable presentation controls
│   │   │   ├── Navbar.jsx      # Sticky top brand headers, toggles, bookmarks metrics
│   │   │   ├── StatsCards.jsx  # Numerical metric aggregations
│   │   │   ├── SearchBar.jsx   # Separate Git/Reddit search engines
│   │   │   ├── Filters.jsx     # Accordion sliders, star filters, sorts selectors
│   │   │   ├── RepoCard.jsx    # GitHub project presentation panels
│   │   │   ├── RedditCard.jsx  # Forum timeline post items
│   │   │   ├── Charts.jsx      # Recharts visualizations layouts
│   │   │   └── LoadingSpinner.jsx # Fluid CSS loading skeletons
│   │   ├── context/
│   │   │   └── DashboardContext.jsx # Central state, theme switches, bookmarks sync
│   │   ├── hooks/
│   │   │   ├── useRepositories.js  # Debounced custom hook for Git endpoints
│   │   │   └── useRedditPosts.js   # Debounced custom hook for Reddit threads
│   │   ├── services/
│   │   │   └── api.js          # Axios network instance config
│   │   ├── App.jsx             # Root layout component
│   │   ├── main.jsx            # DOM compiler mount
│   │   └── index.css           # Styling sheets & custom classes
│   ├── tailwind.config.js      # Custom theme setup
│   └── postcss.config.js       # CSS pipeline controls
│
└── server/                     # Node.js + Express + MongoDB Server
    ├── config/
    │   └── db.js               # Mongoose retry database connector
    ├── controllers/
    │   ├── githubController.js # Searches, filters, toggles favorites, CSV exports
    │   ├── redditController.js # Handles Reddit discussions searches & bookmarks
    │   └── dashboardController.js # MongoDB aggregation analytical chart metrics
    ├── middleware/
    │   ├── errorHandler.js     # Production-grade centralized catch errors
    │   └── logger.js           # Styled stdout logging outputs
    ├── models/
    │   ├── Repository.js       # Repository text search schemas
    │   ├── RedditPost.js       # Reddit discussion timeline schemas
    │   └── Favorite.js         # Polymorphic favorite mapping
    ├── routes/
    │   ├── githubRoutes.js     # GitHub paths
    │   ├── redditRoutes.js     # Reddit paths
    │   └── dashboardRoutes.js  # Dashboard aggregation paths
    ├── services/
    │   ├── githubService.js    # Git REST integrations, trending score, limit checks
    │   └── redditService.js    # Concurrent multi-reddit JSON fetchers
    ├── utils/
    │   └── cacheManager.js     # Tracks cache logging & hourly invalidations
    ├── .env                    # Environment credentials file
    ├── server.js               # Express bootstrapper
    └── verifyBackend.js        # Validation test suite
```

---

## Installation & Local Development

### Prerequisites
* **Node.js** (v18.0.0 or higher recommended)
* **MongoDB** running locally (`mongodb://127.0.0.1:27017/osint_dashboard`)

---

### Step 1: Database Setup
Make sure your MongoDB server is active on your machine.
In a local environment, Mongoose connects directly to:
`mongodb://127.0.0.1:27017/osint_dashboard`

---

### Step 2: Backend Installation & Setup
1. Open a terminal and navigate to the server folder:
   ```bash
   cd server
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Set up credentials. Open the `.env` file and configure:
   * `PORT=5000`
   * `MONGODB_URI=mongodb://127.0.0.1:27017/osint_dashboard`
   * **GitHub Token (Highly Recommended)**: Generate a Personal Access Token on GitHub and paste it in `GITHUB_TOKEN=`. Without this, GitHub API limits unauthenticated IP requests to 60/hour. With a token, it scales to 5,000/hour.
4. Run the validation suite to assert database connection:
   ```bash
   node verifyBackend.js
   ```
5. Launch the backend server in development hot-reload mode:
   ```bash
   npm run dev
   ```

---

### Step 3: Frontend Installation & Setup
1. Open a separate terminal and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Boot the Vite React development server:
   ```bash
   npm run dev
   ```
4. Access the premium dashboard: `http://localhost:5173`

---

## Key Features Guide

* **Trending Score Calculations**:
  GitHub repositories are compiled with an advanced dynamic weighting formula:
  $$\text{Trending Score} = (\text{stars} \times 0.5) + (\text{forks} \times 0.2) + (\text{watchers} \times 0.2) + (\text{recent\_activity} \times 0.1)$$
  *Where `recent_activity` parses update dates from 0-100 pts.*
* **Local CSV/JSON Exports**:
  Clicking the export tags instantly issues server-compiled spreadsheets or clean raw JSON formats for local analytical audits.
* **Polymorphic Bookmarks**:
  Click the star badges on GitHub cards or Reddit discussion items. The state is instantly written to Mongoose polymorphic tables and mirrored across the dashboard.
* **Central Insights Bar**:
  Heuristic analysis aggregates database language spreads, react framework densities, and AI forums keywords to dynamically output core technical summaries.

---

## Production Deployment Guide

### Backend Deployment (Render.com)
1. Push your server files to a GitHub Repository.
2. Log into Render.com and create a new **Web Service**.
3. Select your repository. Configure:
   * **Environment**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `node server.js`
4. Add **Environment Variables**:
   * `PORT=10000` (Render binds automatically)
   * `NODE_ENV=production`
   * `MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/osint_dashboard` (Use MongoDB Atlas)
   * `GITHUB_TOKEN=<your_token>`
   * `CLIENT_URL=https://your-app.vercel.app` (Your frontend domain)
5. Hit deploy. Render will compile and spin up the backend service.

---

### Frontend Deployment (Vercel)
1. Push your client files to your GitHub Repository.
2. Log into Vercel.com and click **Add New Project**.
3. Link your repository.
4. Select the `client` directory as the project Root.
5. In Vercel Build configurations, set:
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
6. Add Vercel Environment Variables:
   * `VITE_API_URL=https://your-backend.onrender.com/api` (The deployed Render server API route)
7. Click deploy. Your premium React dashboard goes live instantly!
