const express = require("express");
const router = express.Router();
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const { GoogleGenAI, Type } = require("@google/genai");

const Job = require("../models/Job");
const Candidate = require("../models/Candidate");

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Configure Multer with strict 10MB size limit & combined MIME + Extension filter
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    const isPdfMime = file.mimetype === "application/pdf";
    const hasPdfExtension = file.originalname.toLowerCase().endsWith(".pdf");

    // Require both genuine PDF MIME type AND .pdf extension
    if (isPdfMime && hasPdfExtension) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type: Only genuine PDF documents are allowed."),
        false,
      );
    }
  },
});

// Custom middleware to guarantee JSON error responses for upload failures (like size limits or invalid file types)
const handleUploadMiddleware = (req, res, next) => {
  upload.single("resume")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "File size exceeds the 10 MB limit." });
      }
      return res
        .status(400)
        .json({ error: err.message || "File upload error." });
    }
    next();
  });
};

// Helper function to check real PDF magic bytes (%PDF-)
const isValidPdfContent = (filePath) => {
  try {
    const buffer = Buffer.alloc(5);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    return buffer.toString("utf8") === "%PDF-";
  } catch (err) {
    return false;
  }
};

// 1. Get all job openings
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
    const {
      title,
      department,
      description,
      requiredSkills,
      mustHaves,
      weightedSkills,
    } = req.body;
    const newJob = new Job({
      title,
      department,
      description,
      requiredSkills: requiredSkills || [],
      mustHaves: mustHaves || [],
      weightedSkills: weightedSkills || [],
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
      "Disqualified",
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

// 5. Upload and analyze resume using Gemini AI with Weighted Skill Logic & Hard Gates
router.post(
  "/upload-resume/:jobId",
  handleUploadMiddleware,
  async (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No resume file provided or invalid file type." });
    }

    const filePath = req.file.path;

    // Strict content validation: Check actual file header (magic bytes)
    if (!isValidPdfContent(filePath)) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({
        error: "Invalid file content: File is not a genuine PDF document.",
      });
    }

    try {
      const { jobId } = req.params;
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job opening not found" });
      }

      // Read PDF text
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      const resumeText = pdfData.text;

      // Define strict Gemini Response Schema
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          email: { type: Type.STRING },
          mustHavesMet: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                requirement: { type: Type.STRING },
                isMet: { type: Type.BOOLEAN },
                evidence: { type: Type.STRING },
              },
              required: ["requirement", "isMet"],
            },
          },
          skillAssessments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                skill: { type: Type.STRING },
                foundInResume: { type: Type.BOOLEAN },
                proficiencyLevel: { type: Type.STRING },
              },
              required: ["skill", "foundInResume"],
            },
          },
          parsedData: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              skills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["summary", "skills"],
          },
          aiFeedback: { type: Type.STRING },
        },
        required: [
          "name",
          "email",
          "mustHavesMet",
          "skillAssessments",
          "parsedData",
          "aiFeedback",
        ],
      };

      const mustHaveList = job.mustHaves || [];
      const weightedSkillsList = job.weightedSkills || [];
      const requiredSkillsList = job.requiredSkills || [];

      const evaluationSkills =
        weightedSkillsList.length > 0
          ? weightedSkillsList.map((s) => s.skill)
          : requiredSkillsList;

      const prompt = `
      You are an expert ATS recruiter. Analyze this resume text against the job description and evaluation criteria.

      JOB DETAILS:
      Job Title: ${job.title}
      Job Description: ${job.description}
      Must-Have Criteria (Hard Gates): ${JSON.stringify(mustHaveList)}
      Target Skills to Assess: ${JSON.stringify(evaluationSkills)}

      RESUME TEXT:
      ${resumeText}

      INSTRUCTIONS:
      1. Extract the candidate's name and email.
      2. Evaluate each item in Must-Have Criteria and specify whether it is met (isMet: true/false) along with evidence.
      3. Evaluate each skill in Target Skills to Assess and report whether it was found in the resume.
      4. Provide a 2-3 sentence summary and list all detected technical skills.
      5. Provide an objective recruiter summary in aiFeedback.
      `;

      const generateWithRetry = async (retries = 5, delay = 3000) => {
        for (let i = 0; i < retries; i++) {
          try {
            return await ai.models.generateContent({
              model: "gemini-3.5-flash-lite",
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
              },
            });
          } catch (err) {
            const message = err?.message || "";
            const isTransient =
              err?.status === 503 ||
              err?.status === 429 ||
              err?.status === 504 ||
              err?.code === 503 ||
              err?.code === 429 ||
              message.includes("overloaded") ||
              message.includes("high demand") ||
              message.includes("RESOURCE_EXHAUSTED");

            if (isTransient && i < retries - 1) {
              const jitter = Math.random() * 1000;
              const waitTime = delay + jitter;
              console.warn(
                `[Gemini 3.5 Flash Lite Retry ${i + 1}/${retries}] Model busy/rate-limited. Waiting ${Math.round(waitTime)}ms...`,
              );
              await new Promise((resolve) => setTimeout(resolve, waitTime));
              delay *= 2;
            } else {
              console.error("Gemini 3.5 Flash Lite Final Error:", err);
              throw err;
            }
          }
        }
      };

      const response = await generateWithRetry();
      const aiResult = JSON.parse(response.text);

      // --- DETERMINISTIC SCORING & HARD GATE LOGIC ---
      const failedMustHaves = (aiResult.mustHavesMet || []).filter(
        (item) => !item.isMet,
      );
      const passedHardGates = failedMustHaves.length === 0;

      let calculatedScore = 70;

      if (weightedSkillsList.length > 0) {
        let totalPossibleWeight = 0;
        let earnedWeight = 0;

        weightedSkillsList.forEach((reqSkill) => {
          const weight = reqSkill.weight || 1;
          totalPossibleWeight += weight;

          const detected = (aiResult.skillAssessments || []).find(
            (s) =>
              s.skill.toLowerCase() === reqSkill.skill.toLowerCase() &&
              s.foundInResume,
          );
          if (detected) earnedWeight += weight;
        });

        calculatedScore =
          totalPossibleWeight > 0
            ? Math.round((earnedWeight / totalPossibleWeight) * 100)
            : 70;
      } else if (requiredSkillsList.length > 0) {
        let matchedCount = 0;
        requiredSkillsList.forEach((reqSkill) => {
          const detected = (aiResult.skillAssessments || []).find(
            (s) =>
              s.skill.toLowerCase() === reqSkill.toLowerCase() &&
              s.foundInResume,
          );
          if (detected) matchedCount++;
        });
        calculatedScore = Math.round(
          (matchedCount / requiredSkillsList.length) * 100,
        );
      }

      const candidateStatus = !passedHardGates ? "Disqualified" : "Applied";

      const newCandidate = new Candidate({
        jobId,
        name: aiResult.name || "Unknown Candidate",
        email: aiResult.email || "",
        matchScore: calculatedScore,
        passedHardGates,
        failedMustHaves,
        parsedData: aiResult.parsedData || { summary: "", skills: [] },
        aiFeedback: aiResult.aiFeedback || "No feedback provided",
        status: candidateStatus,
      });

      await newCandidate.save();
      return res.status(201).json({
        message: "Resume analyzed successfully",
        candidate: newCandidate,
      });
    } catch (err) {
      console.error("Error analyzing resume:", err);
      return res
        .status(500)
        .json({ error: err.message || "Failed to analyze resume" });
    } finally {
      // Guaranteed disk cleanup for temporary uploaded PDF file
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  },
);

module.exports = router;
