
<div align="center">
  <img src="frontend/public/logo-2.png" alt="HireSense Logo" width="400" />
  <p><b>AI-Powered Verification &amp; Interview Engine for Authentic Hiring Decisions</b></p>
</div>

# HireSense: Hire with Certainty and Heart

**Beyond resumes, beyond interviews — discover the truth.**

HireSense is an AI-driven truth engine for hiring. In a world of curated resumes, it helps you uncover the authentic story of every candidate. By cross-validating digital footprints and conducting empathetic, AI-powered interviews, HireSense transforms uncertainty into confidence — helping you hire not just the most skilled, but the most trustworthy person for your team.

---

## ✨ Key Features

### 🧬 Unified Candidate Story
**See the full truth at a glance.**
- **Cross-validates digital profiles** (CV, LinkedIn, GitHub, LeetCode)
- **Problem-Solving Analysis**: Integrates LeetCode statistics to verify technical consistency
- **Flags inconsistencies** in claims or achievements
- **Builds a single verified narrative** from fragmented data
- **Automated Reference Calls**: Natural Zoom-based interviews with automated recording, transcription, and AI summarization.

### 🎙️ Empathetic AI Interviews
**Conversations that reveal character, not keywords.**
- **AI-powered candidate & reference calls** with natural conversation flow  
- **Deep transcript analysis** for tone, sentiment, and confidence  
- **Bias-free evaluation** through contextual understanding

### 🎯 The Certainty Score
**Move beyond gut feelings.**
- **AI-generated "Certainty Score"** combining verified data + sentiment analysis  
- **Actionable insights** highlighting red flags and hidden strengths  
- **Holistic credibility rating** for each candidate

### ⚙️ Seamless ATS Integration
**Keep your ATS as the source of truth — make it smarter.**
- **Effortless Ashby sync** to embed verification directly into workflow  
- **Automated documentation & summaries** reduce manual workload  
- **Focus on people, not paperwork**

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router with Turbopack)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3.4 with custom animations
- **UI Components:** Radix UI primitives (Dialog, Dropdown, Select, Tabs, etc.)
- **Animations:** Framer Motion 12
- **State Management:** React 19 with built-in hooks
- **Forms:** Zod validation
- **PDF Processing:** pdf-lib, pdf-parse, pdfjs-dist, pdf2pic
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI (Python)
- **Server:** Uvicorn with hot reload
- **Database:** PostgreSQL 15 (via Supabase)
- **ORM:** psycopg2 with RealDictCursor
- **Realtime:** Supabase Realtime subscriptions
- **Storage:** Supabase Storage (S3-compatible)

### AI & Machine Learning
- **LLM Provider:** Groq API (Llama models for fast inference)
- **Analysis:** OpenAI GPT-4 & GPT-4 Vision
- **Speech-to-Text:** OpenAI Whisper v3 (via local Python pipeline)
- **Text-to-Speech:** ElevenLabs Conversational AI
- **Voice Synthesis:** Edge TTS (Microsoft)
- **Meeting Platform:** Zoom API (Server-to-Server OAuth) for automated scheduling and status tracking.

### Database & Infrastructure
- **Primary Database:** Supabase (PostgreSQL 15)
- **Real-time Engine:** Supabase Realtime
- **Authentication:** Supabase Auth (JWT-based)
- **Storage:** Supabase Storage with RLS policies
- **Database Extensions:** pg_net (HTTP requests), pg_cron (scheduled jobs)
- **Containerization:** Docker
- **Cloud Hosting:** Vultr

### External Integrations
- **ATS:** Ashby API (candidate sync, notes, scoring)
- **LinkedIn Scraping:** BrightData API (snapshot-based)
- **GitHub:** GitHub REST API v3
- **LeetCode:** Alfa LeetCode API (Public & Local Docker support)
- **Code Execution:** Judge0 (Local Docker instance)
- **Email:** Nodemailer with SMTP (Gmail/custom)
- **Waitlist:** Airtable API
- **Analytics:** Google Analytics (Next.js third-party integration)

### Development Tools
- **Package Manager:** pnpm 10
- **Linting:** ESLint 9 with Next.js config
- **Testing:** Vitest 3.2 with UI
- **Type Safety:** TypeScript strict mode
- **Environment:** dotenv-cli for env management
- **Database Migrations:** Supabase CLI
- **Type Generation:** Supabase CLI (database.types.ts)

---

## 🏗️ Architecture Overview

HireSense uses a modern full-stack architecture with event-driven processing:

