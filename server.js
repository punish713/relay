import express from "express";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

// Environment variables
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

if (!GROQ_API_KEY || !JWT_SECRET) {
  console.error("Missing GROQ_API_KEY or JWT_SECRET in environment!");
  process.exit(1);
}

// Middleware to check short-lived JWT
app.use((req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  const token = authHeader.slice(7);
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
});

// Relay endpoint
app.post("/groq", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify(req.body)
      }
    );

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Relay failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Relay listening on port ${PORT}`));
