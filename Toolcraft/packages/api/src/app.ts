// packages/api/src/app.ts

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import path from "path";
import { ChromaClient } from "chromadb";

// Import services
import { AgentService } from "./services/agent/AgentService";
import { LLMService } from "./services/llm/LLMService";
import { VisionService } from "./services/vision/VisionService";
import { MemoryService } from "./services/memory/MemoryService";
import { ToolRegistry } from "./services/tools/ToolRegistry";

// Import tools
import { WebSearchTool } from "./services/tools/implementations/WebSearchTool";
import { WeatherTool } from "./services/tools/implementations/WeatherTool";
import { CalculatorTool } from "./services/tools/implementations/CalculatorTool";
import { ImageAnalyzerTool } from "./services/tools/implementations/ImageAnalyzerTool";

// Import routes
import agentRoutes from "./routes/agent";
import conversationRoutes from "./routes/conversation";
import toolRoutes from "./routes/tool";
import userRoutes from "./routes/user";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

// Apply middleware
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Set up uploads directory for file storage
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Initialize services
const initializeServices = async () => {
  try {
    // Initialize LLM service
    const llmService = new LLMService(
      process.env.OPENAI_API_KEY || "",
      process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
      {
        modelName: process.env.LLM_MODEL_NAME || "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 1000,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
      }
    );

    // Initialize Vision service
    const visionService = new VisionService(
      process.env.OPENAI_API_KEY || "",
      process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
      {
        modelName: "gpt-4-vision-preview",
        temperature: 0.7,
        maxTokens: 1000,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
      }
    );

    // Initialize ChromaDB client
    const chromaClient = new ChromaClient({
      path: process.env.CHROMA_DB_URL || "http://localhost:8000",
    });

    // Create or get collection
    const collection = await chromaClient.getOrCreateCollection({
      name: "toolcraft_memory",
      metadata: {
        description: "Toolcraft agent memory storage",
      },
    });

    // Initialize Memory service
    const memoryService = new MemoryService(llmService, collection, 10000);

    // Initialize Tool Registry
    const toolRegistry = new ToolRegistry();

    // Register available tools
    toolRegistry.registerTool(new CalculatorTool());

    // Register tools that require API keys only if they are configured
    if (
      process.env.GOOGLE_SEARCH_API_KEY &&
      process.env.GOOGLE_SEARCH_ENGINE_ID
    ) {
      toolRegistry.registerTool(
        new WebSearchTool(
          process.env.GOOGLE_SEARCH_API_KEY,
          process.env.GOOGLE_SEARCH_ENGINE_ID
        )
      );
    }

    if (process.env.WEATHER_API_KEY) {
      toolRegistry.registerTool(new WeatherTool(process.env.WEATHER_API_KEY));
    }

    // Register image analyzer tool
    toolRegistry.registerTool(new ImageAnalyzerTool(visionService));

    // Initialize Agent service
    const agentService = new AgentService(
      llmService,
      memoryService,
      toolRegistry,
      visionService
    );

    // Add services to app for route handlers to access
    app.locals.services = {
      agentService,
      llmService,
      visionService,
      memoryService,
      toolRegistry,
    };

    console.log("Services initialized successfully");
  } catch (error) {
    console.error("Error initializing services:", error);
    process.exit(1);
  }
};

// Set up socket.io connection handler
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });

  // Handle messages from client
  socket.on("message", (data) => {
    // Process message and send response
    // This will be implemented later
  });
});

// Set up routes
app.use("/api/agent", agentRoutes);
app.use("/api/conversation", conversationRoutes);
app.use("/api/tool", toolRoutes);
app.use("/api/user", userRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      error: {
        message: err.message || "Something went wrong",
        status: err.status || 500,
      },
    });
  }
);

// Start the server
const PORT = process.env.PORT || 3001;

// Initialize services before starting the server
initializeServices()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize services:", error);
    process.exit(1);
  });

export default app;
