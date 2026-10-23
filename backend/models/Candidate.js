const mongoose = require("mongoose");
const { STATUSES } = require("../constants");

const candidateSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  email: { type: String },
  matchScore: { type: Number, required: true, min: 0, max: 100 },
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
  interviewQuestions: [
    {
      category: { type: String, required: true },
      question: { type: String, required: true },
      difficulty: { type: String, required: true },
      expectedKeyPoints: [{ type: String }],
    },
  ],
  aiFeedback: { type: String },
  status: {
    type: String,
    enum: STATUSES,
    default: "Applied",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Candidate", candidateSchema);
