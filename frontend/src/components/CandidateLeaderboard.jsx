import { useState } from "react";

const VALID_STATUSES = [
  "Applied",
  "Shortlisted",
  "Interviewing",
  "Hired",
  "Rejected",
  "Disqualified",
];

function CandidateRow({
  candidate,
  index,
  onSelectCandidate,
  onStatusChange,
  onSendStatusEmail,
}) {
  const [isBlindMode, setIsBlindMode] = useState(false);
  const [emailingStatus, setEmailingStatus] = useState("");
  const [statusNotice, setStatusNotice] = useState(null);
  const [emailNotice, setEmailNotice] = useState(null);
  const candidateSuffix = String(candidate._id || "")
    .slice(-4)
    .toUpperCase();
  const displayName = isBlindMode
    ? `Candidate #${candidateSuffix || index + 1}`
    : candidate.name;
  const displayEmail = isBlindMode
    ? "••••••••••••"
    : candidate.email || "No email provided";

  return (
    <div
      onClick={() => onSelectCandidate(candidate)}
      className="p-4 sm:p-6 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm shrink-0">
          #{index + 1}
        </div>
        <div>
          <h4 className="font-semibold text-slate-800">{displayName}</h4>
          <p className="text-xs text-slate-500">{displayEmail}</p>
          <label
            className="mt-2 inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer"
            onClick={(event) => event.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isBlindMode}
              onChange={(event) => setIsBlindMode(event.target.checked)}
              onClick={(event) => event.stopPropagation()}
              className="rounded text-indigo-600 focus:ring-indigo-500"
              aria-label={`Blind screening mode for ${candidate.name || "candidate"}`}
            />
            <span className="font-medium">Blind Screening Mode</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4 self-end sm:self-center">
        {candidate.status === "Shortlisted" ||
        candidate.status === "Rejected" ? (
          <button
            type="button"
            onClick={async (event) => {
              event.stopPropagation();
              setEmailingStatus(candidate.status);
              setEmailNotice(null);
              const customNote =
                candidate.status === "Rejected"
                  ? window.prompt(
                      "Optional feedback to include in the email:",
                    ) || ""
                  : "";
              const result = await onSendStatusEmail(
                candidate._id,
                candidate.status,
                customNote,
              );
              setEmailNotice(result);
              setEmailingStatus("");
            }}
            disabled={emailingStatus !== "" || !candidate.email}
            title={
              !candidate.email ? "Candidate has no email address" : undefined
            }
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {emailingStatus
              ? "Sending email..."
              : `Email ${candidate.status === "Rejected" ? "rejection" : "shortlist"}`}
          </button>
        ) : null}

        <select
          value={candidate.status || "Applied"}
          onChange={async (event) => {
            const nextStatus = event.target.value;
            setStatusNotice(null);
            const result = await onStatusChange(
              candidate._id,
              nextStatus,
              event,
            );
            setStatusNotice(result);
          }}
          onClick={(event) => event.stopPropagation()}
          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer transition ${
            candidate.status === "Disqualified"
              ? "bg-red-100 border-red-300 text-red-800"
              : candidate.status === "Hired"
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
          {VALID_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

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
      {statusNotice && (
        <p
          role={statusNotice.error ? "alert" : "status"}
          className={`basis-full text-right text-xs ${
            statusNotice.error ? "text-rose-600" : "text-emerald-700"
          }`}
        >
          {statusNotice.error || statusNotice.message}
        </p>
      )}
      {emailNotice && (
        <p
          role={emailNotice.error ? "alert" : "status"}
          className={`basis-full text-right text-xs ${
            emailNotice.error ? "text-rose-600" : "text-emerald-700"
          }`}
        >
          {emailNotice.error || emailNotice.message}
        </p>
      )}
    </div>
  );
}

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
    const sendsEmail = ["Shortlisted", "Rejected"].includes(newStatus);
    const customNote =
      newStatus === "Rejected"
        ? window.prompt("Optional feedback to include in the email:") || ""
        : "";
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ats/candidates/${candidateId}${
          sendsEmail ? "/send-status-email" : "/status"
        }`,
        {
          method: sendsEmail ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, customNote }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update candidate status.");
      }
      if (onRefresh) onRefresh();
      return {
        message: sendsEmail
          ? `Status updated and email sent to ${data.candidate?.email || "candidate"}.`
          : "Candidate status updated.",
      };
    } catch (err) {
      console.error("Failed to update status:", err);
      return { error: err.message || "Failed to update candidate status." };
    }
  };

  const handleSendStatusEmail = async (
    candidateId,
    status,
    customNote = "",
  ) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ats/candidates/${candidateId}/send-status-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, customNote }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to send status email.");
      }
      if (onRefresh) onRefresh();
      return { message: result.message || "Status email sent successfully." };
    } catch (err) {
      return { error: err.message || "Failed to send status email." };
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
          <p className="mt-1 text-xs font-medium text-indigo-600">
            Use the checkbox on a candidate to turn on blind screening. For
            Shortlisted or Rejected candidates, use the email button to notify
            them.
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
            <option value="Disqualified">Disqualified</option>
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
            <CandidateRow
              key={candidate._id}
              candidate={candidate}
              index={index}
              onSelectCandidate={onSelectCandidate}
              onStatusChange={handleStatusChange}
              onSendStatusEmail={handleSendStatusEmail}
            />
          ))
        )}
      </div>
    </div>
  );
}
