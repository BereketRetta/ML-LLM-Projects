// packages/api/src/services/memory/MemoryService.ts

import { Collection } from "chromadb";
import { LLMService } from "../llm/LLMService";
import {
  UserInput,
  AgentResponse,
  MemoryResult,
  EmbeddingVector,
} from "@toolcraft/shared";

/**
 * Service for managing conversation memory and context
 */
export class MemoryService {
  private llmService: LLMService;
  private vectorStore: Collection;
  private maxContextLength: number;

  constructor(
    llmService: LLMService,
    vectorStore: Collection,
    maxContextLength: number = 10000
  ) {
    this.llmService = llmService;
    this.vectorStore = vectorStore;
    this.maxContextLength = maxContextLength;
  }

  /**
   * Store a user input in memory
   */
  async storeUserInput(
    userId: string,
    conversationId: string,
    input: UserInput
  ): Promise<void> {
    try {
      // Create a text representation of the input
      let textRepresentation: string;

      if (input.type === "text") {
        textRepresentation = input.content;
      } else if (input.type === "image") {
        textRepresentation = `[Image: ${
          input.imageDescription || "No description available"
        }]`;
      } else if (input.type === "file") {
        textRepresentation = `[File: ${input.fileName || "Unknown file"}]`;
      } else {
        textRepresentation = `[Unknown input type: ${input.type}]`;
      }

      // Generate embedding for the text
      const embedding = await this.llmService.generateEmbedding(
        textRepresentation
      );

      // Store in vector database
      await this.vectorStore.add({
        ids: [input.id],
        embeddings: [embedding],
        metadatas: [
          {
            userId,
            conversationId,
            timestamp: input.timestamp,
            type: "user_input",
            inputType: input.type,
          },
        ],
        documents: [textRepresentation],
      });

      console.log(`Stored user input ${input.id} in memory`);
    } catch (error) {
      console.error("Error storing user input in memory:", error);
      throw new Error(`Failed to store user input: ${error}`);
    }
  }

  /**
   * Store an agent response in memory
   */
  async storeAgentResponse(
    userId: string,
    conversationId: string,
    response: AgentResponse
  ): Promise<void> {
    try {
      // Create a text representation of the response
      let textRepresentation: string;

      if (response.type === "text") {
        textRepresentation = response.content;
      } else if (response.type === "image") {
        textRepresentation = `[Generated image: ${response.content}]`;
      } else {
        textRepresentation = `[${response.type}: ${response.content}]`;
      }

      // Add information about tools used
      if (response.toolsUsed && response.toolsUsed.length > 0) {
        textRepresentation += `\n[Tools used: ${response.toolsUsed.join(
          ", "
        )}]`;
      }

      // Generate embedding for the text
      const embedding = await this.llmService.generateEmbedding(
        textRepresentation
      );

      // Store in vector database
      await this.vectorStore.add({
        ids: [response.id],
        embeddings: [embedding],
        metadatas: [
          {
            userId,
            conversationId,
            timestamp: response.timestamp,
            type: "agent_response",
            responseType: response.type,
          },
        ],
        documents: [textRepresentation],
      });

      console.log(`Stored agent response ${response.id} in memory`);
    } catch (error) {
      console.error("Error storing agent response in memory:", error);
      throw new Error(`Failed to store agent response: ${error}`);
    }
  }

  /**
   * Retrieve relevant context for a user input
   */
  async retrieveRelevantContext(
    userId: string,
    conversationId: string,
    input: UserInput,
    maxResults: number = 5
  ): Promise<string> {
    try {
      let query: string;

      if (input.type === "text") {
        query = input.content;
      } else if (input.type === "image") {
        query = input.imageDescription || "image";
      } else {
        query = input.fileName || "file";
      }

      // Generate embedding for the query
      const queryEmbedding = await this.llmService.generateEmbedding(query);

      // Query vector database for relevant memories
      const results: any = await this.vectorStore.query({
        queryEmbeddings: [queryEmbedding],
        nResults: maxResults,
        where: {
          userId,
          // conversationId,
        },
      });

      // Extract and format the results
      const memories: MemoryResult[] = [];

      if (results.ids[0] && results.documents[0] && results.metadatas[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          memories.push({
            content: results.documents[0][i],
            relevanceScore: results.distances?.[0]?.[i] ?? 1.0,
            timestamp: results.metadatas[0][i].timestamp,
            sourceType: "conversation",
          });
        }
      }

      // Get the recent conversation history
      const recentHistory = await this.getRecentConversationHistory(
        userId,
        conversationId
      );

      console.log(
        "FFFFFF>>>>>>>>",
        this.formatContext(memories, recentHistory)
      );

      // Combine and format the context
      return this.formatContext(memories, recentHistory);
    } catch (error) {
      console.error("Error retrieving context from memory:", error);
      // Return minimal context in case of error
      return "No previous context available.";
    }
  }

