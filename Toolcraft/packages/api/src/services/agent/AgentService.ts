// packages/api/src/services/agent/AgentService.ts

import { MemoryService } from "../memory/MemoryService";
import { ToolRegistry } from "../tools/ToolRegistry";
import { LLMService } from "../llm/LLMService";
import { VisionService } from "../vision/VisionService";
import {
  AgentStep,
  AgentResponse,
  UserInput,
  ToolResult,
} from "@toolcraft/shared";

export class AgentService {
  private llmService: LLMService;
  private memoryService: MemoryService;
  private toolRegistry: ToolRegistry;
  private visionService: VisionService;

  constructor(
    llmService: LLMService,
    memoryService: MemoryService,
    toolRegistry: ToolRegistry,
    visionService: VisionService
  ) {
    this.llmService = llmService;
    this.memoryService = memoryService;
    this.toolRegistry = toolRegistry;
    this.visionService = visionService;
  }

  /**
   * Process a user input and generate a response using the agent
   */
  async processInput(
    userId: string,
    input: UserInput,
    conversationId: string
  ): Promise<AgentResponse> {
    console.log("111");
    try {
      // Store the user input in memory
      await this.memoryService.storeUserInput(userId, conversationId, input);
      console.log("222");

      // Retrieve relevant context from memory
      const context = await this.memoryService.retrieveRelevantContext(
        userId,
        conversationId,
        input
      );

      console.log("Retrieved context:", context);

      // Generate agent reasoning steps
      const agentSteps = await this.generateAgentSteps(input, context);

      console.log("Agent reasoning steps:", agentSteps);

      // Execute any tools required by the reasoning
      const toolResults = await this.executeTools(agentSteps);

      console.log("Tool results:", toolResults);

      // Generate final response
      const finalResponse = await this.generateFinalResponse(
        input,
        context,
        agentSteps,
        toolResults
      );

      // Store the agent response in memory
      await this.memoryService.storeAgentResponse(
        userId,
        conversationId,
        finalResponse
      );

      return finalResponse;
    } catch (error) {
      console.error("Error processing user input:", error);
      return {
        id: `response-${Date.now()}`,
        type: "error",
        content:
          "I encountered an error while processing your request. Please try again.",
        timestamp: new Date().toISOString(),
        steps: [],
        toolsUsed: [],
      };
    }
  }

  /**
   * Generate reasoning steps using the LLM
   */
  private async generateAgentSteps(
    input: UserInput,
    context: string
  ): Promise<AgentStep[]> {
    // Get available tools from registry
    const availableTools = this.toolRegistry.getAvailableTools();

    // Create a prompt for the agent to reason about the input
    const reasoningPrompt = this.createReasoningPrompt(
      input,
      context,
      availableTools
    );

    // Get reasoning steps from LLM
    const reasoningResponse = await this.llmService.generateReasoning(
      reasoningPrompt
    );

    // Parse the response into discrete steps
    return this.parseReasoningSteps(reasoningResponse);
  }

