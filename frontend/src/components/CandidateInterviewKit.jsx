import { useState } from "react";
import { API_BASE_URL, apiFetch, readJson } from "../lib/config.js";

export default function CandidateInterviewKit({
  candidateId,
  existingQuestions = [],
  onQuestionsGenerated,
}) {
  const [questions, setQuestions] = useState(existingQuestions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(
        `${API_BASE_URL}/api/ats/candidates/${candidateId}/generate-questions`,
        { method: "POST" },
      );
      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to generate interview questions.",
        );
      }

      setQuestions(Array.isArray(data.questions) ? data.questions : []);
      if (onQuestionsGenerated) await onQuestionsGenerated();
    } catch (err) {
      setError(
        err.message || "Failed to generate questions. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-bold text-slate-900">
            Tailored Interview Questions
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            Generate questions based on this candidate’s experience and the job
            requirements.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Generating..."
            : questions.length
              ? "Regenerate Kit"
              : "Generate Interview Kit"}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700"
        >
          {error}
        </p>
      )}

      {questions.length > 0 ? (
        <div className="space-y-3">
          {questions.map((item, index) => (
            <article
              key={`${candidateId}-${index}`}
              className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                  {item.category}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                  {item.difficulty} Level
                </span>
              </div>
              <p className="text-sm font-semibold leading-relaxed text-slate-900">
                {item.question}
              </p>
              {Array.isArray(item.expectedKeyPoints) &&
                item.expectedKeyPoints.length > 0 && (
                  <div className="mt-3 text-xs text-slate-600">
                    <p className="font-semibold text-slate-700">
                      Look for in the answer
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {item.expectedKeyPoints.map((point, pointIndex) => (
                        <li key={`${candidateId}-${index}-${pointIndex}`}>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </article>
          ))}
        </div>
      ) : (
        !loading &&
        !error && (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-500">
            No interview kit yet. Generate one to get tailored questions and
            evaluation points.
          </p>
        )
      )}
    </section>
  );
}
