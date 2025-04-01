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
server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
  content: [{ type: "text", text: String(a + b) }],
}));

// Tool: Search via Brave API
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

// CORS middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: false,
  })
);

// Root info route
app.get("/", (req, res) => {
  res.json({
    name: "MCP SSE Server",
    version: "1.0.0",
    status: "running",
    endpoints: {
      "/": "Server information (this response)",
      "/sse": "Server-Sent Events endpoint for MCP connection",
      "/messages": "POST endpoint for MCP messages",
    },
    tools: [
      { name: "add", description: "Add two numbers together" },
      { name: "search", description: "Search the web using Brave Search API" },
    ],
  });
});

let transport: SSEServerTransport;

// ✅ Let n8n probe /messages if it tries a GET
app.get("/messages", (req, res) => {
  res.status(200).send("OK");
});

// ✅ Tool message receiver
app.post("/messages", async (req, res) => {
  await transport.handlePostMessage(req, res);
});

// ✅ SSE stream with proper endpoint announcement
app.get("/sse", async (req, res) => {
  // 👇 Let the SDK handle headers
  transport = new SSEServerTransport("/messages", res);

  // 👇 This will internally call res.write with event: endpoint
  await server.connect(transport);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ MCP SSE Server running on port ${PORT}`);
});
