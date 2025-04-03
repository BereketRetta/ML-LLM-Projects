// packages/api/src/services/llm/LLMService.ts

import axios from "axios";
import { ModelConfig } from "@toolcraft/shared";

/**
 * Service for interacting with Large Language Models
 */
export class LLMService {
  private apiKey: string;
  private apiBaseUrl: string;
  private defaultConfig: ModelConfig;

  constructor(apiKey: string, apiBaseUrl: string, defaultConfig: ModelConfig) {
    this.apiKey = apiKey;
    this.apiBaseUrl = apiBaseUrl;
    this.defaultConfig = defaultConfig;
  }

  /**
   * Generate text completion using the LLM
   */
  async generateText(
    prompt: string,
    config: Partial<ModelConfig> = {}
  ): Promise<string> {
    try {
      const mergedConfig = { ...this.defaultConfig, ...config };

      const response = await axios.post(
        `${this.apiBaseUrl}/responses`,
        {
          model: mergedConfig.modelName,
          input: prompt,
          // prompt,
          // max_tokens: mergedConfig.maxTokens,
          // temperature: mergedConfig.temperature,
          // top_p: mergedConfig.topP,
          // frequency_penalty: mergedConfig.frequencyPenalty,
          // presence_penalty: mergedConfig.presencePenalty,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      console.log("response >>> ",response.data.output[0].content[0].text)

      return response.data.output[0].content[0].text.trim();
    } catch (error) {
      console.error("Error generating text from LLM:", error);
      throw new Error(`Failed to generate text: ${error}`);
    }
  }

  /**
   * Generate chat completion for more interactive responses
   */
  async generateChatCompletion(
    messages: Array<{ role: string; content: string }>,
    config: Partial<ModelConfig> = {}
  ): Promise<string> {
    try {
      const mergedConfig = { ...this.defaultConfig, ...config };

      const response = await axios.post(
        `${this.apiBaseUrl}/responses`,
        {
          model: mergedConfig.modelName,
          messages,
          max_tokens: mergedConfig.maxTokens,
          temperature: mergedConfig.temperature,
          top_p: mergedConfig.topP,
          frequency_penalty: mergedConfig.frequencyPenalty,
          presence_penalty: mergedConfig.presencePenalty,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error("Error generating chat completion from LLM:", error);
      throw new Error(`Failed to generate chat completion: ${error}`);
    }
  }

  /**
   * Generate embeddings for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/embeddings`,
        {
          model: "text-embedding-3-small", // Use appropriate embedding model
          input: text,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.data[0].embedding;
    } catch (error) {
      console.error("Error generating embedding from LLM:", error);
      throw new Error(`Failed to generate embedding: ${error}`);
    }
  }

  /**
   * Generate reasoning steps using the LLM
   */
  async generateReasoning(prompt: string): Promise<string> {
    return this.generateText(prompt, {
      temperature: 0.7,
      maxTokens: 1500,
    });
  }

  /**
   * Generate final response using the LLM
   */
  async generateResponse(prompt: string): Promise<string> {
    return this.generateText(prompt, {
      temperature: 0.8,
      maxTokens: 1000,
    });
  }

  /**
   * Generate structured output using the LLM
   */
  async generateStructuredOutput<T>(
    prompt: string,
    schema: any,
    config: Partial<ModelConfig> = {}
  ): Promise<T> {
    const instruction = `
      Please provide a response in the following JSON schema format:
      ${JSON.stringify(schema, null, 2)}

      Your response should be valid JSON that conforms to this schema.
    `;

    const fullPrompt = `${instruction}\n\n${prompt}`;

    const response = await this.generateText(fullPrompt, {
      temperature: 0.2,
      ...config,
    });

    try {
      return JSON.parse(response);
    } catch (error) {
      console.error("Error parsing structured output:", error);
      throw new Error("Failed to generate valid structured output");
    }
  }
}
