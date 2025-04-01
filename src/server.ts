import express from "express";
import { config } from "dotenv";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import cors from "cors";

// Load environment variables
config();

const server = new McpServer({
  name: "mcp-sse-server",
  version: "1.0.0",
});

// Tool: Add two numbers
server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => {
  console.log("🧮 Running 'add' tool with a =", a, "b =", b);
  return {
    content: [{ type: "text", text: String(a + b) }],
  };
});

// Tool: Search using Brave API
server.tool(
  "search",
  { query: z.string(), count: z.number().optional() },
  async ({ query, count = 5 }: { query: string; count?: number }) => {
    console.log("🌐 Running 'search' tool for query:", query);

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

// Resource: Dynamic greeting
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [
      {
        uri: uri.href,
        text: `Hello, ${name}!`,
      },
    ],
  })
);

const app = express();
app.use(express.json());

// CORS middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: false,
  })
);

// Root status route
app.get("/", (req, res) => {
  res.json({
    name: "MCP SSE Server",
    version: "1.0.0",
    status: "running",
    endpoints: {
      "/": "Server status",
      "/sse": "Server-Sent Events stream",
      "/messages": "POST endpoint for tool messages",
    },
    tools: Object.keys(server.describe()),
  });
});

let transport: SSEServerTransport;

// Handle n8n probing /messages
app.get("/messages", (req, res) => {
  console.log("👋 GET /messages — n8n probe");
  res.status(200).send("OK");
});

// POST endpoint for tool execution
app.post("/messages", async (req, res) => {
  console.log("📨 POST /messages called");
  console.log("🧾 Body:", JSON.stringify(req.body, null, 2));
  await transport.handlePostMessage(req, res);
  console.log("✅ Message handled");
});

// SSE stream
app.get("/sse", async (req, res) => {
  console.log("🔌 GET /sse — stream requested");

  transport = new SSEServerTransport("/messages", res);

  try {
    await server.connect(transport);
