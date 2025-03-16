import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { z } from "zod";
import { config } from "dotenv";
import cors from "cors";

// Load environment variables
config();

const server = new McpServer({
  name: "Brave Search Server",
  version: "1.0.0",
});

// Add an addition tool
server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
  content: [{ type: "text", text: String(a + b) }],
}));

server.tool(
  "search",
  { query: z.string(), count: z.number().optional() },
  async ({ query, count = 5 }: { query: string; count?: number }) => {
    console.log("query==========>", query, count, process.env.BRAVE_API_KEY);
    if (!process.env.BRAVE_API_KEY) {
      throw new Error("BRAVE_API_KEY environment variable is not set");
    }

    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
        query
      )}&count=${count}`,
      {
        headers: {
          "X-Subscription-Token": process.env.BRAVE_API_KEY,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Brave search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data.web?.results || [], null, 2),
        },
      ],
    };
  }
);

// TODO: Add prompts

const app = express();

// Apply middlewares - ensure CORS is completely open
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: "*",
    credentials: true,
  })
);
app.use(express.json());

// Define a type-safe Map for transports
const transports = new Map<string, SSEServerTransport>();

// Root route handler
app.get("/", (req, res) => {
  res.json({
    status: "online",
    name: "MCP SSE Example Server",
    endpoints: {
      sse: "/sse",
      messages: "/messages",
      test: "/test",
    },
    docs: "https://modelcontextprotocol.io/docs",
  });
});

// Simple test page to verify server is working
app.get("/test", (req, res) => {
  // Get the PORT variable from the current scope
  const currentPort = process.env.PORT || 8080;

  res.setHeader("Content-Type", "text/html");
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>MCP SSE Server Test</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .success { color: green; }
        .box { border: 1px solid #ccc; padding: 15px; margin: 15px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1>MCP SSE Server Test Page</h1>
      <div class="box success">
        <h2>✅ Server is running correctly!</h2>
        <p>If you can see this page, the server is working and CORS is properly configured.</p>
      </div>
      <div class="box">
        <h2>Server Information</h2>
        <ul>
          <li><strong>Name:</strong> Brave Search Server</li>
          <li><strong>Version:</strong> 1.0.0</li>
          <li><strong>Port:</strong> ${currentPort}</li>
          <li><strong>CORS:</strong> Fully open (allowing all origins)</li>
        </ul>
      </div>
      <div class="box">
        <h2>Available Endpoints</h2>
        <ul>
          <li><strong>/</strong> - Server info (JSON)</li>
          <li><strong>/test</strong> - This test page</li>
          <li><strong>/debug</strong> - Debug information</li>
          <li><strong>/sse</strong> - SSE connection endpoint</li>
          <li><strong>/messages</strong> - Messages endpoint</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

let transport: SSEServerTransport;

app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  // Note: to support multiple simultaneous connections, these messages will
  // need to be routed to a specific matching transport. (This logic isn't
  // implemented here, for simplicity.)
  await transport.handlePostMessage(req, res);
});

app.listen(3001);
