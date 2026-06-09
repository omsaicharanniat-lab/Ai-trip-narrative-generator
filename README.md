# 🚗 AI Trip Narrative Generator
### Manivtha Tours & Travels — Internship Project 2026

An AI-powered web application that turns trip details entered by drivers or staff into engaging, shareable travel blog narratives — automatically.

---

## 📸 Features

| Feature | Description |
|---|---|
| ✨ AI Narrative Generation | Powered by Google Gemini 2.5 Flash |
| 🎭 Multiple Tones | Adventurous, Poetic, Informative, Humorous |
| 📜 History | Browse all past generations with search |
| 📊 Analytics Dashboard | Charts for trends, ratings, top routes |
| 🔐 Admin Panel | Firebase Auth (Google + Email), Data Viewer, CSV Export |
| ⭐ Rating System | Staff can rate and comment on outputs |
| 📋 Copy & Download | One-click copy and .txt download |
| 🔄 Regenerate | Get a fresh AI response for the same inputs |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JS (SPA) |
| Backend | Node.js + Express |
| AI Engine | Google Gemini 1.5 Pro |
| Database | SQLite (via better-sqlite3) |
| Auth | Firebase Authentication (Google + Email/Password) |
| Charts | Chart.js |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18 or newer
- A Google Gemini API key (free at https://aistudio.google.com/app/apikey)
- A Firebase project (for Admin auth — optional for core features)

---

### Step 1 — Clone & Install

```bash
cd backend
npm install
```

---

### Step 2 — Configure Environment

```bash
# Copy the template
copy .env.example .env
```

Open `backend/.env` and fill in:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
ADMIN_EMAILS=your_email@gmail.com
```

---

### Step 3 — Set Up Firebase (for Admin Panel)

> The app works without Firebase — you just won't have the Admin panel.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Go to **Authentication → Sign-in method** and enable:
   - ✅ Google
   - ✅ Email/Password
4. Go to **Project Settings → General → Your apps → Add app** (choose Web)
5. Copy the `firebaseConfig` object
6. Open `frontend/js/config.js` and replace the placeholder values
7. Go to **Project Settings → Service Accounts → Generate new private key**
8. Save the JSON file as `backend/firebase-service-account.json`

---

### Step 4 — Run the App

```bash
cd backend
npm run dev
```

Open your browser: **http://localhost:3001**

---

## 📁 Project Structure

```
stitch_ai_trip_narrative_generator/
├── backend/
│   ├── server.js                    # Express server (port 3001)
│   ├── .env.example                 # Environment variables template
│   ├── firebase-service-account.json  # (YOU ADD THIS — not in git)
│   ├── db/
│   │   └── database.js              # SQLite schema + connection
│   ├── routes/
│   │   ├── generate.js              # POST /api/generate
│   │   ├── history.js               # GET /api/history
│   │   ├── feedback.js              # POST /api/feedback/:id
│   │   ├── analytics.js             # GET /api/analytics
│   │   └── admin.js                 # Admin CRUD + CSV export (protected)
│   ├── middleware/
│   │   └── verifyToken.js           # Firebase token verification
│   └── utils/
│       └── promptBuilder.js         # AI prompt construction
├── frontend/
│   ├── index.html                   # SPA shell
│   ├── css/
│   │   └── style.css                # Full design system
│   └── js/
│       ├── config.js                # Firebase config + API_BASE
│       ├── auth.js                  # Firebase auth module
│       ├── generate.js              # Generate view
│       ├── history.js               # History view
│       ├── analytics.js             # Analytics view
│       ├── admin.js                 # Admin panel
│       └── app.js                   # SPA router
└── README.md
```

---

## 🗄️ Accessing Your SQLite Data

The SQLite database is stored at `backend/db/trips.db`. You can access it in two ways:

### Option 1 — Admin Panel (in the browser)
After signing in, the Admin Panel shows all data in a searchable, filterable table with CSV export.

### Option 2 — DB Browser for SQLite (desktop app)
1. Download [DB Browser for SQLite](https://sqlitebrowser.org/) (free, Windows/Mac/Linux)
2. Open the file `backend/db/trips.db`
3. Browse the `generations` table with full SQL support

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | ❌ | Server health check |
| POST | `/api/generate` | ❌ | Generate AI narrative |
| GET | `/api/history` | ❌ | List narratives (paginated) |
| GET | `/api/history/:id` | ❌ | Get single narrative |
| POST | `/api/feedback/:id` | ❌ | Submit star rating |
| GET | `/api/analytics` | ❌ | Dashboard analytics data |
| GET | `/api/admin/verify` | ✅ | Verify admin token |
| GET | `/api/admin/data` | ✅ | All records (filterable) |
| GET | `/api/admin/data/:id` | ✅ | Single record with full AI response |
| DELETE | `/api/admin/data/:id` | ✅ | Delete a record |
| GET | `/api/admin/export` | ✅ | Download all data as CSV |

---

## 👥 Team Roles

| Role | Responsibility |
|---|---|
| Student 1 — Frontend | `frontend/` — HTML, CSS, JS views |
| Student 2 — Backend & AI | `backend/` — Express, Gemini API, SQLite |
| Student 3 — Testing & Deployment | API testing, bug reports, deployment to hosting |

---

## 🎓 Internship Details

- **Company**: Manivtha Tours & Travels, Hyderabad
- **Duration**: 01 June 2026 – 30 June 2026 (26 Working Days)
- **Team Size**: 3 Students
