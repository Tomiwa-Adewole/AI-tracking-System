const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Fail fast on missing configuration.
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error(
    "FATAL ERROR: MONGO_URI is not defined in environment variables.",
  );
  process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not set. AI endpoints will fail.");
}
if (
  !process.env.RECRUITER_EMAIL ||
  !process.env.RECRUITER_PASSWORD ||
  (process.env.ATS_AUTH_SECRET || "").length < 32
) {
  console.warn(
    "WARNING: Recruiter authentication is not configured; ATS API requests will return 503.",
  );
}

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
if (allowedOrigins.length === 0) {
  console.warn(
    "WARNING: CORS_ORIGIN is unset; allowing all origins (development only).",
  );
}
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : undefined));
app.use(express.json({ limit: "100kb" }));

// Import and use ATS Routes
const atsRoutes = require("./routes/atsRoutes");
app.use("/api/ats", atsRoutes);

app.get("/", (req, res) => {
  res.send("AI-Powered ATS Backend is running!");
});

app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed JSON body." });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Connect to MongoDB first, then start the server
mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("Connected to MongoDB successfully!");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit process if database connection fails
  });
