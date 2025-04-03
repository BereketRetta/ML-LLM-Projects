// packages/api/src/routes/user.ts

import express from "express";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

/**
 * Create a new user (demo only, no auth)
 * POST /api/user
 */
router.post("/", (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // In a real implementation, this would create a user in a database
    // and have proper authentication

    // Create a simple user object
    const user = {
      id: `user-${uuidv4()}`,
      username,
      email,
      createdAt: new Date().toISOString(),
    };

    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

/**
 * Get user info (demo only, no auth)
 * GET /api/user/:id
 */
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params;

    // In a real implementation, this would fetch the user from a database
    // and verify authentication

    // Check if user exists (mock check)
    if (id.startsWith("user-")) {
      const user = {
        id,
        username: "demouser",
        email: "demo@example.com",
        createdAt: new Date().toISOString(),
      };

      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

/**
 * Clear all memory for a user
 * DELETE /api/user/:id/memory
 */
router.delete("/:id/memory", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists (mock check)
    if (id.startsWith("user-")) {
      const memoryService = req.app.locals.services.memoryService;
      await memoryService.clearUserMemory(id);

      res.status(204).end();
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error clearing user memory:", error);
    res.status(500).json({ error: "Failed to clear user memory" });
  }
});

/**
 * Get user preferences
 * GET /api/user/:id/preferences
 */
router.get("/:id/preferences", (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists (mock check)
    if (id.startsWith("user-")) {
      // In a real implementation, this would fetch from a database
      const preferences = {
        theme: "light",
        messageBubbleStyle: "rounded",
        showAgentThinking: true,
        showToolOutputs: true,
      };

      res.json(preferences);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error getting user preferences:", error);
    res.status(500).json({ error: "Failed to get user preferences" });
  }
});

/**
 * Update user preferences
 * PUT /api/user/:id/preferences
 */
router.put("/:id/preferences", (req, res) => {
  try {
    const { id } = req.params;
    const preferences = req.body;

    // Check if user exists (mock check)
    if (id.startsWith("user-")) {
      // In a real implementation, this would update in a database

      res.json({
        ...preferences,
        updatedAt: new Date().toISOString(),
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error updating user preferences:", error);
    res.status(500).json({ error: "Failed to update user preferences" });
  }
});

export default router;
