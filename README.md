[![Gemini_Generated_Image_lhsu6clhsu6clhsu.png](https://i.postimg.cc/5NqHB8nR/Gemini_Generated_Image_lhsu6clhsu6clhsu.png)](https://postimg.cc/BXbQsPWT)

# AI for Bharat — AI Discoverability Optimization Platform
A full-stack platform to help products/brands improve **visibility in AI answers** using:
- GEO (Generative Engine Optimisation) analysis
- Question generation + multi-model evaluation
- Market sentiment & competitor intelligence
- Content generators (image/video ads, social posts)
- Product directory + dashboards

## Monorepo Structure

```txt
client/     # React (Vite) frontend
server/     # Node.js (Express) API
vector-db/  # Vector DB service (used by GEO pipeline)
services/   # Supporting services (varies by feature)
```

## Tech Stack

**Frontend**
- React + Vite
- TailwindCSS
- React Router
- Axios
- Recharts, Framer Motion

**Backend**
- Node.js + Express
- JWT auth + bcrypt password hashing
- AWS SDK (DynamoDB, Lambda)
- DataStax Astra DB SDK
- Google GenAI (Gemini)
- Tavily (for sentiment document retrieval)
- Optional: local Vector DB service (for GEO context)

---

## Getting Started (Local Development)

### 1) Prerequisites
- Node.js 18+ (recommended)
- npm
- (Optional) AWS credentials (for DynamoDB/Lambda)
- (Optional) Vector DB service running (default `http://localhost:8081`)
- (Optional) Tavily API key (for sentiment feature)

### 2) Install Dependencies

#### Frontend
```bash
cd client
npm install
```

#### Backend
```bash
cd server
npm install
```

### 3) Configure Environment Variables (Backend)

Copy the example env:
```bash
cd server
cp .env.example .env
```

Update values as needed.

**Important envs used by the server**
- `PORT` (default: 5000)
- `NODE_ENV` (default: development)
- `JWT_SECRET` (default fallback exists, but set your own)
- **AWS**
  - `AWS_REGION` (default: ap-south-1)
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `DYNAMODB_*_TABLE_NAME` (Users, Products, GEOAnalysisSessions)
- **Vector DB**
  - `VECTOR_DB_URL` (default: `http://localhost:8081`)
  - `VECTOR_DB_COLLECTION` (default: `productsdetails`)
  - `VECTOR_CONTEXT_LIMIT` (default: 8)
- **AstraDB** (if used by your deployment)
  - `ASTRA_DB_TOKEN`
  - `ASTRA_DB_ENDPOINT`
  - `ASTRA_DB_KEYSPACE`
- **Sentiment Intelligence**
  - `TAVILY_API_KEY`
  - `SENTIMENT_CACHE_TTL_SECONDS`
  - `SENTIMENT_TIMEOUT_MS`
  - `OPENAI_API_KEY` (optional depending on pipeline)

### 4) Run the Apps

#### Start backend
```bash
cd server
npm run dev
```

Backend should start on:
- `http://localhost:5000`

Health check:
- `GET /api/health`

#### Start frontend
```bash
cd client
npm run dev
```

Frontend dev server is typically:
- `http://localhost:5173`

---

## Core API Routes (Backend)

Base URL: `http://localhost:5000`

### Health
- `GET /api/health` — server status + AWS connectivity check

### Users (`/api/users`)
- `POST /signup` — create account
- `POST /login` — login
- `GET /username/:username` — public lookup
- Protected:
  - `GET /` — list users
  - `GET /:id` — user details
  - `PUT /:id` — update user
  - `PUT /:id/password` — change password

### Products (`/api/products`)
- `GET /` — list products
- `GET /search` — search products
- `GET /global-stats` — aggregated stats
- `GET /search/stream?q=...` — **SSE streaming search**
- `GET /:id` — product detail
- Protected:
  - `POST /` — create product
  - `PUT /:id` — update product
  - `DELETE /:id` — delete product

Content generation:
- `POST /generate-video`
- `POST /generate-image-ad`
- `POST /generate-post`

### GEO Analysis (`/api/geo`)
Session workflow:
- `POST /session` — create a GEO session
- `GET /sessions/:product_id` — list sessions for product
- `GET /session/:product_id/:session_id` — session details
- `POST /session/:product_id/:session_id/questions` — add/update questions
- `POST /session/:product_id/:session_id/answers` — add/update answers
- `PATCH /session/:product_id/:session_id/models` — update models used
- `PATCH /session/:product_id/:session_id/metadata` — update metadata

### Question Generation (`/api/questions`)
- `POST /generate` — generate AI-ranking questions  
  Body:
  ```json
  { "product_id": "p1", "search_query": "best accounting software for SMEs" }
  ```

### Evaluation (`/api/evaluate`)
- `POST /` — evaluate questions across multiple models  
  Body:
  ```json
  { "questions": [ { "question_number": 1, "question": "..." } ] }
  ```

### Sentiment (`/api/sentiment`)
- `GET /dev-token` — dev JWT token (for local testing)
- `POST /analyze/:productId` — run sentiment + competitor intelligence

---

## Frontend Routes (High Level)

- `/` — landing
- `/login`, `/signup`
- `/dashboard` ��� overview + sections
- `/dashboard/products`
- `/dashboard/add-product`
- `/dashboard/image-generator`
- `/dashboard/video-generator`
- `/dashboard/post-generator`
- `/dashboard/settings`

---

## How GEO Works (Conceptual)

1. Questions are generated for a product + search query  
2. Questions are evaluated across multiple LLMs  
3. The GEO pipeline fetches **vector context** from the Vector DB and sends results to Gemini for analysis  
4. Sessions store: competitors, models used, Q/A pairs, metadata, etc.

---

## Notes / Troubleshooting

- If `/api/products/search/stream` reports AWS credential errors, configure AWS keys in `server/.env`.
- Vector context fetch failures are non-fatal but reduce GEO signal. Ensure your vector DB is running and `VECTOR_DB_URL` is correct.
- Sentiment analysis requires a valid `TAVILY_API_KEY` for best results (it can fall back to low-signal mode).

---

## License
Add a license file if you plan to distribute this project.
