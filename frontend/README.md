# Frontend

React + Vite recruiter dashboard for the AI Applicant Tracking System. The frontend supports recruiter sign-in, job selection and creation, PDF resume upload, candidate analytics and search, pipeline updates, optional status emails, and AI-generated interview kits.

For project architecture, candidate scoring logic, backend configuration, API routes, security notes, and full setup instructions, see the [root project README](../README.md).

## Frontend development

Use Node.js `22.12.0` or newer. From this directory:

```bash
npm install
npm run dev
```

By default, local development calls the backend at `http://localhost:5000`. To use another backend, copy `.env.example` to `.env` and set `VITE_API_BASE_URL` before starting Vite.

## Checks

```bash
npm run build
npm run lint
```
