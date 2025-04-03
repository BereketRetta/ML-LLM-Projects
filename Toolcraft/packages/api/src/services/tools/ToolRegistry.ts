// packages/api/src/services/tools/ToolRegistry.ts

import { Tool, ToolParameter } from "@toolcraft/shared";

/**
 * Registry for managing available tools
 */
export class ToolRegistry {
  private tools: Map<string, Tool>;

  constructor() {
    this.tools = new Map();
  }

  /**
   * Register a new tool
   */
  registerTool(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool with name "${tool.name}" is already registered`);
    }

    this.tools.set(tool.name, tool);
    console.log(`Tool "${tool.name}" registered successfully`);
  }

  /**
   * Unregister a tool
   */
  unregisterTool(toolName: string): boolean {
    return this.tools.delete(toolName);
  }

  /**
   * Get a tool by name
   */
  getTool(toolName: string): Tool | undefined {
    return this.tools.get(toolName);
  }

  /**
   * Get all available tools
   */
  getAvailableTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get details about available tools in a format suitable for the LLM
   */
  getToolDescriptions(): Array<{
    name: string;
    description: string;
    parameters: Record<string, ToolParameter>;
  }> {
    return this.getAvailableTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  /**
   * Validate parameters for a specific tool
   */
  validateToolParameters(
    toolName: string,
    parameters: Record<string, any>
  ): { valid: boolean; errors?: string[] } {
    const tool = this.getTool(toolName);

    if (!tool) {
      return {
        valid: false,
        errors: [`Tool "${toolName}" not found`],
      };
    }

    const errors: string[] = [];

    // Check for required parameters
    for (const [paramName, paramSpec] of Object.entries(tool.parameters)) {
      if (paramSpec.required && parameters[paramName] === undefined) {
        errors.push(`Required parameter "${paramName}" is missing`);
      }
    }

    // Check parameter types and constraints
    for (const [paramName, paramValue] of Object.entries(parameters)) {
      const paramSpec = tool.parameters[paramName];

      if (!paramSpec) {
        errors.push(`Unknown parameter "${paramName}"`);
        continue;
      }

      // Type checking
      if (paramSpec.type === "number" && typeof paramValue !== "number") {
        errors.push(`Parameter "${paramName}" should be a number`);
      } else if (
        paramSpec.type === "string" &&
        typeof paramValue !== "string"
      ) {
        errors.push(`Parameter "${paramName}" should be a string`);
      } else if (
        paramSpec.type === "boolean" &&
        typeof paramValue !== "boolean"
      ) {
        errors.push(`Parameter "${paramName}" should be a boolean`);
      } else if (paramSpec.type === "array" && !Array.isArray(paramValue)) {
        errors.push(`Parameter "${paramName}" should be an array`);
      } else if (
        paramSpec.type === "object" &&
        (typeof paramValue !== "object" ||
          paramValue === null ||
          Array.isArray(paramValue))
      ) {
        errors.push(`Parameter "${paramName}" should be an object`);
      }

      // Enum validation
      if (paramSpec.enum && !paramSpec.enum.includes(paramValue)) {
        errors.push(
          `Parameter "${paramName}" must be one of: ${paramSpec.enum.join(
            ", "
          )}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
