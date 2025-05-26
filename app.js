// app.js
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const xml2js = require("xml2js");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer();

// Ensure the responses folder exists
const responsesDir = path.join(__dirname, "responses");
if (!fs.existsSync(responsesDir)) {
  fs.mkdirSync(responsesDir);
}

// Helper to save JSON data to a file
function saveResponse(data) {
  const filename = `response_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 8)}.json`;
  const filepath = path.join(responsesDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf8");
  return filename;
}

// For urlencoded (HTML form) submissions
app.use(bodyParser.urlencoded({ extended: true }));

// For FDF (text/plain) submissions
app.use(bodyParser.text({ type: "text/plain" }));

// For XFDF (application/vnd.adobe.xfdf) submissions
app.use(bodyParser.text({ type: "application/vnd.adobe.xfdf+xml" }));

// For PDF file submissions
app.post("/api/submit", upload.single("file"), (req, res, next) => {
  if (req.file) {
    // Save file info as JSON
    const data = {
      type: "pdf",
      filename: req.file.originalname,
      receivedAt: new Date().toISOString(),
    };
    const savedFile = saveResponse(data);
    return res.json({ status: "PDF received", file: savedFile });
  }
  next();
});

// For XFDF submissions
app.post("/api/submit", async (req, res, next) => {
  if (
    req.is("application/vnd.adobe.xfdf+xml") ||
    (req.headers["content-type"] &&
      req.headers["content-type"].includes("application/vnd.adobe.xfdf+xml"))
  ) {
    try {
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(req.body);
      const data = {
        type: "xfdf",
        receivedAt: new Date().toISOString(),
        data: result,
      };
      const savedFile = saveResponse(data);
      return res.json({ status: "XFDF received", file: savedFile });
    } catch (err) {
      return res.status(400).json({ error: "Invalid XFDF" });
    }
  }
  next();
});

// For FDF submissions
app.post("/api/submit", (req, res, next) => {
  if (req.is("text/plain")) {
    const data = {
      type: "fdf",
      receivedAt: new Date().toISOString(),
      raw: req.body,
    };
    const savedFile = saveResponse(data);
    return res.json({ status: "FDF received", file: savedFile });
  }
  next();
});

// For HTML form submissions
app.post("/api/submit", (req, res) => {
  if (req.is("application/x-www-form-urlencoded")) {
    const data = {
      type: "form",
      receivedAt: new Date().toISOString(),
      data: req.body,
    };
    const savedFile = saveResponse(data);
    return res.json({ status: "Form data received", file: savedFile });
  }
  res.status(415).json({ error: "Unsupported Media Type" });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
