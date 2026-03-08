[![Geonix Poster](https://i.postimg.cc/5NqHB8nR/Gemini_Generated_Image_lhsu6clhsu6clhsu.png)](https://postimg.cc/BXbQsPWT)

# Geonix — Generative Engine Optimization (GEO) & Marketing Platform  
**Team:** Tech Avinya  
**Team Leader:** Prathamesh Bhaskar  

> **THE FUTURE OF DISCOVERY IS AI ANSWERS, NOT SEARCH ENGINES.**  
Businesses lack visibility and control over how their products appear in AI‑generated answers, making traditional marketing ineffective in the AI-driven discovery era.

Geonix is an end‑to‑end **Generative Engine Optimization (GEO)** + **GenAI Marketing** platform designed to help brands:
- **Measure** how LLMs recommend them vs competitors (Share of Voice / Share of Answer)
- **Identify** “data voids” where competitors win AI mindshare
- **Generate** campaign assets (text, posters, 4K reels) to improve discoverability in AI answers

---

## Links
- **Live Project:** `www.geonix.live`  
- **GitHub Repo:** `https://github.com/AshKatale/ai-for-bharat`  
- **Demo Video (≤ 3 mins):** `https://www.youtube.com/watch?v=G9nuxN81Md4`

---

## Problem Statement
Businesses lack visibility and control over how their products appear in AI-generated answers, making traditional marketing ineffective in the AI-driven discovery era.

---

## What Geonix Offers

### 1) AI Presence Analytics (GEO Benchmarking)
- Cross‑model benchmarking (GPT / Claude / Nova / Gemini)
- Share‑of‑Voice insights across AI answers
- Competitor outranking signals (where & why they appear above you)

### 2) Strategy & Optimization
- Data-driven suggestions to fix gaps in product context and knowledge signals
- Recommendations to close “data voids” that reduce AI discoverability

### 3) Multi‑Modal Generation & Deployment
- Social copy + poster creatives + **4K video reels**
- Automated workflows to create and reuse campaign assets efficiently

---

## Why AI is Needed (in this solution)
- **Semantic intent understanding** for context-aware responses
- **RAG grounding** via vector retrieval to reduce hallucinations and keep outputs factual
- **Multi‑modal generation** (text + image + video) from a single brief at scale
- **Cross‑model evaluation** to measure real AI “share of answer” rather than guessing

---

## Architecture
### Proposed Solution Architecture
[![Technical-architecture.png](https://i.postimg.cc/d1YRQJ1d/Technical-architecture.png)](https://postimg.cc/sBTGwd5D)

---

## Technologies Used

| Category | Technologies |
|---|---|
| **Frontend** | React.js, Vite, Tailwind CSS |
| **Backend** | Node.js (Express), AWS Lambda, API Gateway, EC2 |
| **AI / GenAI** | Amazon Bedrock Runtime, Nova Pro, Nova Reel, Nova Canvas, Bedrock Knowledge Base (RAG) via `bedrock-agent-runtime` |
| **Intelligence** | OpenSearch Serverless (Vector DB), RAG retrieval, Tavily Search API |
| **Storage** | DynamoDB, Amazon S3 |

---

# Developer / Codebase Guide

## Repo Structure
```txt
client/                # React (Vite) frontend
server/                # Node.js (Express) backend API
services/              # supporting services (AI workflows, intelligence modules)
vector-db/             # vector retrieval service used by GEO pipeline
```

## Key Entry Points

### Frontend
- `client/src/main.jsx` — React bootstrap
- `client/src/App.jsx` — root component
- `client/src/routes/AppRoutes.jsx` — route map (landing, auth, dashboard, generators)

### Backend
- `server/server.js` — Express server entry, mounts all `/api/*` routes
- `server/config/env.js` — central env config (AWS, DynamoDB tables, Vector DB, Astra, etc.)
- `server/.env.example` — environment variable template

---

## Local Setup

### Prerequisites
- Node.js 18+
- npm

### 1) Install dependencies

**Frontend**
```bash
cd client
npm install
```

**Backend**
```bash
cd server
npm install
```

### 2) Configure environment variables (Backend)
```bash
cd server
cp .env.example .env
```

Minimum recommended config:
- `PORT`, `NODE_ENV`, `JWT_SECRET`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` (if using AWS-backed flows)
- `TAVILY_API_KEY` (for sentiment intelligence)
- `VECTOR_DB_URL` (for GEO context grounding), defaults to `http://localhost:8081`

### 3) Run in development

**Backend**
```bash
cd server
npm run dev
```

**Frontend**
```bash
cd client
npm run dev
```

---

## Backend API (What’s implemented in code)

### Health
- `GET /api/health` — server status + AWS connectivity signal

### Users (`/api/users`)
- `POST /signup`
- `POST /login`
- `GET /username/:username`

### Products (`/api/products`)
- `GET /` — list products
- `GET /search` — search products
- `GET /global-stats` — aggregated stats
- `GET /search/stream?q=...` — **SSE streaming search**
- `POST /generate-video`
- `POST /generate-image-ad`
- `POST /generate-post`

### GEO Sessions (`/api/geo`)
- Create and manage GEO analysis sessions
- Store questions, answers, models used, and metadata per session

### Question Generation (`/api/questions`)
- `POST /generate` — generate AI-ranking questions from `product_id` and `search_query`

### Cross‑Model Evaluation (`/api/evaluate`)
- `POST /` — evaluate question set across multiple models

### Sentiment Intelligence (`/api/sentiment`)
- `GET /dev-token` — dev token for local testing
- `POST /analyze/:productId` — sentiment + competitor intelligence pipeline

---

## Cost & Reuse (Engineering Notes)
To control GenAI spend and latency, the architecture supports:
- prompt reuse / duplicate detection
- near-duplicate caching via normalization + hashing
- multi-layer caching (DynamoDB for metadata/text + S3 for heavy assets)

---

## Team
**Tech Avinya**  
Team Leader: **Prathamesh Bhaskar**
