const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  name: { type: String, required: true },
  email: { type: String },
  matchScore: { type: Number, required: true },
  parsedData: {
    summary: String,
    skills: [String],
  },
  aiFeedback: String,
  status: {
    type: String,
    enum: ["Applied", "Shortlisted", "Interviewing", "Hired", "Rejected"],
    default: "Applied",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Candidate", candidateSchema);
