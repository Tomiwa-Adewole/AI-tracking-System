const express = require("express");
const router = express.Router();
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const { GoogleGenAI } = require("@google/genai");

const Job = require("../models/Job");
const Candidate = require("../models/Candidate");

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Configure multer for temporary file uploads
const upload = multer({ dest: "uploads/" });

// 1. Get all job openings (for the multi-job dropdown selector)
router.get("/jobs", async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(500).json({ error: "Server error while fetching jobs" });
  }
});

// 2. Create a new job opening
router.post("/create-job", async (req, res) => {
  try {
    const { title, department, description, requiredSkills } = req.body;
    const newJob = new Job({
      title,
      department,
      description,
      requiredSkills,
    });
    await newJob.save();
    res.status(201).json({ message: "Job created successfully", job: newJob });
  } catch (err) {
    console.error("Error creating job:", err);
    res.status(500).json({ error: "Failed to create job" });
  }
});

// 3. Get all candidates for a specific job (Leaderboard)
router.get("/candidates/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const candidates = await Candidate.find({ jobId }).sort({ matchScore: -1 });
    res.status(200).json(candidates);
  } catch (err) {
    console.error("Error fetching candidates:", err);
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
});

// 4. Update candidate pipeline status
router.patch("/candidates/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "Applied",
      "Shortlisted",
      "Interviewing",
      "Hired",
      "Rejected",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid pipeline status" });
    }

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    if (!updatedCandidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    res.status(200).json({
      message: "Status updated successfully",
      candidate: updatedCandidate,
    });
  } catch (err) {
    console.error("Error updating candidate status:", err);
    res.status(500).json({ error: "Server error while updating status" });
  }
});

// 5. Upload and analyze resume using Gemini AI with automatic retry for 503 high demand
router.post(
  "/upload-resume/:jobId",
  upload.single("resume"),
  async (req, res) => {
    try {
      const { jobId } = req.params;
      if (!req.file) {
        return res.status(400).json({ error: "No resume file provided" });
      }

      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job opening not found" });
      }

      // Read PDF text
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(dataBuffer);
      const resumeText = pdfData.text;

      // Clean up temporary uploaded file from disk
      fs.unlinkSync(req.file.path);

      const prompt = `
      You are an expert ATS (Applicant Tracking System) recruiter.
      Analyze this resume against the job description and required skills.

      Job Title: ${job.title}
      Job Description: ${job.description}
      Required Skills: ${job.requiredSkills.join(", ")}

      Resume Text:
      ${resumeText}

      Provide your evaluation strictly in the following JSON format:
      {
        "name": "Candidate Full Name",
        "email": "Candidate Email Address",
        "matchScore": <number between 0 and 100>,
        "parsedData": {
          "summary": "Short 2-3 sentence professional summary",
          "skills": ["skill1", "skill2", ...]
        },
        "aiFeedback": "Detailed breakdown of why this candidate is a good or poor fit, highlighting strengths and missing requirements."
      }
    `;

      // Helper function with retry logic for 503 high demand errors
      const generateWithRetry = async (retries = 3, delay = 2000) => {
        for (let i = 0; i < retries; i++) {
          try {
            const response = await ai.models.generateContent({
              model: "gemini-3.8-flash",
              contents: prompt,
              config: {
                responseMimeType: "application/json",
              },
            });
            return response;
          } catch (err) {
            if (err.status === 503 && i < retries - 1) {
              console.warn(
                `Gemini high demand (503). Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries})`,
              );
              await new Promise((resolve) => setTimeout(resolve, delay));
              delay *= 2;
            } else {
              throw err;
            }
          }
        }
      };

      const response = await generateWithRetry();
      const aiResult = JSON.parse(response.text);

      // Save candidate to MongoDB
      const newCandidate = new Candidate({
        jobId,
        name: aiResult.name || "Unknown Candidate",
        email: aiResult.email || "",
        matchScore: aiResult.matchScore || 0,
        parsedData: aiResult.parsedData || { summary: "", skills: [] },
        aiFeedback: aiResult.aiFeedback || "No feedback provided",
        status: "Applied",
      });

      await newCandidate.save();
      res.status(201).json({
        message: "Resume analyzed successfully",
        candidate: newCandidate,
      });
    } catch (err) {
      console.error("Error analyzing resume:", err);
      res.status(500).json({
        error:
          err.status === 503
            ? "AI model is experiencing high demand. Please try uploading again in a moment."
            : "Failed to analyze resume with AI",
      });
    }
  },
);

module.exports = router;
