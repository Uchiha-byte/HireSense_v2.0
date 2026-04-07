# HireSense API Endpoints Documentation

This document provides a comprehensive overview of all API endpoints in the HireSense application, covering both backend and frontend services.

---

## Table of Contents

- [Backend API (Python FastAPI)](#backend-api-python-fastapi)
  - [Interview Endpoints](#interview-endpoints)
  - [Health Check](#health-check)
- [Frontend API (Next.js)](#frontend-api-nextjs)
  - [Ashby ATS Integration](#ashby-ats-integration)
  - [Profile Processing](#profile-processing)
  - [AI Analysis](#ai-analysis)
  - [Reference Management](#reference-management)
  - [Transcript Services](#transcript-services)
  - [LeetCode Analysis](#leetcode-analysis)
  - [Waitlist Management](#waitlist-management)
- [External Services](#external-services)
  - [Judge0 (Code Execution)](#judge0-code-execution)

---

## Backend API (Python FastAPI)

**Base URL:** `http://localhost:8000` (Development)  
**Server:** FastAPI with Uvicorn  
**Port:** 8000

### Interview Endpoints

#### **GET /** - Serve Interview Interface
Serves the static HTML interview interface.

**Response:**
- **200 OK**: Returns `index.html` file
- **404 Not Found**: If index.html doesn't exist

---

#### **POST /start_test** - Start New Interview
Initiates a new AI interview session for the latest applicant.

**Request Body:** None

**Response:**
```json
{
  "test_id": "uuid-string",
  "question": "Initial greeting and question",
  "audio_path": "/audio/initial_question.mp3",
  "applicant_name": "John Doe",
  "response_timeout": 8
}
```

**Status Codes:**
- **200 OK**: Interview started successfully
- **404 Not Found**: No applicant found with AI data
- **500 Internal Server Error**: Processing error

**Notes:**
- Fetches the latest applicant from database with `ai_data`
- Generates personalized greeting based on applicant profile
- Uses random voice for text-to-speech
- Default response timeout: 8 seconds

---

#### **POST /interview/{test_id}** - Process Interview Step
Processes user audio response and generates next question.

**Path Parameters:**
- `test_id` (string): Unique interview session ID

**Request Body:** 
- Binary audio data (WebM/audio format)

**Response:**
```json
{
  "text": "Next question text",
  "audio_path": "/audio/question_2.mp3",
  "ended": false,
  "question_number": 2,
  "user_transcript": "User's transcribed response",
  "response_timeout": 8
}
```

**Status Codes:**
- **200 OK**: Step processed successfully
- **404 Not Found**: Invalid test_id
- **500 Internal Server Error**: Processing error

**Features:**
- Transcribes audio using Whisper API (via Groq)
- Handles timeout scenarios (no audio or empty response)
- Generates contextual follow-up questions using GPT
- Automatically ends interview after ~6 questions
- Saves evaluation summary to database on completion

---

#### **GET /summary/{test_id}** - Get Interview Summary
Retrieves AI-generated evaluation for completed interview.

**Path Parameters:**
- `test_id` (string): Interview session ID

**Response:**
```json
{
  "summary": "Detailed evaluation text...",
  "conversation_log": [
    {"role": "assistant", "content": "Question 1"},
    {"role": "user", "content": "Answer 1"}
  ],
  "question_count": 6
}
```

**Status Codes:**
- **200 OK**: Summary generated
- **404 Not Found**: Invalid test_id
- **500 Internal Server Error**: Generation error

---

### Health Check

#### **GET /health** - API Health Status
Returns health status and active session count.

**Response:**
```json
{
  "status": "healthy",
  "active_tests": 3
}
```

**Status Code:** 200 OK

---

## Frontend API (Next.js)

**Base URL:** `http://localhost:3000/api` (Development)  
**Framework:** Next.js 15 with App Router  
**Runtime:** Node.js Edge/Serverless

### Ashby ATS Integration

#### **GET /api/ashby/candidates** - List Ashby Candidates
Fetches stored Ashby candidates from database.

**Authentication:** Required (Bearer token)  
**Authorization:** Requires ATS access

**Query Parameters:**
- `limit` (number, optional): Number of candidates to return
- `offset` (number, optional): Pagination offset

**Response:**
```json
{
  "candidates": [
    {
      "ashby_id": "string",
      "name": "string",
      "email": "string",
      "position": "string",
      "base_score": 75
    }
  ],
  "total": 100
}
```

**Rate Limit:** 60 requests per minute

---

#### **POST /api/ashby/candidates** - Force Refresh Candidates
Fetches latest candidates from Ashby API and syncs to database.

**Authentication:** Required  
**Authorization:** Requires ATS access

**Request Body:**
```json
{
  "force": true,
  "limit": 50
}
```

**Response:**
```json
{
  "success": true,
  "synced_count": 25,
  "updated_count": 5,
  "new_count": 20
}
```

**Rate Limit:** 10 requests per minute

---

#### **POST /api/ashby/files** - Download Ashby Resume
Downloads resume file from Ashby and stores in Supabase storage.

**Authentication:** Required  
**Request Body:**
```json
{
  "candidateId": "ashby-candidate-id",
  "fileHandle": {},
  "applicantId": "uuid",
  "mode": "shared_file"
}
```

---

#### **POST /api/ashby/push-note** - Push Note to Ashby
Sends a note/comment back to Ashby for a candidate.

**Authentication:** Required  
**Request Body:**
```json
{
  "candidateId": "ashby-id",
  "note": "Note text"
}
```

---

#### **POST /api/ashby/push-score** - Push Score to Ashby
Updates candidate score in Ashby ATS.

**Authentication:** Required  
**Request Body:**
```json
{
  "candidateId": "ashby-id",
  "score": 85
}
```

---

### Profile Processing

#### **POST /api/cv-process** - Process CV/Resume
Extracts structured data from uploaded PDF resume.

**Request Body:**
```json
{
  "applicant_id": "uuid",
  "file_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "applicant_id": "uuid",
  "cv_data": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "education": [],
    "experience": []
  }
}
```

**Processing:**
- Downloads PDF from Supabase storage
- Uses OpenAI GPT-4 Vision for extraction
- Updates `cv_status` to 'processing' → 'ready'
- Timeout: 60 seconds

---

#### **POST /api/linkedin-fetch** - Fetch LinkedIn Profile
Scrapes LinkedIn profile data using BrightData API.

**Request Body:**
```json
{
  "applicant_id": "uuid",
  "linkedin_url": "https://linkedin.com/in/username"
}
```

**Response:**
```json
{
  "success": true,
  "applicant_id": "uuid",
  "li_data": {
    "name": "John Doe",
    "headline": "Software Engineer",
    "experience": [],
    "education": []
  }
}
```

**Features:**
- Uses snapshot-based scraping (cached results)
- Polls job status up to 3 minutes
- Handles private profiles gracefully
- Falls back to dummy data if scraping disabled

---

#### **POST /api/github-fetch** - Fetch GitHub Profile
Analyzes GitHub profile and repositories.

**Request Body:**
```json
{
  "applicant_id": "uuid",
  "github_url": "https://github.com/username"
}
```

**Response:**
```json
{
  "success": true,
  "applicant_id": "uuid",
  "gh_data": {
    "username": "johndoe",
    "repositories": [],
    "stats": {},
    "organizations": []
  }
}
```

**Features:**
- Fetches up to 50 repositories
- Analyzes top 3 repos for code quality
- Includes organization memberships
- Requires GitHub token for API access

---

### AI Analysis

#### **POST /api/analysis** - Run AI Analysis
Performs comprehensive AI analysis on applicant data.

**Request Body:**
```json
{
  "applicant_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "applicant_id": "uuid",
  "ai_data": {
    "score": 85,
    "strengths": [],
    "concerns": [],
    "summary": "Detailed analysis..."
  },
  "score": 85
}
```

**Processing:**
- Combines CV, LinkedIn, and GitHub data
- Generates certainty score (0-100)
- Identifies inconsistencies and red flags
- Updates `ai_status` to 'processing' → 'ready'
- Handles errors gracefully with fallback scores

---

### Reference Management

#### **POST /api/reference-call** - Schedule Reference Call
Initiates reference verification call via ElevenLabs or sends meeting invite.

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "candidateName": "John Doe",
  "referenceName": "Jane Smith",
  "companyName": "Acme Corp",
  "roleTitle": "Senior Engineer",
  "workDuration": "2020-2023",
  "emailId": "jane@example.com",
  "meetingDate": "2024-01-15T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "id": "ref_12345",
  "emailSent": true,
  "message": "Reference saved and meeting invite sent"
}
```

**Features:**
- Sends email invite with Google Meet link (if email + date provided)
- Uses SMTP configuration for email delivery
- Validates email format
- Formats meeting dates properly

---

### Transcript Services

#### **GET /api/get-transcript** - Get ElevenLabs Transcript
Fetches conversation transcript from ElevenLabs API.

**Query Parameters:**
- `conversationId` (string, required): ElevenLabs conversation ID

**Response:**
```json
{
  "success": true,
  "conversation": {},
  "transcript": {
    "conversation_id": "string",
    "transcript": [
      {
        "speaker": "AI Agent",
        "timestamp": "00:15",
        "text": "Question text"
      }
    ]
  },
  "hasTranscript": true
}
```

**Status Codes:**
- **200 OK**: Transcript retrieved
- **404 Not Found**: Conversation not found
- **500 Internal Server Error**: API error

---

#### **POST /api/summarize-transcript** - Get Call Summary
Retrieves saved call summary from database.

**Request Body:**
```json
{
  "applicant_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "summary": "Detailed summary of reference calls...",
  "applicantId": "uuid",
  "retrievedAt": "2024-01-15T10:00:00Z"
}
```

**Status Codes:**
- **200 OK**: Summary retrieved
- **404 Not Found**: No summary available
- **500 Internal Server Error**: Database error

---

---

### LeetCode Analysis

#### **POST /api/leetcode-fetch** - Fetch LeetCode Stats
Analyzes LeetCode profile, solved problems, and contest ratings.

**Request Body:**
```json
{
  "applicant_id": "uuid",
  "leetcode_url": "https://leetcode.com/username"
}
```

**Response:**
```json
{
  "success": true,
  "applicant_id": "uuid",
  "lc_data": {
    "username": "johndoe",
    "totalSolved": 450,
    "ranking": 12000,
    "contestData": {
      "rating": 1850,
      "topPercentage": 5.2
    }
  }
}
```

**Features:**
- Uses local `leetcode-api` (port 3001) or public fallback
- Fetches solved counts by difficulty (Easy, Medium, Hard)
- Includes recent contest participation and global ranking
- Updates `lc_status` to 'processing' → 'ready'

---

### Waitlist Management

#### **POST /api/waitlist** - Join Waitlist
Adds user to Airtable waitlist.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "company": "Acme Corp",
  "employees": "50-200",
  "industry": "Technology"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Added to waitlist",
  "id": "airtable-record-id"
}
```

**Features:**
- Validates email format
- Checks for duplicates
- Updates existing entries if email exists
- Stores in Airtable via REST API

---

#### **GET /api/waitlist** - Check Waitlist Status
Checks if email is in waitlist.

**Query Parameters:**
- `email` (string): Email to check

**Response:**
```json
{
  "exists": true,
  "entry": {
    "email": "user@example.com",
    "status": "pending"
  }
}
```

---

## Common Response Patterns

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Optional details"
}
```

### Status Values

**Processing Status:**
- `pending`: Waiting to start
- `processing`: Currently processing
- `ready`: Completed successfully
- `error`: Failed with error
- `not_provided`: No data provided
- `skipped`: Intentionally skipped

**Overall Status:**
- `uploading`: Initial upload phase
- `processing`: Data collection phase
- `analyzing`: AI analysis phase
- `completed`: All processing complete
- `failed`: Processing failed

---

## Authentication & Authorization

### Middleware
All frontend API routes use `withApiMiddleware` which provides:
- **Authentication**: Validates Supabase JWT tokens
- **Rate Limiting**: Per-endpoint limits
- **CORS**: Cross-origin support
- **Logging**: Request/response logging
- **Error Handling**: Standardized error responses

### Required Headers
```
Authorization: Bearer {supabase_jwt_token}
Content-Type: application/json
```

---

## External Services

### Judge0 (Code Execution)

#### **POST /api/judge0** - Execute Code
Proxies code execution requests to local Judge0 instance.

**Request Body:**
```json
{
  "source_code": "print('Hello')",
  "language_id": 71,
  "stdin": ""
}
```

**Response:**
```json
{
  "stdout": "Hello\n",
  "time": "0.005",
  "memory": 128,
  "status": { "id": 3, "description": "Accepted" }
}
```

---

## Database Webhooks

The application uses PostgreSQL triggers and `pg_net` for automatic processing:

1. **CV Upload** → Triggers `/api/cv-process`
2. **LinkedIn URL** → Triggers `/api/linkedin-fetch`
3. **GitHub URL** → Triggers `/api/github-fetch`
4. **Data Ready** → Triggers `/api/analysis`

These webhooks are fire-and-forget and manage their own status updates.

---

## Rate Limits

| Endpoint | Requests | Window |
|----------|----------|--------|
| GET /api/ashby/candidates | 60 | 1 minute |
| POST /api/ashby/candidates | 10 | 1 minute |
| Other API routes | 100 | 1 minute |

---

## External Service Dependencies

- **OpenAI GPT-4**: CV analysis, AI interviews
- **Groq API**: Fast LLM inference, Whisper transcription
- **ElevenLabs**: Text-to-speech, conversational AI
- **BrightData**: LinkedIn scraping
- **GitHub API**: Profile and repository data
- **Ashby API**: ATS integration
- **Judge0**: Local code execution engine
- **Airtable API**: Waitlist management
- **Supabase**: Database, storage, auth

---

## Environment Variables

See `env.example` for complete list of required API keys and configuration.
