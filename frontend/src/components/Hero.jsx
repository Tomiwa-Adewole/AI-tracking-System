export default function Hero() {
  return (
    <div className="bg-gradient-to-br from-indigo-50/80 via-purple-50/30 to-white border-b border-indigo-100/60 pt-12 pb-10 px-6 shadow-sm rounded-2xl mb-8">
      <div className="max-w-4xl mx-auto text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/70 border border-indigo-200/50 text-indigo-700 text-xs font-semibold tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          Powered by Gemini AI
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Intelligent Applicant Tracking System
        </h1>
        <p className="text-base text-slate-500 max-w-xl mx-auto">
          Automate resume screening, extract precise technical skills, and rank
          top-tier talent with objective AI-driven scoring.
        </p>
      </div>
    </div>
  );
}