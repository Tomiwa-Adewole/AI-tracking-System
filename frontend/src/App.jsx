import { useState } from "react";
import Hero from "./components/Hero.jsx";
import JobForm from "./components/JobForm.jsx";
import ResumeUploader from "./components/ResumeUploader.jsx";
import CandidateLeaderboard from "./components/CandidateLeaderboard.jsx";
import CandidateModal from "./components/CandidateModal.jsx";
import CandidateAnalytics from "./components/CandidateAnalytics.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://ai-tracking-system.onrender.com";

export default function App() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCandidates = async (jobId) => {
    if (!jobId) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/ats/candidates/${jobId}`,
      );
      const data = await response.json();
      setCandidates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJobCreated = (job) => {
    setSelectedJob(job);
    const jobId = job?._id || job?.id;
    if (jobId) {
      fetchCandidates(jobId);
    }
  };

  const handleRefresh = () => {
    const jobId = selectedJob?._id || selectedJob?.id;
    if (jobId) {
      fetchCandidates(jobId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Light Theme Hero Header */}
      <Hero />

      <main className="max-w-4xl mx-auto px-6 space-y-6">
        <JobForm
          onJobCreated={handleJobCreated}
          activeJob={selectedJob}
          setActiveJob={setSelectedJob}
          apiBaseUrl={API_BASE_URL}
        />

        {selectedJob && (
          <div className="space-y-6">
            <ResumeUploader
              activeJob={selectedJob}
              onUploadSuccess={handleRefresh}
              apiBaseUrl={API_BASE_URL}
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

              <CandidateAnalytics candidates={candidates} />

              <CandidateLeaderboard
                candidates={candidates}
                loading={loading}
                onSelectCandidate={setSelectedCandidate}
                onRefresh={handleRefresh}
                apiBaseUrl={API_BASE_URL}
              />
            </div>
          </div>
        )}

        {/* Candidate Detail Modal */}
        {selectedCandidate && (
          <CandidateModal
            candidate={selectedCandidate}
            onClose={() => setSelectedCandidate(null)}
            apiBaseUrl={API_BASE_URL}
          />
        )}
      </main>
    </div>
  );
}
