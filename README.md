# AI for Bharat — India's AI Product Discovery Platform

> Discover and showcase AI tools built by Indian developers — with live transparency showing you every step taken behind the scenes.

![AI for Bharat Landing Page](https://github.com/user-attachments/assets/e845a196-7688-4b59-b4b7-2ffb3f4f8b7f)

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React 18, Vite, Tailwind CSS, React Router, Recharts |
| Backend  | Node.js, Express 5, JWT Auth, AWS SDK           |
| Database | MongoDB, AWS DynamoDB                           |
| Services | AWS Lambda, OpenSearch, Google Gemini, Tavily   |

---

## Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

### 1. Clone the repository

```bash
git clone https://github.com/AshKatale/ai-for-bharat.git
cd ai-for-bharat
```

### 2. Install dependencies

```bash
# Install root dev tools (concurrently)
npm install

# Install all dependencies for client and server
npm run install:all
```

### 3. Configure environment variables

```bash
cp server/.env.example server/.env
```

Open `server/.env` and fill in your values:

```env
PORT=8080
NODE_ENV=development
DATABASE_URL=mongodb://localhost:27017/ai-bharat
JWT_SECRET=your_jwt_secret_key_here

# AWS credentials (required for DynamoDB / Lambda / S3)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Optional AI integrations
TAVILY_API_KEY=your_tavily_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

> **Note:** The frontend works fully in demo mode without a running backend. AWS credentials are only needed when using live product data or AI features.

### 4. Run the project

#### Run both client and server together

```bash
npm run dev
```

| Service  | URL                       |
| -------- | ------------------------- |
| Frontend | http://localhost:5173     |
| Backend  | http://localhost:8080     |
| API Health | http://localhost:8080/api/health |

#### Run only the frontend (no backend required)

```bash
npm run dev:client
```

→ Open **http://localhost:5173** in your browser.

#### Run only the backend

```bash
npm run dev:server
```

---

## Project Structure

```
ai-for-bharat/
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── pages/   # Landing, Login, Signup, Dashboard pages
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── routes/
│   │   └── services/api.js
│   └── package.json
│
├── server/          # Node.js + Express backend API
│   ├── routes/      # user, product, geo, sentiment, AWS routes
│   ├── controllers/
│   ├── services/    # AWS, DynamoDB integrations
│   ├── middleware/
│   ├── config/
│   └── server.js
│
├── services/        # Python AI micro-services
│   ├── post_generation_service.py
│   ├── question_generation_service.py
│   └── ai_nova_image_generation.py
│
└── vector-db/       # OpenSearch / vector DB setup
```

## Available Pages

| Route                        | Description                          |
| ---------------------------- | ------------------------------------ |
| `/`                          | Landing page                         |
| `/login`                     | Sign in                              |
| `/signup`                    | Create account                       |
| `/dashboard`                 | Overview & analytics                 |
| `/dashboard/search`          | Live AI search simulation            |
| `/dashboard/products`        | Browse AI products                   |
| `/dashboard/add-product`     | List a new product                   |
| `/dashboard/image-generator` | AI-powered image ad generator        |
| `/dashboard/video-generator` | AI-powered video/reel generator      |
| `/dashboard/settings`        | Account settings                     |

## Build for Production

```bash
npm run build
```

The compiled frontend is output to `client/dist/`.
