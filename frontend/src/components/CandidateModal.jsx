import { useEffect, useState } from "react";
import CandidateInterviewKit from "./CandidateInterviewKit.jsx";

export default function CandidateModal({
  candidate,
  onClose,
  onCandidateUpdated,
}) {
  const [isBlindMode, setIsBlindMode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!candidate) return null;

  const candidateSuffix = String(candidate._id || "")
    .slice(-4)
    .toUpperCase();
  const displayName = isBlindMode
    ? `Candidate #${candidateSuffix || "UNKNOWN"}`
    : candidate.name;
  const displayEmail = isBlindMode
    ? "••••••••••••"
    : candidate.email || "No email provided";

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Candidate profile"
        onClick={(event) => event.stopPropagation()}
        className="bg-white rounded-2xl max-w-2xl w-full p-7 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-slate-100"
      >
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Candidate Profile
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
              {displayName}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{displayEmail}</p>
            <label className="mt-3 inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isBlindMode}
                onChange={(event) => setIsBlindMode(event.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium">Blind Screening Mode</span>
            </label>
          </div>
          <span
            className={`px-3.5 py-1.5 rounded-full text-sm font-extrabold ${
              candidate.matchScore >= 75
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : candidate.matchScore >= 50
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            Score: {candidate.matchScore}/100
          </span>
        </div>

        <div className="space-y-4 text-sm text-slate-600">
          <div>
            <h4 className="font-semibold text-slate-900 mb-1.5 text-xs uppercase tracking-wider">
              Professional Summary
            </h4>
            <p className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-slate-700 text-xs leading-relaxed">
              {candidate.parsedData?.summary || "No summary available."}
            </p>
          </div>

          {candidate.failedMustHaves?.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                Must-have criteria need review
              </h4>
              <p className="mt-1 text-xs text-amber-800">
                These are AI-generated flags, not a final hiring decision.
                Review the resume evidence before changing the candidate’s
                stage.
              </p>
              <ul className="mt-2 space-y-2">
                {candidate.failedMustHaves.map((item, index) => (
                  <li
                    key={`${item.requirement}-${index}`}
                    className="text-xs text-amber-950"
                  >
                    <span className="font-semibold">{item.requirement}:</span>{" "}
                    {item.evidence || "No supporting evidence provided."}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-slate-900 mb-1.5 text-xs uppercase tracking-wider">
              Extracted Skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {candidate.parsedData?.skills?.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-indigo-50/70 text-indigo-700 border border-indigo-100/80 rounded-lg text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-1.5 text-xs uppercase tracking-wider">
              AI Feedback & Analysis
            </h4>
            <div className="bg-emerald-50/40 border border-emerald-100/80 p-4 rounded-xl text-emerald-950 text-xs leading-relaxed whitespace-pre-line">
              {candidate.aiFeedback}
            </div>
          </div>

          <CandidateInterviewKit
            key={candidate._id}
            candidateId={candidate._id}
            existingQuestions={candidate.interviewQuestions || []}
            onQuestionsGenerated={onCandidateUpdated}
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl font-medium text-xs transition shadow-sm cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
