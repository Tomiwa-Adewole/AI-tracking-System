import { useState, useEffect } from "react";

export default function JobForm({ activeJob, setActiveJob }) {
  const [jobs, setJobs] = useState([]);
  const [jobForm, setJobForm] = useState({
    title: "",
    department: "",
    description: "",
    requiredSkills: "",
  });
  const [loadingJob, setLoadingJob] = useState(false);

  // Fetch all existing jobs on mount
  useEffect(() => {
    const fetchAllJobs = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/ats/jobs");
        const data = await response.json();
        if (response.ok) {
          setJobs(data);
        }
      } catch (err) {
        console.error("Error fetching job list:", err);
      }
    };
    fetchAllJobs();
  }, []);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setLoadingJob(true);
    try {
      const formattedSkills = jobForm.requiredSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const response = await fetch("http://localhost:5000/api/ats/create-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...jobForm,
          requiredSkills: formattedSkills,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setActiveJob(data.job);
        setJobs((prev) => [data.job, ...prev]); // instantly update dropdown list
        setJobForm({
          title: "",
          department: "",
          description: "",
          requiredSkills: "",
        });
        alert("Job created and selected successfully!");
      } else {
        alert(data.error || "Failed to create job.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while creating job.");
    } finally {
      setLoadingJob(false);
    }
  };

  const handleSelectChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setActiveJob(null);
      return;
    }
    const foundJob = jobs.find((j) => j._id === selectedId);
    if (foundJob) {
      setActiveJob(foundJob);
    }
  };

  return (
    <section className="bg-white p-7 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 transition-all space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
            📁
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Select Existing Job Opening
            </h2>
            <p className="text-xs text-slate-400">
              Switch between different active hiring pipelines
            </p>
          </div>
        </div>

        <div className="w-full md:w-72">
          <select
            value={activeJob ? activeJob._id : ""}
            onChange={handleSelectChange}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium text-slate-700"
          >
            <option value="">-- Choose an open role --</option>
            {jobs.map((job) => (
              <option key={job._id} value={job._id}>
                {job.title} ({job.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            Or Create a New Job Opening
          </h2>
        </div>

        <form onSubmit={handleCreateJob} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Job Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senior MERN Stack Developer"
                value={jobForm.title}
                onChange={(e) =>
                  setJobForm({ ...jobForm, title: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Department
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Engineering & Technology"
                value={jobForm.department}
                onChange={(e) =>
                  setJobForm({ ...jobForm, department: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Job Description & Responsibilities
            </label>
            <textarea
              required
              rows="3"
              placeholder="Enter role expectations, daily tasks, and requirements..."
              value={jobForm.description}
              onChange={(e) =>
                setJobForm({ ...jobForm, description: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Required Skills (Comma separated)
            </label>
            <input
              type="text"
              required
              placeholder="React, Node.js, MongoDB, TypeScript, Tailwind CSS"
              value={jobForm.requiredSkills}
              onChange={(e) =>
                setJobForm({ ...jobForm, requiredSkills: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loadingJob}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white px-6 py-2.5 rounded-xl font-medium text-sm shadow-sm transition-all duration-150 disabled:opacity-50 cursor-pointer"
          >
            {loadingJob ? "Saving Role..." : "Save & Select Job Opening"}
          </button>
        </form>
      </div>

      {activeJob && (
        <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between text-sm">
          <div>
            <span className="font-semibold text-indigo-900">
              Active Target:
            </span>{" "}
            <span className="text-indigo-700 font-medium">
              {activeJob.title}
            </span>{" "}
            ({activeJob.department})
          </div>
          <span className="text-xs px-2.5 py-1 bg-white border border-indigo-200 text-indigo-600 rounded-lg font-mono">
            ID: {activeJob._id.slice(-6)}
          </span>
        </div>
      )}
    </section>
  );
}
