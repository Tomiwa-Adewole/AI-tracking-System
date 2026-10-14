import { useState } from "react";

export default function CandidateLeaderboard({
  candidates,
  onSelectCandidate,
  onRefresh,
  apiBaseUrl,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const API_BASE_URL =
    apiBaseUrl ||
    import.meta.env.VITE_API_BASE_URL ||
    "https://ai-tracking-system.onrender.com";

  const handleStatusChange = async (candidateId, newStatus, e) => {
    e.stopPropagation(); // Prevent opening the candidate modal
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ats/candidates/${candidateId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      if (response.ok && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Filter candidates based on search input and status dropdown
  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (candidate.email &&
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "All" || candidate.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!candidates || candidates.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
        <p className="text-slate-500">
          No candidates uploaded for this job opening yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header & Search/Filter Toolbar */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            Candidate Leaderboard
          </h3>
          <p className="text-xs text-slate-500">
            Showing {filteredCandidates.length} of {candidates.length}{" "}
            candidates
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 transition w-full sm:w-56 bg-slate-50/50"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 transition bg-slate-50/50 text-slate-700 cursor-pointer"
          >
            <option value="All">All Stages</option>
            <option value="Applied">Applied</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Hired">Hired</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Candidate List */}
      <div className="divide-y divide-slate-100">
        {filteredCandidates.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No candidates match your search or filter criteria.
          </div>
        ) : (
          filteredCandidates.map((candidate, index) => (
            <div
              key={candidate._id}
              onClick={() => onSelectCandidate(candidate)}
              className="p-4 sm:p-6 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm shrink-0">
                  #{index + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">
                    {candidate.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {candidate.email || "No email provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-center">
                {/* Pipeline Status Selector */}
                <select
                  value={candidate.status || "Applied"}
                  onChange={(e) =>
                    handleStatusChange(candidate._id, e.target.value, e)
                  }
                  onClick={(e) => e.stopPropagation()}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer transition ${
                    candidate.status === "Hired"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : candidate.status === "Rejected"
                        ? "bg-rose-50 border-rose-200 text-rose-700"
                        : candidate.status === "Interviewing"
                          ? "bg-amber-50 border-amber-200 text-amber-700"
                          : candidate.status === "Shortlisted"
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                            : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  <option value="Applied">Applied</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="Hired">Hired</option>
                  <option value="Rejected">Rejected</option>
                </select>

                {/* Match Score Badge */}
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    candidate.matchScore >= 75
                      ? "bg-emerald-100 text-emerald-700"
                      : candidate.matchScore >= 50
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {candidate.matchScore}% Match
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