  /**
   * Execute tools based on the agent's reasoning steps
   */
  private async executeTools(steps: AgentStep[]): Promise<ToolResult[]> {
    const toolResults: ToolResult[] = [];

    // Find steps that require tool execution
    const toolSteps:any = steps.filter((step: any) => step.requiresTool);

    // Execute each tool
    for (const step of toolSteps) {
      try {
        const tool = this.toolRegistry.getTool(step.toolName);

        if (!tool) {
          toolResults.push({
            toolName: step.toolName,
            successful: false,
            result: `Tool "${step.toolName}" not found`,
            timestamp: new Date().toISOString(),
          });
          continue;
        }

        // Execute the tool with the parameters from the step
        const result = await tool.execute(step.toolParameters);

        toolResults.push({
          toolName: step.toolName,
          successful: true,
          result,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Error executing tool ${step.toolName}:`, error);

        toolResults.push({
          toolName: step.toolName,
          successful: false,
          result: `Error executing tool: ${error}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return toolResults;
  }

  /**
   * Generate the final response based on reasoning and tool results
   */
  private async generateFinalResponse(
    input: UserInput,
    context: string,
    steps: AgentStep[],
    toolResults: ToolResult[]
  ): Promise<AgentResponse> {
    // Create a prompt for generating the final response
    const responsePrompt = this.createResponsePrompt(
      input,
      context,
      steps,
      toolResults
    );

    // Get response from LLM
    const responseContent = await this.llmService.generateResponse(
      responsePrompt
    );

    // Extract tools used from the tool results
    const toolsUsed = toolResults.map((result) => result.toolName);

    return {
      id: `response-${Date.now()}`,
      type: "text",
      content: responseContent,
      timestamp: new Date().toISOString(),
      steps,
      toolsUsed,
    };
  }

  /**
   * Create a prompt for the reasoning step
   */
  private createReasoningPrompt(
    input: UserInput,
    context: string,
    availableTools: Array<{
      name: string;
      description: string;
      parameters: any;
    }>
  ): string {
    return `
      You are an intelligent agent that can use tools to complete tasks. 
      You need to analyze the user's input and think through how to respond.

      USER INPUT: ${
        input.type === "text"
          ? input.content
          : "Image upload: " + input.imageDescription
      }

      CONVERSATION CONTEXT:
      ${context}

      AVAILABLE TOOLS:
      ${availableTools
        .map(
          (tool) =>
            `- ${tool.name}: ${tool.description}
        Parameters: ${JSON.stringify(tool.parameters, null, 2)}`
        )
        .join("\n\n")}

      Think through this step-by-step:
      1. Understand what the user is asking for
      2. Determine if any tools are needed to fulfill this request
      3. Plan out the steps needed to provide a complete response

      For each step, follow this format:
      STEP: [step number]
      THINKING: [your reasoning about what to do]
      ACTION: [either "USE TOOL" or "CONTINUE REASONING"]
      TOOL: [if ACTION is "USE TOOL", specify which tool to use]
      PARAMETERS: [if ACTION is "USE TOOL", specify the parameters for the tool]
      `;
  }

  /**
   * Create a prompt for the final response generation
   */
  private createResponsePrompt(
    input: UserInput,
    context: string,
    steps: AgentStep[],
    toolResults: ToolResult[]
  ): string {
    // Format the tool results for better LLM understanding
    const formattedToolResults = toolResults
      .map((result) => {
        let resultContent = "";

        if (typeof result.result === "object") {
          try {
            // Format the result object for better readability
            if (result.result.success !== undefined) {
              resultContent = `Success: ${result.result.success}\n`;

              if (result.result.data) {
                resultContent += `Data: ${JSON.stringify(
                  result.result.data,
                  null,
                  2
                )}\n`;
              }

              if (result.result.results) {
                resultContent += `Results: ${JSON.stringify(
                  result.result.results,
                  null,
                  2
                )}\n`;
              }

              if (result.result.message) {
                resultContent += `Message: ${result.result.message}\n`;
              }

              if (result.result.error) {
                resultContent += `Error: ${result.result.error}\n`;
              }
            } else {
              // If it doesn't follow the standard format, just stringify the whole object
              resultContent = JSON.stringify(result.result, null, 2);
            }
          } catch (error) {
            // Fallback if JSON stringification fails
            resultContent = `Complex object: ${Object.keys(result.result).join(
              ", "
            )}`;
          }
        } else {
          // For non-object results, use as-is
          resultContent = String(result.result);
        }

        return `${result.toolName}: ${result.successful ? "SUCCESS" : "FAILED"}
     Result: ${resultContent}`;
      })
      .join("\n\n");

    // Format the reasoning steps
    const formattedSteps = steps
      .map((step) => {
        let stepInfo = `STEP ${step.stepNumber}: ${step.reasoning}`;

        if (step.requiresTool) {
          stepInfo += `\n   Using tool: ${step.toolName}`;

          if (step.toolParameters) {
            try {
              stepInfo += `\n   Parameters: ${JSON.stringify(
                step.toolParameters,
                null,
                2
              )}`;
            } catch (error) {
              stepInfo += `\n   Parameters: (complex object)`;
            }
          }
        } else {
          stepInfo += "\n   No tool needed";
        }

        return stepInfo;
      })
      .join("\n\n");

    // Find any relevant tool result for the input type
    let specialHandlingInstructions = "";

    if (input.type === "image") {
      const imageAnalysisResults = toolResults.filter(
        (r) => r.toolName === "image_analyzer" && r.successful
      );

      if (imageAnalysisResults.length > 0) {
        specialHandlingInstructions = `
  The user uploaded an image. Use the image analysis results to provide a relevant response.
  The image description is: ${
    input.imageDescription || "No description available"
  }.`;
      }
    } else if (input.type === "file") {
      specialHandlingInstructions = `
  The user uploaded a file: ${input.fileName || "Unknown file"}.
  Consider this when formulating your response.`;
    }

    // Create the final prompt
    return `
  You are an intelligent agent that can use tools to complete tasks.
  You have analyzed the user's request and used tools to gather information.
  Now provide a helpful, natural-sounding response that incorporates the information from the tools.
  
  USER INPUT: ${
    input.type === "text"
      ? input.content
      : "Image upload: " + input.imageDescription
  }${specialHandlingInstructions}
  
  CONVERSATION CONTEXT:
  ${context}
  
  REASONING STEPS:
  ${formattedSteps}
  
  TOOL RESULTS:
  ${formattedToolResults}
  
  Provide a helpful response that:
  1. Addresses the user's original request
  2. Incorporates relevant information from the tool results
  3. Is conversational and natural-sounding
  4. Avoids explaining the internal reasoning process unless asked
  5. Presents information in a clear, organized manner when appropriate
  6. Acknowledges any limitations or errors encountered with the tools
  7. Provides next steps or follow-up options if relevant
  
  Your response should be comprehensive but focused on what's most relevant to the user's request.
  `;
  }

  /**
   * Parse the LLM's reasoning response into discrete agent steps
   */
  private parseReasoningSteps(reasoningResponse: string): AgentStep[] {
    const steps: AgentStep[] = [];

    // Extract step blocks using regex
    const stepPattern =
      /STEP:\s*(\d+)\s*\n+THINKING:\s*([\s\S]*?)\n+ACTION:\s*([\s\S]*?)(?:\n+|$)(?:TOOL:\s*([\s\S]*?)(?:\n+|$))?(?:PARAMETERS:\s*([\s\S]*?)(?:\n\n+|$))?/gi;

    let match;
    while ((match = stepPattern.exec(reasoningResponse)) !== null) {
      const stepNumber = parseInt(match[1], 10);
      const reasoning = match[2].trim();
      const action = match[3].trim();
      const requiresTool = action.toUpperCase() === "USE TOOL";
      const toolName = requiresTool && match[4] ? match[4].trim() : undefined;
      let toolParameters: Record<string, any> | undefined;

      // Parse tool parameters if available
      if (requiresTool && match[5]) {
        try {
          toolParameters = JSON.parse(match[5].trim());
        } catch (error) {
          // If parsing as JSON fails, try to parse as key-value pairs
          toolParameters = this.parseParametersFromText(match[5].trim());
        }
      }

      steps.push({
        stepNumber,
        reasoning,
        requiresTool,
        toolName,
        toolParameters,
      });
    }

    // If no steps were extracted, create a default step
    if (steps.length === 0) {
      // Check if the response contains any indication of tool use
      const hasToolMention =
        reasoningResponse.includes("USE TOOL") ||
        reasoningResponse.includes("TOOL:");

      if (hasToolMention) {
        // Try a more lenient parsing approach for malformed responses
        return this.fallbackParseReasoningSteps(reasoningResponse);
      }

      // Create a default reasoning step with no tool
      steps.push({
        stepNumber: 1,
        reasoning: reasoningResponse,
        requiresTool: false,
      });
    }

    return steps;
  }

  /**
   * Fallback parser for less structured reasoning responses
   */
  private fallbackParseReasoningSteps(reasoningResponse: string): AgentStep[] {
    const steps: AgentStep[] = [];

    // Split by "STEP" or double newlines
    const sections = reasoningResponse.split(/STEP:|\n\n+/).filter(Boolean);

    sections.forEach((section, index) => {
      // Extract tool information using more lenient patterns
      const toolMatch = section.match(/TOOL:\s*([\w_]+)/i);
      const hasUseTool = section.toLowerCase().includes("use tool");
      const requiresTool = toolMatch !== null || hasUseTool;

      // Extract parameters if available
      let toolParameters: Record<string, any> | undefined;
      const parametersMatch = section.match(
        /PARAMETERS:\s*([\s\S]*?)(?:\n\n+|$)/i
      );

      if (parametersMatch) {
        try {
          toolParameters = JSON.parse(parametersMatch[1].trim());
        } catch (error) {
          toolParameters = this.parseParametersFromText(
            parametersMatch[1].trim()
          );
        }
      }

      steps.push({
        stepNumber: index + 1,
        reasoning: section
          .replace(/THINKING:|ACTION:|TOOL:|PARAMETERS:|\n\n+/gi, " ")
          .trim(),
        requiresTool,
        toolName: toolMatch ? toolMatch[1].trim() : undefined,
        toolParameters,
      });
    });

    return steps;
  }

  /**
   * Parse key-value parameters from text when JSON parsing fails
   */
  private parseParametersFromText(text: string): Record<string, any> {
    const parameters: Record<string, any> = {};

    // Split by lines
    const lines = text.split("\n");

    lines.forEach((line) => {
      // Look for key-value patterns like "key: value" or "key = value"
      const match = line.match(/^[\s-]*([^:=]+)[:\s=]+(.+)$/);

      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();

        // Try to convert value to appropriate type
        if (value.toLowerCase() === "true") {
          parameters[key] = true;
        } else if (value.toLowerCase() === "false") {
          parameters[key] = false;
        } else if (!isNaN(Number(value))) {
          parameters[key] = Number(value);
        } else {
          // Remove quotes if present
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          parameters[key] = value;
        }
      }
    });

    return parameters;
  }
}
