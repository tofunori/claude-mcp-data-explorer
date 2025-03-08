import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { loadCsv } from './tools/data-loader.js';
import { runScript } from './tools/script-runner.js';
import { getExploreDataPrompt } from './prompts.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode, 
  McpError,
  ListPromptsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create logs directory for storing MCP server logs
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configure logging
const logFile = path.join(logsDir, `server_${new Date().toISOString().replace(/:/g, '-')}.log`);

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}`;
  console.error(logMessage); // Use stderr for server logs to avoid interfering with protocol communication
  fs.appendFileSync(logFile, logMessage + '\n');
}

async function main() {
  // Initialize MCP server
  const server = new Server({
    name: "claude-mcp-data-explorer",
    version: "0.1.0",
  }, {
    capabilities: {
      tools: {},
      prompts: {}
    }
  });
  
  log('Server initialization started');

  // Register list tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [{
        name: "load-csv",
        description: "Load a CSV file into a DataFrame for analysis",
        inputSchema: {
          type: "object",
          properties: {
            csv_path: {
              type: "string",
              description: "Path to the CSV file to load"
            },
            df_name: {
              type: "string",
              description: "Name for the DataFrame (optional, defaults to df_1, df_2, etc.)"
            }
          },
          required: ["csv_path"]
        }
      },
      {
        name: "run-script",
        description: "Execute a JavaScript script for data analysis and visualization",
        inputSchema: {
          type: "object",
          properties: {
            script: {
              type: "string",
              description: "JavaScript script to execute"
            }
          },
          required: ["script"]
        }
      }]
    };
  });

  // Register tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    log(`Executing tool: ${request.params.name}`);
    
    if (request.params.name === "load-csv") {
      try {
        const args = request.params.arguments as any;
        const result = await loadCsv(args);
        return { content: result };
      } catch (error) {
        log(`Error executing load-csv: ${error}`);
        throw new McpError(ErrorCode.InternalError, `Error: ${error}`);
      }
    }
    
    if (request.params.name === "run-script") {
      try {
        const args = request.params.arguments as any;
        const result = await runScript(args);
        return { content: result };
      } catch (error) {
        log(`Error executing run-script: ${error}`);
        throw new McpError(ErrorCode.InternalError, `Error: ${error}`);
      }
    }
    
    throw new McpError(ErrorCode.MethodNotFound, "Tool not found");
  });

  // Register list prompts handler
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [getExploreDataPrompt()]
    };
  });

  try {
    // On Windows, make sure we set the correct mode for stdin/stdout
    if (process.platform === 'win32') {
      try {
        // This is a Windows-specific workaround for binary stdin/stdout
        process.stdin.setEncoding('utf8');
        process.stdout.setDefaultEncoding('utf8');
      } catch (error) {
        log(`Error setting encoding: ${error}`);
      }
    }
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    log('Server started successfully');
  } catch (error) {
    log(`Server error: ${error}`);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('Received SIGINT, shutting down');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error}`);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  log(`Error starting server: ${error}`);
  process.exit(1);
});
