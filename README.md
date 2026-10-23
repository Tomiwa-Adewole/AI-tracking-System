# AI Tracking System — AI Applicant Tracking System

An applicant-tracking dashboard that helps a recruiter organize job openings, review resume-based candidate assessments, and manage candidates through a hiring pipeline. The React frontend works with an Express/MongoDB backend; Google Gemini assists with extracting structured resume details and preparing interview questions.

> **Human review is essential.** AI-generated summaries, skill assessments, and must-have evaluations can be incomplete or incorrect. Use this tool to support—not replace—recruiter judgment.

## What the application does

1. **Define a role.** A recruiter creates a job with a description, must-have criteria, and either weighted skills or required skills.
2. **Add a resume.** A PDF is uploaded against the selected role. The backend checks the file type, size, and PDF signature, then extracts its text.
3. **Assess the candidate.** Gemini returns structured candidate details, skill assessments, must-have evidence, a summary, and recruiter feedback.
4. **Calculate a match score.** The backend—not the AI—calculates a 0–100 score from the returned skill assessments and the job's scoring criteria.
5. **Review and advance.** The dashboard displays ranked candidates, searchable by name/email and filterable by pipeline stage. Recruiters can update stages, request interview questions, and send optional status emails.

## Candidate scoring logic

The score is based only on the job's configured skills:

- If the job has **weighted skills**, each confirmed skill contributes its configured weight. The score is matched weight divided by total weight, expressed as a percentage.
- Otherwise, **required skills** are counted equally. The score is matched skills divided by the total required skills.
- Skill names are normalized for case and punctuation differences, so common variants such as `Node.js` and `nodejs` can match. Language distinctions such as `C`, `C++`, and `C#` are retained.
- Job creation requires at least one weighted or required skill so candidates are not assigned a meaningless default score.

Must-have criteria are evaluated separately from the match score. Unmet or missing AI assessments are recorded as review flags with evidence where available. Newly analyzed candidates remain `Applied`; the system does not automatically disqualify them. A recruiter should review the resume and flags before changing a candidate's stage.

## Main features

- Job creation with weighted skills (1–5), required skills, and must-have criteria.
- PDF resume upload with a 10 MB limit, PDF signature verification, readable-text checks, and cleanup of temporary files after processing.
- Structured Gemini resume analysis and role-specific interview-question generation.
- Candidate leaderboard, match-score analytics, search, stage filters, and candidate detail modal.
- Job picker that loads saved roles and their candidates after a browser refresh.
- Separate pipeline status updates and optional shortlist/rejection email actions, with a confirmation before sending.
- Single-recruiter sign-in; protected ATS routes require a signed, expiring bearer token.
- Input and ID validation, normalized deterministic scoring, bounded resume text in prompts, generic client-facing AI errors, and per-process rate limiting for AI endpoints.

## Project structure

```text
ai-ats-system/
├── backend/
│   ├── middleware/       # AI endpoint rate limiting
│   ├── models/           # Job and Candidate Mongoose schemas
│   ├── routes/           # ATS API and Gemini workflows
│   ├── test/             # Backend unit tests
│   ├── uploads/          # Temporary resume uploads (private data)
│   ├── utils/            # Scoring, validation, and email helpers
│   ├── .env.example
│   └── server.js
├── frontend/
│   ├── src/components/   # Job, upload, analytics, and candidate UI
│   ├── src/lib/           # Shared API URL and status configuration
│   └── .env.example
├── .gitignore
└── README.md
```

## Technology

- **Frontend:** React, Vite, Tailwind CSS, Recharts
- **Backend:** Node.js, Express, Mongoose, Multer, pdf-parse
- **AI:** Google GenAI SDK (Gemini)
- **Database:** MongoDB

## Requirements

- Node.js `22.12.0` or newer and npm
- MongoDB local instance or MongoDB Atlas database
- Google Gemini API key

## Configuration

