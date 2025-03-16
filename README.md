<think>I need to write a README for this codebase, which focuses on using MCP (Model Context Protocol) in WebAI. I have information about the project structure from project-structure.md and various search results about MCP frameworks and servers.

Based on the provided information:

1. The project structure has frontend (with public, src, assets, components) and src directories
2. MCP (Model Context Protocol) seems to be a protocol for AI clients (like Claude Desktop)
3. This specific project is about integrating MCP with WebAI

From the web search results, I understand that:

- MCP is a protocol used by Claude (Anthropic) and other AI models
- MCP servers can be used to extend AI capabilities
- There are frameworks like mcp-framework to build MCP servers
- MCP servers can provide tools to AI clients

I'll write a comprehensive README that:

1. Explains what MCP-WebAI is
2. Details the project structure
3. Provides setup instructions
4. Explains how to use the project
5. Includes configuration information
6. Adds relevant links and resources</think># MCP-WebAI

A framework for integrating Model Context Protocol (MCP) capabilities into web applications, allowing web-based AI interfaces to leverage MCP tools and services.

## Overview

MCP-WebAI bridges the gap between web applications and the Model Context Protocol ecosystem. It enables web-based AI interfaces to use the same powerful tooling capabilities available to desktop MCP clients like Claude Desktop, but within your browser.

Key features:

- Run MCP tools directly in web applications
- Connect to existing MCP servers from web interfaces
- Build web UIs that seamlessly integrate with AI tooling
- Extend AI models with web-based capabilities

## Project Structure

```
.
├── frontend            # Web interface components
│   ├── public          # Static assets
│   └── src             # Frontend source code
│       ├── assets      # Images, styles, and other assets
│       └── components  # React/UI components
├── instructions        # Documentation and guides
└── src                 # Server-side MCP implementation
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- NPM or Yarn
- An MCP-compatible AI service (Claude API, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/iamfiscus/mcp-webai.git
cd mcp-webai

# Install dependencies
npm install

# Build the project
npm run build
```

### Configuration

Create a `.env` file in the root directory with your API credentials:

```
ANTHROPIC_API_KEY=your_api_key_here
MCP_SERVER_PORT=3000
```

## Usage

### Starting the Server

```bash
npm run start
```

This will start both the MCP server and the web interface. The web UI will be available at `http://localhost:3000` by default.

### Starting Only the Backend

To launch just the backend MCP server without the frontend:

```bash
npm run start:backend
```

Or alternatively:

```bash
cd src
node server.js
```

The backend server will be available at `http://localhost:3000/api` by default.

### Connecting to Existing MCP Servers

MCP-WebAI can connect to any existing MCP server. In your web application's configuration, specify the MCP server details:

```javascript
const mcpConfig = {
  server: "http://localhost:8000", // Your MCP server address
  tools: ["web_search", "code_execution"] // Tools to enable
};
```

### Creating Web-Based MCP Tools

You can create custom MCP tools that run in the browser:

1. Create a new tool in the `src/tools` directory
2. Implement the tool interface
3. Register it with the MCP server

Example:

```javascript
// src/tools/WebSearchTool.js
export default class WebSearchTool {
  name = "web_search";
  description = "Search the web for information";
  
  async execute(params) {
    const { query } = params;
    // Implementation logic
    return { results: [...] };
  }
}
```

## Web Integration Examples

MCP-WebAI provides components to integrate MCP capabilities into your web UI:

```jsx
import { MCPProvider, useMCPTool } from 'mcp-webai';

function SearchComponent() {
  const { execute, loading, results } = useMCPTool('web_search');
  
  const handleSearch = async (query) => {
    const results = await execute({ query });
    // Handle results
  };
  
  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      {loading && <p>Searching...</p>}
      {results && results.map(item => <div>{item.title}</div>)}
    </div>
  );
}
```

## Contribution

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Related Resources

- [Model Context Protocol](https://modelcontextprotocol.io/) - Official MCP website with documentation and guides
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Official TypeScript implementation of the protocol
