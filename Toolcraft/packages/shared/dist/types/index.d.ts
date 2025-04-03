/**
 * Types of inputs the agent can process
 */
export type InputType = "text" | "image" | "file";
/**
 * User input to the agent
 */
export interface UserInput {
    id: string;
    type: InputType;
    content: string;
    timestamp: string;
    imageUrl?: string;
    imageDescription?: string;
    fileUrl?: string;
    fileType?: string;
    fileName?: string;
}
/**
 * A single step in the agent's reasoning process
 */
export interface AgentStep {
    stepNumber: number;
    reasoning: string;
    requiresTool: boolean;
    toolName?: string;
    toolParameters?: Record<string, any>;
}
/**
 * Result of a tool execution
 */
export interface ToolResult {
    toolName: string;
    successful: boolean;
    result: any;
    timestamp: string;
}
/**
 * Types of responses the agent can generate
 */
export type ResponseType = "text" | "image" | "error";
/**
 * Agent's response to the user
 */
export interface AgentResponse {
    id: string;
    type: ResponseType;
    content: string;
    timestamp: string;
    steps: AgentStep[];
    toolsUsed: string[];
    imageUrl?: string;
}
/**
 * Conversation between user and agent
 */
export interface Conversation {
    id: string;
    userId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messages: (UserInput | AgentResponse)[];
}
/**
 * Tool definition
 */
export interface Tool {
    name: string;
    description: string;
    parameters: Record<string, ToolParameter>;
    execute: (params: Record<string, any>) => Promise<any>;
}
/**
 * Tool parameter definition
 */
export interface ToolParameter {
    type: "string" | "number" | "boolean" | "array" | "object";
    description: string;
    required: boolean;
    enum?: any[];
    default?: any;
}
/**
 * Memory retrieval result
 */
export interface MemoryResult {
    content: string;
    relevanceScore: number;
    timestamp: string;
    sourceType: "conversation" | "document" | "system";
}
/**
 * Embedding vector type
 */
export type EmbeddingVector = number[];
/**
 * Model configuration
 */
export interface ModelConfig {
    modelName: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
}
