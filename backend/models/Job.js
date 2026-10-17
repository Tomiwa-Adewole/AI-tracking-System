const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  department: { type: String },
  description: { type: String, required: true },
  requiredSkills: [{ type: String }],
  mustHaves: [{ type: String }], // Array of non-negotiable hard gate criteria
  weightedSkills: [
    {
      skill: { type: String, required: true },
      weight: { type: Number, default: 1 }, // Weight value (e.g. 1 to 5)
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Job", jobSchema);
