const PIPELINE_STATUSES = [
  "Applied",
  "Shortlisted",
  "Interviewing",
  "Hired",
  "Rejected",
  "Disqualified",
];

export default function CandidateAnalytics({ candidates = [] }) {
  const total = candidates.length;
  const averageScore = total
    ? Math.round(
        candidates.reduce(
          (sum, candidate) => sum + (Number(candidate.matchScore) || 0),
          0,
        ) / total,
      )
    : 0;
  const shortlisted = candidates.filter(
    (candidate) => candidate.status === "Shortlisted",
  ).length;
  const hardGatePassRate = total
    ? Math.round(
        (candidates.filter((candidate) => candidate.passedHardGates !== false)
          .length /
          total) *
          100,
      )
    : 0;

  return (
    <section
      aria-label="Candidate analytics"
      className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Analytics Update
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">
            Pipeline overview
          </h3>
        </div>
        <p className="text-xs text-slate-500">Based on this job’s candidates</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Total candidates"
          value={total}
          detail="In this pipeline"
        />
        <MetricCard
          label="Average match score"
          value={`${averageScore}%`}
          detail="Across all candidates"
        />
        <MetricCard
          label="Shortlisted"
          value={shortlisted}
          detail="Candidates advanced"
        />
        <MetricCard
          label="Hard-gate pass rate"
          value={`${hardGatePassRate}%`}
          detail="Candidates passing requirements"
        />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Pipeline distribution
          </h4>
          <span className="text-xs text-slate-400">{total} total</span>
        </div>
        {total ? (
          <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
            {PIPELINE_STATUSES.map((status) => {
              const count = candidates.filter(
                (candidate) => candidate.status === status,
              ).length;
              if (!count) return null;
              const colorClass = {
                Applied: "bg-sky-500",
                Shortlisted: "bg-indigo-500",
                Interviewing: "bg-amber-500",
                Hired: "bg-emerald-500",
                Rejected: "bg-rose-500",
                Disqualified: "bg-slate-500",
              }[status];

              return (
                <div
                  key={status}
                  title={`${status}: ${count}`}
                  className={colorClass}
                  style={{ width: `${(count / total) * 100}%` }}
                />
              );
            })}
          </div>
        ) : (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Upload candidates to see pipeline distribution.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {PIPELINE_STATUSES.map((status) => {
            const count = candidates.filter(
              (candidate) => candidate.status === status,
            ).length;
            return (
              <span
                key={status}
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-600"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    {
                      Applied: "bg-sky-500",
                      Shortlisted: "bg-indigo-500",
                      Interviewing: "bg-amber-500",
                      Hired: "bg-emerald-500",
                      Rejected: "bg-rose-500",
                      Disqualified: "bg-slate-500",
                    }[status]
                  }`}
                />
                {status} <span className="font-semibold">{count}</span>
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value, detail }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{detail}</p>
    </div>
  );
}
