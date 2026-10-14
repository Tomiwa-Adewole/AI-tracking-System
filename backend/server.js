const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database Connection Check
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error(
    "FATAL ERROR: MONGO_URI is not defined in environment variables.",
  );
  process.exit(1);
}

// Import and use ATS Routes
const atsRoutes = require("./routes/atsRoutes");
app.use("/api/ats", atsRoutes);

app.get("/", (req, res) => {
  res.send("AI-Powered ATS Backend is running!");
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
