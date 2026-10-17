import { useState } from "react";

export default function JobForm({
  onJobCreated,
  apiBaseUrl,
  activeJob,
  setActiveJob,
}) {
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    description: "",
    requiredSkills: "",
    mustHaves: "",
  });

  const [weightedSkills, setWeightedSkills] = useState([
    { skill: "", weight: 1 },
  ]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleAddWeightedSkill = () => {
    setWeightedSkills([...weightedSkills, { skill: "", weight: 1 }]);
  };

  const handleWeightedSkillChange = (index, field, value) => {
    const updated = [...weightedSkills];
    updated[index][field] = field === "weight" ? Number(value) : value;
    setWeightedSkills(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    const baseUrl =
      apiBaseUrl ||
      import.meta.env.VITE_API_BASE_URL ||
      "http://localhost:5000";

    const payload = {
      title: formData.title,
      department: formData.department,
      description: formData.description,
      requiredSkills: formData.requiredSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      mustHaves: formData.mustHaves
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      weightedSkills: weightedSkills.filter((s) => s.skill.trim() !== ""),
    };

    try {
      const res = await fetch(`${baseUrl}/api/ats/create-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || "Server returned an unexpected response.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to create job opening.");
      }

      setSuccessMsg("Job opening created successfully!");
      if (onJobCreated) onJobCreated(data.job);

      // Automatically select the newly created job if setActiveJob is provided
      if (setActiveJob) {
        setActiveJob(data.job);
      }

      setFormData({
        title: "",
        department: "",
        description: "",
        requiredSkills: "",
        mustHaves: "",
      });
      setWeightedSkills([{ skill: "", weight: 1 }]);
    } catch (err) {
      console.error("Job creation error:", err);
      setErrorMsg(
        err.message ||
          "A network or server error occurred while creating the job.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-6 border rounded-2xl bg-white shadow-sm"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Create Job Opening</h2>
        {activeJob && (
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
            Active: {activeJob.title}
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg">
          {successMsg}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Job Title
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full border p-2 rounded-lg mt-1 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Department
        </label>
        <input
          type="text"
          value={formData.department}
          onChange={(e) =>
            setFormData({ ...formData, department: e.target.value })
          }
          className="w-full border p-2 rounded-lg mt-1 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Job Description
        </label>
        <textarea
          required
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full border p-2 rounded-lg mt-1 text-sm h-24"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-red-600">
          Must-Have Mandatory Criteria (Hard Gates - comma separated)
        </label>
        <input
          type="text"
          placeholder="e.g. 5+ years Node.js, Active Clearance, US Resident"
          value={formData.mustHaves}
          onChange={(e) =>
            setFormData({ ...formData, mustHaves: e.target.value })
          }
          className="w-full border border-red-300 p-2 rounded-lg mt-1 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Required Skills (Comma separated fallback)
        </label>
        <input
          type="text"
          placeholder="e.g. JavaScript, React, Express, MongoDB"
          value={formData.requiredSkills}
          onChange={(e) =>
            setFormData({ ...formData, requiredSkills: e.target.value })
          }
          className="w-full border p-2 rounded-lg text-sm mb-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Weighted Skills (1-5 Weighting)
        </label>
        {weightedSkills.map((item, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Skill (e.g. React)"
              value={item.skill}
              onChange={(e) =>
                handleWeightedSkillChange(idx, "skill", e.target.value)
              }
              className="flex-1 border p-2 rounded-lg text-sm"
            />
            <select
              value={item.weight}
              onChange={(e) =>
                handleWeightedSkillChange(idx, "weight", e.target.value)
              }
              className="border p-2 rounded-lg text-sm"
            >
              {[1, 2, 3, 4, 5].map((w) => (
                <option key={w} value={w}>
                  Weight {w}
                </option>
              ))}
            </select>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddWeightedSkill}
          className="text-sm text-blue-600 font-medium hover:underline"
        >
          + Add Skill Weight
        </button>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 text-white p-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer"
      >
        {submitting ? "Creating Job Opening..." : "Create Job Opening"}
      </button>
    </form>
  );
}
