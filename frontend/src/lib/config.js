export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://ai-tracking-system.onrender.com");

export const STATUSES = [
  "Applied",
  "Shortlisted",
  "Interviewing",
  "Hired",
  "Rejected",
  "Disqualified",
];

export const MAX_RESUME_BYTES = 10 * 1024 * 1024;

const AUTH_TOKEN_KEY = "ats_recruiter_token";

export const getAuthToken = () => window.localStorage.getItem(AUTH_TOKEN_KEY);

export const saveAuthToken = (token) => {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
};

export async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    clearAuthToken();
    window.dispatchEvent(new Event("ats:unauthorized"));
  }
  return response;
}

export async function readJson(response) {
  const type = response.headers.get("content-type") || "";
  if (type.includes("application/json")) return response.json();
  return { error: `Unexpected server response (${response.status}).` };
}
