// packages/api/src/services/tools/implementations/ImageAnalyzerTool.ts

import { Tool } from "@toolcraft/shared";
import { VisionService } from "../../vision/VisionService";

export class ImageAnalyzerTool implements Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  private visionService: VisionService;

  constructor(visionService: VisionService) {
    this.name = "image_analyzer";
    this.description =
      "Analyze an image to extract information, identify objects, or read text";
    this.parameters = {
      image_url: {
        type: "string",
        description: "URL or path to the image to analyze",
        required: true,
      },
      analysis_type: {
        type: "string",
        description: "Type of analysis to perform on the image",
        required: true,
        enum: ["describe", "extract_text", "identify_objects", "analyze_ui"],
      },
    };
    this.visionService = visionService;
  }

  async execute(parameters: Record<string, any>): Promise<any> {
    const imageUrl = parameters.image_url;
    const analysisType = parameters.analysis_type;

    try {
      let result;

      switch (analysisType) {
        case "describe":
          result = await this.visionService.generateImageDescription(imageUrl);
          return {
            success: true,
            description: result,
            message: "Image described successfully",
          };

        case "extract_text":
          result = await this.visionService.extractTextFromImage(imageUrl);
          return {
            success: true,
            text: result,
            message: result
              ? "Text extracted successfully"
              : "No text found in the image",
          };

        case "identify_objects":
          result = await this.visionService.identifyObjects(imageUrl);
          return {
            success: true,
            objects: result,
            count: result.length,
            message: `Identified ${result.length} objects in the image`,
          };

        case "analyze_ui":
          result = await this.visionService.analyzeScreenshot(imageUrl);
          return {
            success: true,
            analysis: result,
            message: "UI analysis completed successfully",
          };

        default:
          return {
            success: false,
            error: "Invalid analysis type",
            message: `Analysis type "${analysisType}" is not supported`,
          };
      }
    } catch (error) {
      console.error("Error executing image analyzer tool:", error);

      return {
        success: false,
        error: error,
        message: `Failed to analyze image: "${error}"`,
      };
    }
  }
}
