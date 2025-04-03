// packages/api/src/services/vision/VisionService.ts

import axios from "axios";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { ModelConfig } from "@toolcraft/shared";

const readFileAsync = promisify(fs.readFile);

/**
 * Service for processing images using vision models
**/
export class VisionService {
  private apiKey: string;
  private apiBaseUrl: string;
  private defaultConfig: ModelConfig;

  constructor(apiKey: string, apiBaseUrl: string, defaultConfig: ModelConfig) {
    this.apiKey = apiKey;
    this.apiBaseUrl = apiBaseUrl;
    this.defaultConfig = defaultConfig;
  }

  /**
   * Generate a description of an image
   */
  async generateImageDescription(
    imagePathOrUrl: string,
    prompt: string = "Describe this image in detail.",
    config: Partial<ModelConfig> = {}
  ): Promise<string> {
    try {
      const mergedConfig = { ...this.defaultConfig, ...config };
      let imageData: string;

      // Handle local file paths and remote URLs differently
      if (imagePathOrUrl.startsWith("http")) {
        // For remote URLs, just pass the URL
        imageData = imagePathOrUrl;
      } else {
        // For local files, read and convert to base64
        const imageBuffer = await readFileAsync(imagePathOrUrl);
        const base64Image = imageBuffer.toString("base64");
        const mimeType = this.getMimeTypeFromPath(imagePathOrUrl);
        imageData = `data:${mimeType};base64,${base64Image}`;
      }

      const response = await axios.post(
        `${this.apiBaseUrl}/responses`,
        {
          model: "gpt-4o-mini", // Use appropriate vision model
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: imageData,
                    detail: "high",
                  },
                },
              ],
            },
          ],
          max_tokens: mergedConfig.maxTokens,
          temperature: mergedConfig.temperature,
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
      console.error("Error generating image description:", error);
      throw new Error(`Failed to generate image description: ${error}`);
    }
  }

  /**
   * Extract text from an image (OCR)
   */
  async extractTextFromImage(
    imagePathOrUrl: string,
    config: Partial<ModelConfig> = {}
  ): Promise<string> {
    return this.generateImageDescription(
      imagePathOrUrl,
      "Extract and return all visible text from this image. Format it preserving the layout as much as possible.",
      config
    );
  }

  /**
   * Analyze a screenshot and extract UI elements
   */
  async analyzeScreenshot(
    imagePathOrUrl: string,
    config: Partial<ModelConfig> = {}
  ): Promise<any> {
    const description = await this.generateImageDescription(
      imagePathOrUrl,
      `Analyze this screenshot in detail. Identify and describe:
        1. The type of application or website
        2. Key UI elements (buttons, forms, navigation)
        3. The content and purpose of the screen
        4. Any visible data or information

        Return the results as structured JSON with these categories.`,
      { ...config, temperature: 0.2 }
    );

    try {
      // Attempt to parse the response as JSON
      return JSON.parse(description);
    } catch (error) {
      // If parsing fails, return the text description
      console.warn(
        "Could not parse screenshot analysis as JSON, returning text"
      );
      return { description };
    }
  }

  /**
   * Identify objects in an image
   */
  async identifyObjects(
    imagePathOrUrl: string,
    config: Partial<ModelConfig> = {}
  ): Promise<string[]> {
    const description = await this.generateImageDescription(
      imagePathOrUrl,
      "List all distinguishable objects in this image. Return only a comma-separated list of objects, nothing else.",
      config
    );

    return description
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  /**
   * Get the MIME type based on file extension
   */
  private getMimeTypeFromPath(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();

    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".bmp": "image/bmp",
      ".svg": "image/svg+xml",
    };

    return mimeTypes[extension] || "application/octet-stream";
  }
}
