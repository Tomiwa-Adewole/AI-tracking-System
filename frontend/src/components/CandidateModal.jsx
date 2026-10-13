export default function CandidateModal({ candidate, onClose }) {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-7 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Candidate Profile
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
              {candidate.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {candidate.email || "No email provided"}
            </p>
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
