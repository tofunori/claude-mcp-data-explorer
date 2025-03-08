import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as fs from 'fs-extra';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { loadCsv } from './tools/data-loader.js';
import { runScript } from './tools/script-runner.js';
import { getExploreDataPrompt } from './prompts.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create logs directory for storing MCP server logs
const logsDir = path.join(__dirname, '..', 'logs');
fs.ensureDirSync(logsDir);

// Configure logging
const logFile = path.join(logsDir, `server_${new Date().toISOString().replace(/:/g, '-')}.log`);
const logger = fs.createWriteStream(logFile, { flags: 'a' });

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}`;
  console.error(logMessage); // Use stderr for server logs to avoid interfering with protocol communication
  logger.write(logMessage + '\n');
}

// Initialize MCP server
const server = new McpServer({
  name: "claude-mcp-data-explorer",
  version: "0.1.0",
});

log('Server initialization started');

// Register tools
server.registerTool({
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
  },
  handler: async (args) => {
    log(`Executing load-csv with args: ${JSON.stringify(args)}`);
    try {
      const result = await loadCsv(args);
      return result;
    } catch (error) {
      log(`Error executing load-csv: ${error}`);
      return [{ type: 'text', text: `Error: ${error}` }];
    }
  }
});

server.registerTool({
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
  },
  handler: async (args) => {
    log(`Executing run-script with args: ${JSON.stringify({...args, script: args.script?.substring(0, 100) + '...'})}`);
    try {
      const result = await runScript(args);
      return result;
    } catch (error) {
      log(`Error executing run-script: ${error}`);
      return [{ type: 'text', text: `Error: ${error}` }];
    }
  }
});

// Register prompts
server.registerPrompt(getExploreDataPrompt());

// Start the server
async function main() {
  log('Starting server with stdio transport');
  
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
    await server.listen(transport);
    log('Server started successfully');
  } catch (error) {
    log(`Server error: ${error}`);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('Received SIGINT, shutting down');
  logger.end();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down');
  logger.end();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error}`);
  logger.end();
  process.exit(1);
});

// Start the server
main().catch((error) => {
  log(`Error starting server: ${error}`);
  process.exit(1);
});
