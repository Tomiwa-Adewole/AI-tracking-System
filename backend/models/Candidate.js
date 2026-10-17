const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  name: { type: String, required: true },
  email: { type: String },
  matchScore: { type: Number, required: true },
  passedHardGates: { type: Boolean, default: true },
  failedMustHaves: [
    {
      requirement: { type: String },
      isMet: { type: Boolean },
      evidence: { type: String },
    },
  ],
  parsedData: {
    summary: { type: String },
    skills: [{ type: String }],
  },
  aiFeedback: { type: String },
  status: {
    type: String,
    enum: [
      "Applied",
      "Shortlisted",
      "Interviewing",
      "Hired",
      "Rejected",
      "Disqualified",
    ],
    default: "Applied",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Candidate", candidateSchema);