  /**
   * Get recent conversation history
   */
  private async getRecentConversationHistory(
    userId: string,
    conversationId: string,
    limit: number = 10
  ): Promise<string> {
    try {
      const results = await this.vectorStore.get({
        where: {
          userId,
          // conversationId,
        },
        limit,
      });

      // Sort by timestamp
      const messages: any = results.metadatas
        .map((metadata: any, index) => ({
          content: results.documents[index],
          timestamp: metadata.timestamp,
          type: metadata.type,
        }))
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

      // Format as conversation
      return messages
        .map(
          (message: any) =>
            `${message.type === "user_input" ? "User" : "Assistant"}: ${
              message.content
            }`
        )
        .join("\n\n");
    } catch (error) {
      console.error("Error retrieving conversation history:", error);
      return "";
    }
  }

  /**
   * Format the retrieved context into a string
   */
  private formatContext(
    relevantMemories: MemoryResult[],
    recentHistory: string
  ): string {
    let formattedContext = "";

    if (recentHistory) {
      formattedContext += `## Recent Conversation\n${recentHistory}\n\n`;
    }

    if (relevantMemories.length > 0) {
      formattedContext += "## Relevant Information\n";

      for (const memory of relevantMemories) {
        formattedContext += `- ${memory.content}\n`;
      }
    }

    // Trim if too long
    if (formattedContext.length > this.maxContextLength) {
      formattedContext =
        formattedContext.substring(0, this.maxContextLength) +
        "... [Context truncated due to length]";
    }

    return formattedContext.trim();
  }

  /**
   * Store a document in memory
   */
  async storeDocument(
    userId: string,
    documentId: string,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Split document into chunks if needed
      const chunks = this.splitDocumentIntoChunks(content);

      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = `${documentId}-chunk-${i}`;

        // Generate embedding for the chunk
        const embedding = await this.llmService.generateEmbedding(chunks[i]);

        // Store in vector database
        await this.vectorStore.add({
          ids: [chunkId],
          embeddings: [embedding],
          metadatas: [
            {
              userId,
              documentId,
              chunkIndex: i,
              timestamp: new Date().toISOString(),
              type: "document",
              ...metadata,
            },
          ],
          documents: [chunks[i]],
        });
      }

      console.log(
        `Stored document ${documentId} in memory (${chunks.length} chunks)`
      );
    } catch (error) {
      console.error("Error storing document in memory:", error);
      throw new Error(`Failed to store document: ${error}`);
    }
  }

  /**
   * Split a document into manageable chunks
   */
  private splitDocumentIntoChunks(
    content: string,
    maxChunkSize: number = 1000,
    overlap: number = 100
  ): string[] {
    const words = content.split(/\s+/);
    const chunks: string[] = [];

    let currentChunk: string[] = [];
    let currentSize = 0;

    for (const word of words) {
      currentChunk.push(word);
      currentSize++;

      if (currentSize >= maxChunkSize) {
        chunks.push(currentChunk.join(" "));

        // Create overlap by keeping some words from the end
        const overlapWords = currentChunk.slice(-overlap);
        currentChunk = [...overlapWords];
        currentSize = overlapWords.length;
      }
    }

    // Add the last chunk if there's anything left
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(" "));
    }

    return chunks;
  }

  /**
   * Clear memory for a specific conversation
   */
  async clearConversationMemory(
    userId: string,
    conversationId: string
  ): Promise<void> {
    try {
      await this.vectorStore.delete({
        where: {
          userId,
          conversationId,
        },
      });

      console.log(`Cleared memory for conversation ${conversationId}`);
    } catch (error) {
      console.error("Error clearing conversation memory:", error);
      throw new Error(`Failed to clear conversation memory: ${error}`);
    }
  }

  /**
   * Clear all memory for a user
   */
  async clearUserMemory(userId: string): Promise<void> {
    try {
      await this.vectorStore.delete({
        where: {
          userId,
        },
      });

      console.log(`Cleared all memory for user ${userId}`);
    } catch (error) {
      console.error("Error clearing user memory:", error);
      throw new Error(`Failed to clear user memory: ${error}`);
    }
  }

  /**
   * Summarize conversation history
   */
  async summarizeConversation(
    userId: string,
    conversationId: string
  ): Promise<string> {
    try {
      // Get conversation history
      const conversationHistory = await this.getRecentConversationHistory(
        userId,
        conversationId,
        100 // Get a larger number of messages for summarization
      );

      if (!conversationHistory) {
        return "No conversation to summarize.";
      }

      // Generate summary using LLM
      const summaryPrompt = `
        Please provide a concise summary of the following conversation.
        Focus on the main topics discussed, key information shared, and any decisions made.

        CONVERSATION:
        ${conversationHistory}

        SUMMARY:`;

      const summary = await this.llmService.generateText(summaryPrompt, {
        temperature: 0.3,
        maxTokens: 500,
      });

      return summary;
    } catch (error) {
      console.error("Error summarizing conversation:", error);
      return "Unable to generate conversation summary.";
    }
  }
}
