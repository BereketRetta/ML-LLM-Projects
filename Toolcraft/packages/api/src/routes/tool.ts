// packages/api/src/routes/tool.ts

import express from "express";

const router = express.Router();

/**
 * List all available tools
 * GET /api/tool
 */
router.get("/", (req, res) => {
  try {
    const toolRegistry = req.app.locals.services.toolRegistry;
    const tools = toolRegistry.getToolDescriptions();

    res.json(tools);
  } catch (error) {
    console.error("Error listing tools:", error);
    res.status(500).json({ error: "Failed to list tools" });
  }
});

/**
 * Get details for a specific tool
 * GET /api/tool/:name
 */
router.get("/:name", (req, res) => {
  try {
    const { name } = req.params;
    const toolRegistry = req.app.locals.services.toolRegistry;
    const tool = toolRegistry.getTool(name);

    if (!tool) {
      return res.status(404).json({ error: `Tool "${name}" not found` });
    }

    // Return tool details (without the execute function)
    const toolDetails = {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    };

    res.json(toolDetails);
  } catch (error) {
    console.error("Error getting tool details:", error);
    res.status(500).json({ error: "Failed to get tool details" });
  }
});

/**
 * Execute a tool directly (for testing)
 * POST /api/tool/:name/execute
 */
router.post("/:name/execute", async (req, res) => {
  try {
    const { name } = req.params;
    const parameters = req.body;

    const toolRegistry = req.app.locals.services.toolRegistry;
    const tool = toolRegistry.getTool(name);

    if (!tool) {
      return res.status(404).json({ error: `Tool "${name}" not found` });
    }

    // Validate parameters
    const validation = toolRegistry.validateToolParameters(name, parameters);

    if (!validation.valid) {
      return res.status(400).json({
        error: "Invalid parameters",
        details: validation.errors,
      });
    }

    // Execute tool
    const result = await tool.execute(parameters);

    res.json({
      tool: name,
      parameters,
      result,
    });
  } catch (error) {
    console.error(`Error executing tool "${req.params.name}":`, error);
    res.status(500).json({
      error: "Failed to execute tool",
      message: error.message,
    });
  }
});

/**
 * Validate parameters for a tool
 * POST /api/tool/:name/validate
 */
router.post("/:name/validate", (req, res) => {
  try {
    const { name } = req.params;
    const parameters = req.body;

    const toolRegistry = req.app.locals.services.toolRegistry;
    const validation = toolRegistry.validateToolParameters(name, parameters);

    res.json(validation);
  } catch (error) {
    console.error(
      `Error validating parameters for tool "${req.params.name}":`,
      error
    );
    res.status(500).json({
      error: "Failed to validate parameters",
      message: error.message,
    });
  }
});

export default router;