```
┌─────────────────┐
│   Next.js App   │ ← User Interface (React 19)
│  (Frontend)     │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
┌────────▼────────┐  ┌────▼──────────┐
│  Next.js API    │  │  FastAPI      │
│  Routes         │  │  Backend      │
│  (10 endpoints) │  │  (5 endpoints)│
└────────┬────────┘  └────┬──────────┘
         │                │
         │                │
┌────────▼────────────────▼──────────┐
│      Supabase PostgreSQL            │
│  - Users, Applicants, Files         │
│  - Ashby Candidates Cache           │
│  - Database Triggers (pg_net)       │
│  - Row Level Security (RLS)         │
└─────────────────────────────────────┘
         │
         ├────────────────┬───────────────┬──────────────┐
         │                │               │              │
┌────────▼───────┐ ┌─────▼──────┐ ┌─────▼──────┐ ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐
│ OpenAI GPT-4   │ │ Groq API   │ │ ElevenLabs │ │ Ashby    │ │ Judge0   │ │ Zoom API │
│ (Analysis)     │ │ (Whisper,  │ │ (Voice AI) │ │ (ATS)    │ │ (Code)   │ │ (Meet)   │
│                │ │  LLaMA)    │ │            │ │          │ │          │ │          │
└────────────────┘ └────────────┘ └────────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Event-Driven & Resilient Processing Flow

1. **Upload CV** → Client-side trigger → `/api/cv-process` → Extract structured data
2. **Add LinkedIn URL** → Client-side trigger → `/api/linkedin-fetch` → Scrape profile with BrightData
3. **Add GitHub URL** → Client-side trigger → `/api/github-fetch` → Analyze repos and complexity
4. **Add LeetCode URL** → Client-side trigger → `/api/leetcode-fetch` → Fetch stats and contest ratings
5. **Data Ready** → Atomic state merge → `/api/analysis` → Generate Certainty Score
6. **Reference Verification** → `/api/reference-call` → Auto-schedule Zoom → Email invite
7. **Recording Pipeline** → Zoom Meeting ends → Local recording saved → `watcher.py` detects file → Auto-upload to backend
8. **AI Summarization** → Backend triggers Whisper transcription → GPT-4o generates call summary → Dashboard updates in real-time

### Reactivity & Robustness
The system implements a dual-layer reactivity model to ensure results load automatically:
- **Resilient State Merging**: `ApplicantContext` merges real-time Postgres payloads to prevent data loss.
- **Polling Fallback**: A 4-second heartbeat fallback in the `BoardPage` acts as a fail-safe for websocket interruptions.

Processing uses atomic status management to prevent race conditions. Each pipeline step uses a shared `startProcessing()` utility that:
- Atomically sets status to `processing`
- Runs the processor function
- Updates status to `ready` or `error`
- Returns appropriate HTTP status codes

---

## 📦 Project Structure

```
HireSense/
├── backend/                    # FastAPI Backend
│   ├── main.py                # API routes & server
│   ├── interview.py           # Interview logic (Session, LLM, Audio)
│   ├── database.py            # PostgreSQL connection & queries
│   ├── fetcher.py             # Utility to fetch applicants
│   ├── requirements.txt       # Python dependencies
│   ├── static/                # Static files (index.html)
│   ├── audio/                 # Generated TTS audio files
│   ├── watcher.py             # Folder watcher for Zoom recordings
│   └── recordings/            # (Local) Zoom recording storage source
│
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/               # Next.js App Router
│   │   │   ├── api/          # API Routes (10 endpoints)
│   │   │   │   ├── ashby/    # Ashby ATS integration
│   │   │   │   ├── analysis/ # AI analysis
│   │   │   │   ├── cv-process/ # CV processing
│   │   │   │   ├── github-fetch/ # GitHub scraping
│   │   │   │   ├── linkedin-fetch/ # LinkedIn scraping (BrightData)
│   │   │   │   ├── leetcode-fetch/ # LeetCode stats fetching
│   │   │   │   ├── reference-call/ # Zoom scheduling & Email
│   │   │   │   ├── zoom-webhook/  # Zoom meeting status updates
│   │   │   │   ├── get-transcript/ # ElevenLabs transcripts
│   │   │   │   ├── summarize-transcript/ # Call summaries
│   │   │   │   ├── test-webhook/ # Webhook testing
│   │   │   │   └── waitlist/ # Waitlist management
│   │   │   ├── auth/         # Authentication pages
│   │   │   ├── board/        # Applicant dashboard
│   │   │   ├── call/         # Interview interface
│   │   │   ├── login/        # Login page
│   │   │   ├── setup/        # Onboarding
│   │   │   ├── waitlist/     # Waitlist page
│   │   │   ├── layout.tsx    # Root layout
│   │   │   ├── page.tsx      # Landing page
│   │   │   └── globals.css   # Global styles
│   │   ├── components/        # React components
│   │   │   ├── ui/           # Reusable UI components
│   │   │   ├── BoardSidebar.tsx
│   │   │   ├── ReferenceCallForm.tsx
│   │   │   ├── TranscriptModal.tsx
│   │   │   ├── WaitlistOverlay.tsx
│   │   │   └── ...
│   │   ├── lib/              # Utility libraries
│   │   │   ├── supabase/     # Supabase client utilities
│   │   │   ├── contexts/     # React contexts (ApplicantContext)
│   │   │   ├── github.ts     # GitHub API client
│   │   │   ├── linkedin-api.ts # LinkedIn scraping via BrightData
│   │   │   ├── analysis.ts   # AI analysis logic
│   │   │   ├── profile-pdf.ts # CV extraction
│   │   │   ├── processing.ts # Shared processing utilities
│   │   │   ├── ashby/        # Ashby integration
│   │   │   ├── scoring.ts    # Score calculation
│   │   │   └── ...
│   │   └── middleware.ts     # Auth & routing middleware
│   ├── supabase/
│   │   ├── migrations/       # Database migrations
│   │   ├── functions/        # Edge functions
│   │   ├── config.toml       # Supabase config
│   │   └── seed.sql          # Seed data
│   ├── public/               # Static assets
│   ├── package.json          # Node dependencies
│   ├── next.config.ts        # Next.js config
│   ├── tailwind.config.js    # Tailwind config
│   └── tsconfig.json         # TypeScript config
│
├── mock_data/                 # Sample data for testing
├── assets/                    # Project assets
├── Dockerfile                 # Docker configuration
├── env.example                # Environment variables template
├── verify_keys.py             # API key verification script
├── verify_api.py              # API health check script
├── INSTALLATION.md            # Detailed setup guide
├── API-ENDPOINTS.md           # API documentation
└── README.md                  # This file
```

---

## 🔧 Installation & Setup

### Prerequisites

- **Node.js**: 18+ (recommended: 20 LTS)
- **Python**: 3.9+
- **Docker**: Latest version (for Supabase local)
- **pnpm**: `npm install -g pnpm`
- **Supabase CLI**: `npm install -g supabase`

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/HireSense.git
   cd HireSense
   ```

