// packages/api/src/routes/conversation.ts

import express from "express";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

/**
 * Create a new conversation
 * POST /api/conversation
 */
router.post("/", async (req, res) => {
  try {
    const { userId, title } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const conversation = {
      id: `conv-${uuidv4()}`,
      userId,
      title: title || "New Conversation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    // In a real implementation, this would save to a database
    // For now, we'll just return the created conversation

    res.status(201).json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

/**
 * Get a conversation by ID
 * GET /api/conversation/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // In a real implementation, this would fetch from a database
    // For now, we'll return a mock response

    // Check if conversation exists (mock check)
    if (id.startsWith("conv-")) {
      const conversation = {
        id,
        userId,
        title: "Sample Conversation",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };

      res.json(conversation);
    } else {
      res.status(404).json({ error: "Conversation not found" });
    }
  } catch (error) {
    console.error("Error getting conversation:", error);
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

/**
 * List conversations for a user
 * GET /api/conversation
 */
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // In a real implementation, this would fetch from a database
    // For now, we'll return mock data

    const conversations = [
      {
        id: `conv-${uuidv4()}`,
        userId,
        title: "Sample Conversation 1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: 10,
      },
      {
        id: `conv-${uuidv4()}`,
        userId,
        title: "Sample Conversation 2",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        messageCount: 5,
      },
    ];

    res.json(conversations);
  } catch (error) {
    console.error("Error listing conversations:", error);
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

/**
 * Update a conversation
 * PUT /api/conversation/:id
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, title } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // In a real implementation, this would update in a database
    // For now, we'll just return a success response

    // Check if conversation exists (mock check)
    if (id.startsWith("conv-")) {
      const updatedConversation = {
        id,
        userId,
        title: title || "Updated Conversation",
        updatedAt: new Date().toISOString(),
      };

      res.json(updatedConversation);
    } else {
      res.status(404).json({ error: "Conversation not found" });
    }
  } catch (error) {
    console.error("Error updating conversation:", error);
    res.status(500).json({ error: "Failed to update conversation" });
  }
});

/**
 * Delete a conversation
 * DELETE /api/conversation/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // In a real implementation, this would delete from a database
    // For now, we'll just return a success response

    // Check if conversation exists (mock check)
    if (id.startsWith("conv-")) {
      // Delete the conversation

      res.status(204).end();
    } else {
      res.status(404).json({ error: "Conversation not found" });
    }
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

/**
 * Get messages for a conversation
 * GET /api/conversation/:id/messages
 */
router.get("/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // In a real implementation, this would fetch from a database
    // For now, we'll return mock data

    // Check if conversation exists (mock check)
    if (id.startsWith("conv-")) {
      
    } else {
      res.status(404).json({ error: "Conversation not found" });
    }
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

/**
 * Summarize a conversation
 * GET /api/conversation/:id/summary
 */
router.get("/:id/summary", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if conversation exists (mock check)
    if (id.startsWith("conv-")) {
      const memoryService = req.app.locals.services.memoryService;
      const summary = await memoryService.summarizeConversation(
        userId.toString(),
        id
      );

      res.json({ id, summary });
    } else {
      res.status(404).json({ error: "Conversation not found" });
    }
  } catch (error) {
    console.error("Error summarizing conversation:", error);
    res.status(500).json({ error: "Failed to summarize conversation" });
  }
});

export default router;
