# 🌿 KisanAI — AI-Powered Personal Assistant for Indian Farmers

> *"Empowering every farmer with AI-driven agricultural guidance"*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🔬 **Crop Disease Detection** | Upload a leaf photo → AI detects disease using computer vision (colour/texture analysis). Returns symptoms, causes & prevention |
| 🌦️ **Live Weather** | Real-time weather from Open-Meteo API with 7-day forecast & farming advisories |
| 💬 **AI Chatbot** | Multilingual (English/Hindi/Telugu) RAG-based farming assistant |
| 📈 **Market Prices** | Live mandi prices from data.gov.in Agmarknet API |
| 🏪 **Store Finder** | Find nearby agri-input stores using OpenStreetMap |
| 👩‍🌾 **Farmer Dashboard** | Scan history, saved recommendations, stats |
| 🌐 **Multilingual** | English, Hindi, Telugu support |

---

## 🏗️ Tech Stack

### Backend
- **FastAPI** (Python 3.12) — async REST API
- **SQLite + SQLAlchemy** (async) — zero-installation database
- **passlib + bcrypt** — secure password hashing
- **PyJWT** — JWT authentication
- **OpenCV + PIL + NumPy** — computer vision disease inference
- **FAISS + SentenceTransformers** — RAG chatbot (optional)
- **httpx** — async HTTP calls to weather/market APIs

### Frontend
- **React 18 + TypeScript** — component-based UI
- **Vite** — fast build tool
- **Tailwind CSS** — utility-first dark theme
- **React Router v6** — client-side routing
- **i18next** — internationalization
- **react-dropzone** — image upload

---

## ⚡ Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- No PostgreSQL needed — uses SQLite by default!

### 1. Clone the repository
```bash
git clone https://github.com/raaviraju826-netizen/forming.git
cd forming
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env if needed (defaults work out of the box)

# Start the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Backend runs at: http://localhost:8000
API Docs: http://localhost:8000/api/docs

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend runs at: http://localhost:5173

---

## 🔑 Environment Variables

Copy `backend/.env.example` to `backend/.env`:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | SQLite (default) or PostgreSQL URL |
| `SECRET_KEY` | ✅ | Long random string for JWT signing |
| `GEMINI_API_KEY` | Optional | Enables real AI chatbot responses |
| `OPENAI_API_KEY` | Optional | Alternative LLM for chatbot |
| `AGMARKNET_API_KEY` | Optional | Live mandi prices from data.gov.in |

---

## 📁 Project Structure

```
forming/
├── backend/
│   ├── main.py                   # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── api/                  # API route handlers
│       │   ├── auth.py           # Register, Login, /me
│       │   ├── disease.py        # Leaf image upload & analysis
│       │   ├── chatbot.py        # Multilingual AI chatbot
│       │   ├── weather.py        # Open-Meteo integration
│       │   ├── market.py         # Agmarknet mandi prices
│       │   ├── stores.py         # Store finder
│       │   ├── farmer.py         # Profile & dashboard
│       │   └── history.py        # Scan history
│       ├── core/
│       │   ├── config.py         # App settings
│       │   ├── database.py       # Async SQLite engine
│       │   └── security.py       # JWT + password hashing
│       ├── ml/
│       │   └── inference.py      # CV-based disease inference engine
│       ├── models/models.py      # SQLAlchemy ORM models
│       ├── schemas/schemas.py    # Pydantic request/response schemas
│       ├── rag/chatbot.py        # RAG chatbot engine
│       └── data/                 # Knowledge base & seed data
├── frontend/
│   ├── src/
│   │   ├── pages/               # All 10 app pages
│   │   ├── components/          # Navbar, Sidebar, Layout
│   │   ├── lib/api.ts           # Axios API client
│   │   ├── context/             # Auth context
│   │   └── i18n/                # Translations (en/hi/te)
│   └── vite.config.ts
└── docker-compose.yml
```

---

## 🌿 Disease Detection

The CV inference engine analyses leaf images using:
- **Brown ratio** → Early/Late Blight
- **Dark necrosis** → Late Blight, Black Rot
- **Yellow ratio** → Viral diseases (TYLCV, Mosaic)
- **Gray/white ratio** → Leaf Mold, Septoria
- **Orange/rust ratio** → Common Rust
- **Texture variance** → Spotting diseases

**Supported crops:** Tomato, Potato, Corn/Maize, Rice, Apple, Grape, Wheat  
**Supported diseases:** 18 disease classes from the PlantVillage dataset

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register farmer |
| POST | `/api/auth/login` | Login (OAuth2) |
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/disease/predict` | Analyse leaf image |
| GET | `/api/weather?lat=&lon=` | Live weather + advisory |
| POST | `/api/chat` | AI chatbot message |
| GET | `/api/market-prices` | Mandi market prices |
| GET | `/api/stores/nearby` | Nearby agri stores |
| GET | `/api/farmers/dashboard` | Farmer dashboard stats |

---

## 🐳 Docker

```bash
# Start everything with Docker Compose
docker-compose up --build
```

---

## 📜 License

MIT License — see [LICENSE](LICENSE)

---

## 🙏 Acknowledgements

- [PlantVillage Dataset](https://plantvillage.psu.edu/) — disease reference data
- [Open-Meteo](https://open-meteo.com/) — free weather API
- [data.gov.in](https://data.gov.in/) — Agmarknet mandi prices
- [ICAR](https://icar.org.in/) — agricultural knowledge guidelines
- [KVK Network](https://kvk.icar.gov.in/) — Krishi Vigyan Kendras

---

*Built with ❤️ for Indian farmers*