2. **Setup environment variables**
   ```bash
   # Root directory
   cp env.example .env

   # Frontend directory
   cd frontend
   cp env.local.example .env.local

   # Backend directory
   cd ../backend
   cp env.example .env
   ```

3. **Configure API keys in `.env` files**
   - Supabase credentials
   - OpenAI API key
   - Groq API key
   - ElevenLabs API key
   - Optional: Ashby, BrightData, GitHub, Twilio, Airtable

4. **Start Supabase locally**
   ```bash
   cd frontend
   pnpm supabase start
   ```
   
   This will output local URLs and keys. Update `.env.local` with:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

5. **Install frontend dependencies**
   ```bash
   pnpm install
   ```

6. **Run database migrations**
   ```bash
   pnpm supabase:reset
   pnpm supabase:types
   ```

7. **Start frontend development server**
   ```bash
   pnpm dev
   ```
   Frontend: http://localhost:3000

8. **Install backend dependencies**
   ```bash
   cd ../backend
   pip install -r requirements.txt
   ```

9. **Start backend server**
   ```bash
   python main.py
   ```
   Backend: http://localhost:8000

10. **Start the Zoom Recording Watcher** (Required for Reference Calls)
    In a new terminal:
    ```bash
    cd backend
    python watcher.py
    ```
    Ensure your Zoom local recording path is set correctly in `watcher.py` (Default: `E:\HireSense\Call Recordings`).

