# HireSense Installation Guide

<div align="center">
  <img src="frontend/public/logo-2.png" alt="HireSense Logo" width="400" />
  <p><b>AI-Powered Verification & Interview Engine for Authentic Hiring Decisions</b></p>
</div>

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Installation](#detailed-installation)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

---

## 🚀 Prerequisites

Before installing HireSense, ensure you have the following installed on your system:

### Required Software

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download here](https://www.python.org/downloads/)
- **Docker** - [Download here](https://www.docker.com/get-started)
- **Git** - [Download here](https://git-scm.com/downloads)

### Package Managers

- **pnpm** (recommended) - Install with: `npm install -g pnpm`
- **pip** (Python package manager)

### API Keys Required

You'll need accounts and API keys for the following services:

- **Supabase** - [Sign up here](https://supabase.com/)
- **OpenAI** - [Get API key here](https://platform.openai.com/api-keys)
- **Groq** - [Get API key here](https://console.groq.com/keys)
- **ElevenLabs** - [Get API key here](https://elevenlabs.io/app/settings/api-keys)
- **GitHub** - [Generate token here](https://github.com/settings/tokens)
- **Zoom** - [Create S2S OAuth App](https://marketplace.zoom.us/) (Required for Reference Calls)

### Optional Services

- **Ashby** (ATS integration)
- **BrightData** (LinkedIn scraping)
- **Airtable** (Waitlist management)

---

## ⚡ Quick Start

For a quick setup, follow these steps:

```bash
# 1. Clone the repository
git clone https://github.com/your-username/HireSense.git
cd HireSense

# 2. Install frontend dependencies
cd frontend
pnpm install

# 3. Start Supabase (requires Docker)
pnpm supabase start

# 4. Install backend dependencies
cd ../backend
pip install -r requirements.txt

# 5. Configure environment variables
cp env.example .env
# Edit .env with your API keys

# 6. Run the application
cd ../frontend
pnpm dev
```

The application will be available at `http://localhost:3000`

---

## 🔧 Detailed Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/HireSense.git
cd HireSense
```

### Step 2: Frontend Setup

```bash
cd frontend

# Install dependencies using pnpm (recommended)
pnpm install

# Alternative: Install using npm
npm install
```

### Step 3: Backend Setup

```bash
cd ../backend

# Create a virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 4: Database Setup with Supabase

```bash
cd ../frontend

# Start Supabase local development environment
pnpm supabase start

# This will:
# - Start PostgreSQL database on port 54322
# - Start Supabase API on port 54321
# - Start Supabase Studio on port 54323
# - Run all database migrations
# - Seed the database with test data
```

**Note:** Make sure Docker is running before executing the above command.

### Step 5: Verify Installation

Check that all services are running:

```bash
# Check Supabase status
pnpm supabase status

# You should see:
# API URL: http://127.0.0.1:54321
# DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
# Studio URL: http://127.0.0.1:54323
```

---

## 🔐 Environment Configuration

### Frontend Environment Variables

1. Copy the example environment file:
```bash
cd frontend
cp env.local.example .env.local
```

2. Edit `.env.local` with your actual values:

```env
# Application Settings
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# AI Services
OPENAI_API_KEY=your_openai_api_key_here
GROQ_API_KEY=your_groq_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# External Services
GITHUB_TOKEN=your_github_token_here
ASHBY_API_KEY=your_ashby_api_key_here
```

### Backend Environment Variables

1. Copy the example environment file:
```bash
cd backend
cp env.example .env
```

2. Edit `.env` with your actual values:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# AI Services
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Getting Supabase Keys

After starting Supabase locally, you can find your keys:

1. Visit [Supabase Studio](http://127.0.0.1:54323)
2. Go to Settings → API
3. Copy the following:
   - **Project URL**: `http://127.0.0.1:54321`
   - **anon public key**: Use this for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret key**: Use this for `SUPABASE_SERVICE_ROLE_KEY`

---

## 🗄️ Database Setup

### Automatic Setup (Recommended)

The database is automatically set up when you run `pnpm supabase start`. This includes:

- Creating all necessary tables
- Setting up Row Level Security (RLS) policies
- Running database migrations
- Seeding with test data

### Manual Database Operations

If you need to reset or modify the database:

```bash
# Reset database (removes all data)
pnpm supabase db reset

# Apply new migrations
pnpm supabase db push

# Generate TypeScript types
pnpm supabase:types

# View database schema
pnpm supabase:diff
```

### Database Schema Overview

The main tables include:

- **users**: User profiles and preferences
- **files**: File metadata for Supabase Storage
- **applicants**: Candidate information and AI analysis
- **events**: System events and processing logs
- **webhook_queue**: Async processing queue

---

## 🚀 Running the Application

### Development Mode

1. **Start the database** (if not already running):
```bash
cd frontend
pnpm supabase start
```

2. **Start the frontend**:
```bash
pnpm dev
```

3. **Start the backend** (in a separate terminal):
```bash
cd backend
python main.py
```

4. **Start the Reference Call Watcher** (Required for automation):
```bash
cd backend
python watcher.py
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Supabase Studio**: http://127.0.0.1:54323
- **Supabase API**: http://127.0.0.1:54321

### Test User Credentials

A test user is automatically created with these credentials:
- **Email**: team@HireSense.click
- **Password**: hiresense

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Docker Not Running
```
Error: Docker is not running
```
**Solution**: Start Docker Desktop and ensure it's running before executing Supabase commands.

#### 2. Port Already in Use
```
Error: Port 54321 is already in use
```
**Solution**: 
```bash
# Stop Supabase
pnpm supabase stop

# Or kill the process using the port
lsof -ti:54321 | xargs kill -9
```

#### 3. Database Connection Issues
```
Error: connection refused
```
**Solution**: Ensure Supabase is running and check your `DATABASE_URL` in `.env` files.

#### 4. Missing API Keys
```
Error: API key not found
```
**Solution**: Verify all required API keys are set in your `.env.local` file.

#### 5. Python Dependencies Issues
```
Error: Module not found
```
**Solution**: 
```bash
cd backend
pip install -r requirements.txt
```

#### 6. Zoom Recording Not Uploading
**Solution**: 
- Ensure `watcher.py` is running in a terminal.
- Verify `E:\HireSense\Call Recordings` path exists.
- Check `WATCHER_SECRET` matches in both `.env` files.

### Logs and Debugging

#### Frontend Logs
```bash
# Check Next.js logs in terminal
pnpm dev

# Check Supabase logs
pnpm supabase logs
```

#### Backend Logs
```bash
# Check FastAPI logs in terminal
python main.py
```

#### Database Logs
```bash
# Check database logs
pnpm supabase logs db
```

### Reset Everything

If you encounter persistent issues:

```bash
# Stop all services
pnpm supabase stop

# Remove Docker containers
docker system prune -a

# Restart everything
pnpm supabase start
pnpm supabase db reset
```

---

## 🌐 Production Deployment

### Using Docker

1. **Build the Docker image**:
```bash
docker build -t hiresense .
```

2. **Run with environment variables**:
```bash
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=your_key \
  -e GROQ_API_KEY=your_key \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  hiresense
```

### Manual Production Setup

1. **Set up production Supabase project**
2. **Configure production environment variables**
3. **Build the frontend**:
```bash
cd frontend
pnpm build
pnpm start
```

4. **Deploy backend** using your preferred hosting service

### Environment Variables for Production

Ensure all production environment variables are set:

```env
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# ... other production values
```

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 🤝 Support

If you encounter any issues during installation:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the logs for specific error messages
3. Ensure all prerequisites are installed
4. Verify all environment variables are correctly set

For additional help, please open an issue on the GitHub repository.

---

<div align="center">
  <b>HireSense — Replacing uncertainty with undeniable proof.</b>
</div>
