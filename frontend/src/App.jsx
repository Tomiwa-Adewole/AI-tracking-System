import { useEffect, useState } from "react";
import Hero from "./components/Hero";
import JobForm from "./components/jobForm.jsx";
import ResumeUploader from "./components/ResumeUploader";
import CandidateLeaderboard from "./components/CandidateLeaderBoard.jsx";
import CandidateModal from "./components/CandidateModal";

export default function AtsDashboard() {
  const [activeJob, setActiveJob] = useState(() => {
    const saved = localStorage.getItem("ats_active_job");
    return saved ? JSON.parse(saved) : null;
  });

  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const fetchCandidates = async (jobId) => {
    if (!jobId) return;
    setLoadingCandidates(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/ats/candidates/${jobId}`,
      );
      const data = await response.json();
      if (response.ok) {
        setCandidates(data);
      }
    } catch (err) {
      console.error("Error fetching candidates:", err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleJobChange = (nextJob) => {
    setActiveJob(nextJob);

    if (nextJob) {
      localStorage.setItem("ats_active_job", JSON.stringify(nextJob));
      fetchCandidates(nextJob._id);
    } else {
      localStorage.removeItem("ats_active_job");
      setCandidates([]);
    }
  };

  useEffect(() => {
    if (activeJob) {
      localStorage.setItem("ats_active_job", JSON.stringify(activeJob));
    } else {
      localStorage.removeItem("ats_active_job");
    }
  }, [activeJob]);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-700 antialiased pb-16">
      <Hero />

      <div className="max-w-4xl mx-auto px-6 mt-8 space-y-8">
        <JobForm activeJob={activeJob} setActiveJob={handleJobChange} />

        {activeJob && (
          <ResumeUploader
            activeJob={activeJob}
            onUploadSuccess={() => fetchCandidates(activeJob._id)}
          />
        )}

        {activeJob && (
          <CandidateLeaderboard
            candidates={candidates}
            loading={loadingCandidates}
            onRefresh={() => fetchCandidates(activeJob._id)}
            onSelectCandidate={setSelectedCandidate}
          />
        )}
      </div>

      {selectedCandidate && (
        <CandidateModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
}
