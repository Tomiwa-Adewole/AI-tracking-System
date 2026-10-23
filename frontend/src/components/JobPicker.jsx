export default function JobPicker({ jobs, selectedJob, onSelect, error }) {
  if (error) {
    return (
      <p role="alert" className="text-xs text-rose-600">
        {error}
      </p>
    );
  }
  if (jobs.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label
        htmlFor="job-picker"
        className="text-sm font-medium text-slate-700"
      >
        Open an existing job
      </label>
      <select
        id="job-picker"
        value={selectedJob?._id || ""}
        onChange={(event) =>
          onSelect(jobs.find((job) => job._id === event.target.value) || null)
        }
        className="min-w-0 flex-1 rounded-lg border p-2 text-sm"
      >
        <option value="">Select a job…</option>
        {jobs.map((job) => (
          <option key={job._id} value={job._id}>
            {job.title}
            {job.department ? ` — ${job.department}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
