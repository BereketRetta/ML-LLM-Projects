// packages/api/src/routes/agent.ts

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { UserInput } from "@toolcraft/shared";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniquePrefix + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * Process a text input
 * POST /api/agent/process-text
 */
router.post("/process-text", async (req, res) => {
  try {
    const { content, userId, conversationId } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID is required" });
    }

    const userInput: UserInput = {
      id: `input-${uuidv4()}`,
      type: "text",
      content,
      timestamp: new Date().toISOString(),
    };

    const agentService = req.app.locals.services.agentService;
    const response = await agentService.processInput(
      userId,
      userInput,
      conversationId
    );

    res.json(response);
  } catch (error) {
    console.error("Error processing text input:", error);
    res.status(500).json({ error: "Failed to process text input" });
  }
});

/**
 * Process an image input
 * POST /api/agent/process-image
 */
router.post("/process-image", upload.single("image"), async (req, res) => {
  try {
    const { userId, conversationId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID is required" });
    }

    // Generate image URL (relative to server)
    const imageUrl = `/uploads/${req.file.filename}`;
    const filePath = req.file.path;

    // Generate image description using vision service
    const visionService = req.app.locals.services.visionService;
    const imageDescription = await visionService.generateImageDescription(
      filePath
    );

    const userInput: UserInput = {
      id: `input-${uuidv4()}`,
      type: "image",
      content: req.body.content || "Image upload",
      imageUrl,
      imageDescription,
      timestamp: new Date().toISOString(),
    };

    const agentService = req.app.locals.services.agentService;
    const response = await agentService.processInput(
      userId,
      userInput,
      conversationId
    );

    res.json(response);
  } catch (error) {
    console.error("Error processing image input:", error);
    res.status(500).json({ error: "Failed to process image input" });
  }
});

/**
 * Process a file input
 * POST /api/agent/process-file
 */
router.post("/process-file", upload.single("file"), async (req, res) => {
  try {
    const { userId, conversationId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID is required" });
    }

    // Generate file URL (relative to server)
    const fileUrl = `/uploads/${req.file.filename}`;

    const userInput: UserInput = {
      id: `input-${uuidv4()}`,
      type: "file",
      content: req.body.content || "File upload",
      fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      timestamp: new Date().toISOString(),
    };

    const agentService = req.app.locals.services.agentService;
    const response = await agentService.processInput(
      userId,
      userInput,
      conversationId
    );

    res.json(response);
  } catch (error) {
    console.error("Error processing file input:", error);
    res.status(500).json({ error: "Failed to process file input" });
  }
});

/**
 * Get available tools
 * GET /api/agent/tools
 */
router.get("/tools", (req, res) => {
  try {
    const toolRegistry = req.app.locals.services.toolRegistry;
    const tools = toolRegistry.getToolDescriptions();

    res.json(tools);
  } catch (error) {
    console.error("Error getting available tools:", error);
    res.status(500).json({ error: "Failed to get available tools" });
  }
});

export default router;
