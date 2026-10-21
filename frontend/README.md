# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# AI-Powered Applicant Tracking System (ATS)

An enterprise-ready, full-stack Applicant Tracking System (ATS) built with the MERN stack and powered by Google Gemini AI. The application enables recruiters to manage multi-job openings, automatically evaluate and rank candidate PDF resumes against job requirements, track applicants through recruitment pipeline stages, and perform instant candidate filtering.

---

## Key Features

- **Multi-Job Openings Management:** Dynamically switch between active job roles to view tailored candidate submissions.
- **AI Resume Analysis & Parsing:** Extracts candidate name, email, skills, and a concise summary from PDF resumes.
- **Automated Match Scoring:** Ranks candidates with a 0–100% score based on job description fit and required skill matching.
- **Resilient AI Pipeline:** Features integrated exponential backoff and retry handling for 503 high-demand Gemini API responses.
- **Recruitment Pipeline Stages:** Transition candidate statuses seamlessly across `Applied`, `Shortlisted`, `Interviewing`, `Hired`, and `Rejected`.
- **Candidate Search & Filter Toolbar:** Perform client-side searches by name or email, and filter candidates by pipeline stage.
- **Candidate Detail Modal:** Drill down into AI recruiter feedback and full skill breakdowns with an interactive pop-up.

---

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js, Multer, `pdf-parse`
- **Database:** MongoDB Atlas, Mongoose
- **AI Engine:** Google GenAI SDK (`gemini-3.5-flash-lite`)

---

## System Flow & Data Architecture

```text
[ Recruiter UI ]
       │
       ├─► 1. Selects Job Opening / Uploads Candidate PDF Resume
       │
[ Express Backend ]
       │
       ├─► 2. Multer parses upload & pdf-parse extracts raw text
       ├─► 3. Formats prompt with Job Description & Resume text
       │
[ Google Gemini AI (gemini-3.5-flash-lite) ]
       │
       ├─► 4. Evaluates fit, scores match (0-100), & generates structured JSON
       │      (Includes automatic backoff retry logic if 503 error occurs)
       │
[ MongoDB Atlas Database ]
       │
       ├─► 5. Saves parsed candidate profile linked to Job ID
       │
[ Recruiter Dashboard ]
       └─► 6. Renders ranked candidate leaderboard, filters, & status pipeline
```
