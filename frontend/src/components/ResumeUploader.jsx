import { useState, useRef } from "react";
import {
  API_BASE_URL,
  MAX_RESUME_BYTES,
  apiFetch,
  readJson,
} from "../lib/config.js";

export default function ResumeUploader({ activeJob, onUploadSuccess }) {
  const [resumeFile, setResumeFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleUploadResume = async (e) => {
    e.preventDefault();
    if (!resumeFile || !activeJob) return;

    setUploading(true);
    setUploadResult(null);
    setError("");

    const formData = new FormData();
    formData.append("resume", resumeFile);

    try {
      const response = await apiFetch(
        `${API_BASE_URL}/api/ats/upload-resume/${activeJob._id || activeJob.id}`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await readJson(response);
      if (response.ok) {
        setUploadResult(data.candidate);
        setResumeFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (onUploadSuccess) onUploadSuccess();
      } else {
        setError(data.error || "Failed to analyze resume.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Network error during resume upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateFile(file);
    }
  };

  const validateFile = (file) => {
    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please choose a valid PDF resume file.");
      setResumeFile(null);
    } else if (file.size > MAX_RESUME_BYTES) {
      setError("The resume must be 10 MB or smaller.");
      setResumeFile(null);
    } else {
      setError("");
      setResumeFile(file);
    }
  };

  return (
    <section className="bg-white p-7 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 transition-all">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
          2
        </div>
        <h2 className="text-lg font-bold text-slate-800">
          Upload Candidate Resume
        </h2>
      </div>

      <form onSubmit={handleUploadResume} className="space-y-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-emerald-500 bg-emerald-50/50 scale-[1.01]"
              : resumeFile
                ? "border-emerald-300 bg-emerald-50/30"
                : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="application/pdf"
            onClick={(event) => event.stopPropagation()}
            onChange={(e) =>
              e.target.files[0] && validateFile(e.target.files[0])
            }
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center text-emerald-600 mb-1">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            {resumeFile ? (
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {resumeFile.name}
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  PDF Ready for AI Evaluation
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Drag and drop your PDF resume here, or{" "}
                  <span className="text-indigo-600 font-semibold hover:underline">
                    browse files
                  </span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PDF format up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading || !resumeFile}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white px-6 py-2.5 rounded-xl font-medium text-sm shadow-sm transition-all duration-150 disabled:opacity-40 cursor-pointer"
        >
          {uploading
            ? "Analyzing Resume with Gemini AI..."
            : "Upload & Run AI Screen"}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700"
        >
          {error}
        </p>
      )}

      {uploadResult && (
        <div className="mt-6 p-5 border border-emerald-100 bg-emerald-50/50 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700/70">
                Analysis Complete
              </span>
              <h3 className="font-bold text-base text-emerald-950">
                {uploadResult.name}
              </h3>
            </div>
            <span className="px-3.5 py-1 bg-emerald-600 text-white font-bold rounded-full text-xs">
              Fit Score: {uploadResult.matchScore}/100
            </span>
          </div>
          <p className="text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Email:</span>{" "}
            {uploadResult.email || "Not specified"}
          </p>
          <p className="text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Summary:</span>{" "}
            {uploadResult.parsedData?.summary}
          </p>
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
              Extracted Skills:
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {uploadResult.parsedData?.skills?.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-white border border-emerald-200/60 text-emerald-800 text-xs rounded-md"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-700 bg-white/80 p-3 rounded-xl border border-emerald-100">
            <span className="font-semibold block mb-0.5 text-emerald-900">
              AI Feedback:
            </span>
            {uploadResult.aiFeedback}
          </div>
        </div>
      )}
    </section>
  );
}