11. **Configure Zoom Webhooks**
    - Use [Ngrok](https://ngrok.com/) to expose your local frontend: `ngrok http 3000`
    - In Zoom App Marketplace → Feature → Event Subscriptions:
    - Event Notification Endpoint: `https://your-ngrok-url.ngrok-free.app/api/zoom-webhook`
    - Subscribe to: `Meeting -> Start Meeting` and `Meeting -> End Meeting`.

### Docker Setup (Alternative)

```bash
docker-compose up --build
```

This starts both frontend and backend in containers.

---

## 🌍 Environment Variables

See [`env.example`](./env.example) for complete list. Key variables:

### Required
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENAI_API_KEY` - OpenAI API key
- `GROQ_API_KEY` - Groq API key
- `DATABASE_URL` - PostgreSQL connection string

### Optional
- `ELEVENLABS_API_KEY` - For voice AI interviews
- `ELEVENLABS_AGENT_ID` - ElevenLabs agent ID
- `ASHBY_API_KEY` - For ATS integration
- `BRIGHTDATA_API_KEY` - For LinkedIn scraping (do **not** wrap in quotes)
- `LINKEDIN_SCRAPING_ENABLED` - Set to `true` to enable real scraping
- `GITHUB_TOKEN` - For GitHub API (higher rate limits)
- `AIRTABLE_API_KEY` - For waitlist management
- `SMTP_*` - Email configuration

> **Note:** API keys in `.env` files should **not** be wrapped in quotes — the application will automatically strip any surrounding quotes for safe use.

---

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

### Core Tables

#### `users`
```sql
id uuid PRIMARY KEY          -- References auth.users(id)
email text NOT NULL
full_name text
ashby_api_key text          -- Ashby integration
preferences jsonb           -- User preferences
created_at timestamptz
updated_at timestamptz
```

#### `applicants`
```sql
id uuid PRIMARY KEY
user_id uuid                -- Foreign key to users
name text
email text
phone text
linkedin_url text
github_url text
source text                 -- 'manual', 'ashby', etc.

-- File reference
cv_file_id uuid            -- Foreign key to files

-- Processing status (enum: pending, processing, ready, error, not_provided, skipped)
cv_status processing_status
li_status processing_status
gh_status processing_status
lc_status processing_status     -- LeetCode status
ai_status processing_status

-- JSON data
cv_data jsonb
li_data jsonb
gh_data jsonb
lc_data jsonb                   -- LeetCode fetched stats
ai_data jsonb
calls_summary text         -- Interview evaluation

-- Metadata
leetcode_url text               -- Candidate LeetCode profile
github_url text
linkedin_url text

-- Generated columns
status overall_status GENERATED  -- Computed from sub-statuses
score integer GENERATED           -- Extracted from ai_data

created_at timestamptz
updated_at timestamptz
```

#### `files`
```sql
id uuid PRIMARY KEY
user_id uuid
file_type text             -- 'cv', 'linkedin', 'github', 'other'
original_filename text
storage_path text
storage_bucket text        -- Default: 'candidate-cvs'
file_size bigint
mime_type text
created_at timestamptz
updated_at timestamptz
```

#### `reference_calls`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PRIMARY KEY | Unique call ID |
| applicant_id | uuid | Links to applicant |
| status | text | scheduled, started, ended, recording_uploaded, transcribed |
| zoom_join_url | text | Meeting link |
| zoom_meeting_id | text | Meeting ID |
| duration_minutes | int | Scheduled duration |
| recording_url | text | Supabase storage URL |
| transcript | jsonb | Full Whisper transcript |
| ai_summary | text | GPT-4o summary |
| created_at | timestamptz | Timestamp |

#### `ashby_candidates`
```sql
id uuid PRIMARY KEY
user_id uuid
ashby_id text UNIQUE
name text
email text
position text
company text
linkedin_url text
github_url text

-- JSON fields
emails jsonb
phone_numbers jsonb
social_links jsonb
tags jsonb
resume_file_handle jsonb

-- References
HireSense_applicant_id uuid  -- Links to applicants table
cv_file_id uuid              -- Shared file reference

-- Metadata
last_synced_at timestamptz
stored_at timestamptz
updated_at timestamptz
```

### Database Triggers

The system uses PostgreSQL triggers for automatic processing:

1. **`webhook_cv_trigger`**: Fires when `cv_file_id` is set
2. **`webhook_linkedin_trigger`**: Fires when `linkedin_url` is set
3. **`webhook_github_trigger`**: Fires when `github_url` is set
4. **`webhook_ai_trigger`**: Fires when all data sources are ready

All triggers use `pg_net` extension to make HTTP POST requests to Next.js API routes.

---

## 📚 API Documentation

See [`API-ENDPOINTS.md`](./API-ENDPOINTS.md) for complete API reference including:
- 5 Backend FastAPI endpoints (Interview system)
- 10 Frontend Next.js API routes (Processing pipeline)
- Request/response schemas
- Authentication requirements
- Rate limits
- Error handling

---

## 🚀 Deployment

### Frontend (Next.js)

**Recommended: Vercel**
```bash
pnpm build
pnpm start
```

**Alternative: Docker**
```bash
docker build -t hiresense-frontend ./frontend
docker run -p 3000:3000 hiresense-frontend
```

### Backend (FastAPI)

**Recommended: Vultr/DigitalOcean**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Alternative: Docker**
```bash
docker build -t hiresense-backend ./backend
docker run -p 8000:8000 hiresense-backend
```

### Judge0 (Local Code Execution Engine)

To enable optional live coding interviews, HireSense can integrate with a locally hosted [Judge0](https://github.com/judge0/judge0) instance.

1. **Clone and start Judge0 via Docker** (see official docs for latest commands):
   ```bash
   git clone https://github.com/judge0/judge0.git
   cd judge0
   cp .env.example .env
   docker compose -f docker-compose.yml up -d
   ```

   By default, Judge0 CE exposes an HTTP API on port `2358`:
   - Base URL: `http://127.0.0.1:2358`

2. **Configure HireSense to talk to Judge0**

   In the root `.env` file:
   ```bash
   JUDGE0_API_URL=http://127.0.0.1:2358
   BACKEND_API_URL=http://127.0.0.1:8000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **How the integration works**

   - Backend FastAPI exposes:
     - `POST /judge0/execute` — proxies JSON payloads to `JUDGE0_API_URL/submissions?wait=true`.
   - Next.js exposes:
     - `POST /api/judge0` — frontend-friendly API that forwards requests to the FastAPI backend.
   - Frontend:
     - `/coding-interview/[id]` — a simple coding interview page that lets references run code snippets in Python, JavaScript, or C++ using Judge0.
     - Reference invitation emails can optionally include a **coding interview link** pointing to this page, in addition to the normal meeting URL.

### Database

**Production: Supabase Cloud**
1. Create project at supabase.com
2. Run migrations: `pnpm supabase db push`
3. Update environment variables with production credentials

**Self-hosted: PostgreSQL 15+**
- Requires `pg_net` extension for webhooks
- Run migrations manually
- Configure connection pooling (PgBouncer recommended)

---

## 🧪 Testing

### Verification Scripts

```bash
# Verify all external API keys
python verify_keys.py

# Check all API endpoint health
python verify_api.py
```

### Frontend Tests
```bash
cd frontend
pnpm test           # Run all tests
pnpm test:run       # Run once (CI mode)
pnpm test:ashby     # Test Ashby integration
```

### Backend Tests
```bash
cd backend
python -m pytest
```

### Database Tests
```bash
cd frontend
pnpm supabase test
```

---

## 🛠️ Development Workflow

### Available Scripts (Frontend)

```bash
pnpm dev                    # Start dev server with Turbopack
pnpm build                  # Build for production
pnpm start                  # Start production server
pnpm lint                   # Run ESLint

# Supabase
pnpm supabase:start         # Start local Supabase
pnpm supabase:stop          # Stop local Supabase
pnpm supabase:reset         # Reset database
pnpm supabase:types         # Generate TypeScript types
pnpm supabase:fresh         # Fresh start (stop + start + types)

# Testing
pnpm test                   # Run Vitest
pnpm test:ashby            # Test Ashby integration
```

### Available Scripts (Backend)

```bash
python main.py             # Start FastAPI server
python fetcher.py          # Fetch and display applicants
```

### Database Migrations

```bash
# Create new migration
pnpm supabase migration new migration_name

# Apply migrations
pnpm supabase db push

# Generate types after migration
pnpm supabase:types
```

---

## 🔐 Security

- **Row Level Security (RLS)**: All tables use Supabase RLS policies
- **JWT Authentication**: Supabase Auth with secure tokens
- **Environment Variables**: Never commit `.env` files
- **API Rate Limiting**: Built-in rate limiters on all routes
- **Input Validation**: Zod schemas for all API inputs
- **File Upload Limits**: 50MB max, PDF/DOCX only
- **CORS**: Configured only for allowed origins

---

## 📖 Additional Documentation

- **[Installation Guide](./INSTALLATION.md)** - Detailed setup instructions
- **[API Reference](./API-ENDPOINTS.md)** - Complete API documentation
- **[Environment Variables](./env.example)** - Configuration reference

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

This project is proprietary and confidential.

---

## 🆘 Support

For issues and questions:
- Check [INSTALLATION.md](./INSTALLATION.md) for setup help
- Review [API-ENDPOINTS.md](./API-ENDPOINTS.md) for API usage
- Contact: support@hiresense.ai

---

<div align="center">
  <b>HireSense — Replacing uncertainty with undeniable proof.</b>
</div>