Copy `backend/.env.example` to `backend/.env` and provide the required values:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/<database>
GEMINI_API_KEY=your_google_gemini_api_key
RECRUITER_EMAIL=recruiter@example.com
RECRUITER_PASSWORD=replace-with-a-long-unique-password
ATS_AUTH_SECRET=replace-with-a-random-secret-of-at-least-32-characters
```

The recruiter credentials protect ATS data and actions. Choose a unique password and generate a random `ATS_AUTH_SECRET` of at least 32 characters. Sign-in tokens expire after eight hours. Use HTTPS anywhere outside local development.

Required authentication settings: `RECRUITER_EMAIL`, `RECRUITER_PASSWORD`, and `ATS_AUTH_SECRET`. Configure these only in the backend environment; `ATS_AUTH_SECRET` must contain at least 32 characters. Never expose them through frontend variables.

Optional backend variables:

| Variable                   | Purpose                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `GEMINI_MODEL`             | Override the Gemini model selected by the backend.                                                                          |
| `CORS_ORIGIN`              | Comma-separated frontend origin allow-list. Configure for deployment; when unset, CORS is permissive for local development. |
| `EMAIL_USER`, `EMAIL_PASS` | Gmail credentials for optional status emails. Use an app password if required by your account.                              |

For a different frontend API location, copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL`. Local development defaults to `http://localhost:5000`.

Never commit real `.env` files, API keys, database credentials, or candidate resumes.

## Run locally

Start the backend in one terminal:

```bash
cd backend
npm install
npm run dev
```

Start the frontend in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local Vite URL printed by the frontend. The backend defaults to port `5000` and connects to MongoDB before it begins listening.

## API reference

All routes below are prefixed with `/api/ats`.

| Method  | Endpoint                             | Purpose                                                                      |
| ------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| `GET`   | `/jobs`                              | List saved job openings, newest first.                                       |
| `POST`  | `/auth/login`                        | Sign in with recruiter email and password; returns an expiring bearer token. |
| `POST`  | `/create-job`                        | Create a job; requires a title, description, and at least one scoring skill. |
| `GET`   | `/candidates/:jobId`                 | List candidates for a job, sorted by match score.                            |
| `POST`  | `/upload-resume/:jobId`              | Upload and analyze a PDF resume for a job.                                   |
| `PATCH` | `/candidates/:id/status`             | Update a candidate's pipeline stage; does not send email.                    |
| `POST`  | `/candidates/:id/send-status-email`  | Email a candidate whose current stage is `Shortlisted` or `Rejected`.        |
| `POST`  | `/candidates/:id/generate-questions` | Generate and save tailored interview questions.                              |

All endpoints except `/auth/login` require `Authorization: Bearer <token>`. Pipeline stages: `Applied`, `Shortlisted`, `Interviewing`, `Hired`, `Rejected`, `Disqualified`.

## Quality checks

Run backend unit tests:

```bash
cd backend
npm test
```

Build and lint the frontend:

```bash
cd frontend
npm run build
npm run lint
```

These checks do not exercise live MongoDB, Gemini, or Gmail/email delivery. Test those integrations using development credentials before relying on them.

## Important limitations and next steps

- **Authentication is a single recruiter account configured with environment variables.** There is no account-management flow, multi-user/role support, or token revocation before expiry. Use a strong unique password and secret, HTTPS, and a proper identity provider/access-control design for production.
- **CORS is permissive when `CORS_ORIGIN` is unset.** Configure the frontend origin allow-list in deployed environments; CORS is not authentication.
- **Blind Screening Mode is a frontend display feature only.** The API still returns candidate identity, and AI summaries may include identifying details.
- **Must-have assessment can be wrong or incomplete.** The app flags missing/unmet assessments and leaves candidates in `Applied`, but recruiter review is still required before decisions.
- **Duplicate detection and pagination are not implemented.** Re-uploading the same resume can create another candidate, and lists are currently unpaginated.
- **Rate limiting is in-memory and per server process.** Multi-instance deployments need a shared rate-limit store.
- **Resume files and candidate profiles are sensitive personal data.** Uploads are temporary and ignored by Git, but ignore rules cannot remove files already committed in repository history. If resumes or credentials were committed, remove them from history and rotate exposed credentials.
- **Email configuration is optional and not verified against a live mail account.** Confirm delivery behavior with a test account before enabling it for candidates.
- **Candidate email is stored only when an address is found in extracted resume text.** Gemini-provided email values are not used as fallback recipients.

## License

See [LICENSE](LICENSE).
