import { useCallback, useEffect, useRef, useState } from "react";
import Hero from "./components/Hero.jsx";
import JobForm from "./components/JobForm.jsx";
import ResumeUploader from "./components/ResumeUploader.jsx";
import CandidateLeaderboard from "./components/CandidateLeaderboard.jsx";
import CandidateModal from "./components/CandidateModal.jsx";
import CandidateAnalytics from "./components/CandidateAnalytics.jsx";
import JobPicker from "./components/JobPicker.jsx";
import RecruiterLogin from "./components/RecruiterLogin.jsx";
import {
  API_BASE_URL,
  apiFetch,
  clearAuthToken,
  getAuthToken,
  readJson,
} from "./lib/config.js";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(getAuthToken()),
  );
  const [jobs, setJobs] = useState([]);
  const [jobsError, setJobsError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState(null);
  const latestRequest = useRef(0);

  const clearSessionData = useCallback(() => {
    latestRequest.current += 1;
    setIsAuthenticated(false);
    setJobs([]);
    setSelectedJob(null);
    setCandidates([]);
    setSelectedCandidateId(null);
  }, []);

  const fetchCandidates = useCallback(async (jobId) => {
    if (!jobId) return;
    const requestId = ++latestRequest.current;
    setLoading(true);
    setCandidatesError(null);
    try {
      const response = await apiFetch(
        `${API_BASE_URL}/api/ats/candidates/${jobId}`,
      );
      const data = await readJson(response);
      if (requestId !== latestRequest.current) return;
      if (!response.ok)
        throw new Error(data.error || "Failed to load candidates.");
      setCandidates(Array.isArray(data) ? data : []);
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      console.error("Error fetching candidates:", err);
      setCandidatesError(err.message || "Failed to load candidates.");
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const response = await apiFetch(`${API_BASE_URL}/api/ats/jobs`);
        const data = await readJson(response);
        if (!response.ok) throw new Error(data.error || "Failed to load jobs.");
        if (!cancelled) setJobs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        if (!cancelled) setJobsError("Could not load existing jobs.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const handleUnauthorized = clearSessionData;
    window.addEventListener("ats:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("ats:unauthorized", handleUnauthorized);
  }, [clearSessionData]);

  const handleSignOut = () => {
    clearAuthToken();
    clearSessionData();
  };

  if (!isAuthenticated) {
    return <RecruiterLogin onSignedIn={() => setIsAuthenticated(true)} />;
  }

  const handleSelectJob = (job) => {
    latestRequest.current += 1;
    setSelectedJob(job);
    setCandidates([]);
    setSelectedCandidateId(null);
    if (job) fetchCandidates(job._id);
  };

  const handleJobCreated = (job) => {
    setJobs((previous) => [job, ...previous]);
    handleSelectJob(job);
  };

  const handleRefresh = () => {
    if (selectedJob?._id) fetchCandidates(selectedJob._id);
  };

  const selectedCandidate =
    candidates.find((item) => item._id === selectedCandidateId) || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <Hero />

      <main className="max-w-4xl mx-auto px-6 space-y-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Sign out
          </button>
        </div>
        <JobPicker
          jobs={jobs}
          selectedJob={selectedJob}
          onSelect={handleSelectJob}
          error={jobsError}
        />
        <JobForm onJobCreated={handleJobCreated} activeJob={selectedJob} />

        {selectedJob && (
          <div className="space-y-6">
            <ResumeUploader
              activeJob={selectedJob}
              onUploadSuccess={handleRefresh}
            />

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h2 className="text-xl font-semibold text-indigo-600 mb-2">
                Active Pipeline: {selectedJob.title}
              </h2>
              <p className="mb-4 text-xs font-medium text-indigo-600">
                Dashboard analytics and candidate actions are shown below.
              </p>
              <p className="text-slate-600 text-sm mb-6">
                {selectedJob.description}
              </p>

              {candidatesError && (
                <p
                  role="alert"
                  className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700"
                >
                  {candidatesError}{" "}
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="font-semibold underline"
                  >
                    Retry
                  </button>
                </p>
              )}

              <CandidateAnalytics candidates={candidates} />

              <CandidateLeaderboard
                candidates={candidates}
                loading={loading}
                onSelectCandidate={(candidate) =>
                  setSelectedCandidateId(candidate._id)
                }
                onRefresh={handleRefresh}
              />
            </div>
          </div>
        )}

        {/* Candidate Detail Modal */}
        {selectedCandidate && (
          <CandidateModal
            candidate={selectedCandidate}
            onClose={() => setSelectedCandidateId(null)}
            onCandidateUpdated={handleRefresh}
          />
        )}
      </main>
    </div>
  );
}
