# AI ATS System

A full-stack Applicant Tracking System powered by AI for resume parsing, candidate scoring, and recruitment workflow management.

## Overview

This project combines:

- A Node.js + Express backend for ATS APIs and MongoDB integration
- A React + Vite frontend dashboard for jobs and candidates
- AI-powered resume analysis using Google Gemini
- PDF resume parsing and score-based candidate ranking

## Project Structure

```text
ai-ats-system/
├── backend/
│   ├── .env
│   ├── model/
│   ├── routes/
│   ├── uploads/
│   ├── package.json
│   ├── server.js
│   └── ...
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── ...
├── README.md
└── .gitignore
```

## Features

- Create and manage job postings
- Upload candidate resumes in PDF format
- Extract candidate text from PDFs
- Analyze resume against job requirements using AI
- Score candidates with fit score and feedback
- View candidate leaderboard by best match
- Save analysis results into MongoDB

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose
- Multer
- PDF parsing
- Google GenAI (Gemini)

## Prerequisites

Before running the app, make sure you have:

- Node.js installed
- MongoDB Atlas account or local MongoDB instance
- Google Gemini API key

## Environment Setup

### Backend

Create a `.env` file inside the `backend` folder with the following:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?appName=Cluster0
GEMINI_API_KEY=your_google_gemini_api_key
```

Important:

- Replace the username and password with your MongoDB Atlas database user credentials.
- Keep this file private and do not commit it to version control.

## Run the Project

### 1. Start the backend

```bash
cd backend
npm install
npm start
```

### 2. Start the frontend

Open a second terminal and run:

```bash
cd frontend
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## API Endpoints

### Jobs

- `POST /api/ats/create-job` — create a new job listing
- `GET /api/ats/jobs` — fetch all jobs

### Candidates

- `POST /api/ats/upload-resume/:jobId` — upload a resume and analyze it
- `GET /api/ats/candidates/:jobId` — fetch ranked candidates for a job

## Notes

- This app is intended for local development and testing.
- Add your own validation and security rules before deploying to production.
- Use a proper `.gitignore` to avoid committing secrets and installed packages.

## License

This project is for educational and personal project use.
