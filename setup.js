/**
 * Setup script for Claude MCP Data Explorer
 * This script configures the Claude Desktop application to use this MCP server.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Get the path to Claude Desktop configuration file
function getConfigPath() {
  if (process.platform === 'win32') {
    const appDataPath = process.env.APPDATA;
    if (!appDataPath) {
      console.error("APPDATA environment variable not found");
      return null;
    }
    return path.join(appDataPath, "Claude", "claude_desktop_config.json");
  } else if (process.platform === 'darwin') { // macOS
    return path.join(os.homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
  } else {
    console.error(`Unsupported platform: ${process.platform}`);
    return null;
  }
}

// Update Claude Desktop configuration
function updateClaudeConfig() {
  const configPath = getConfigPath();
  if (!configPath) {
    return false;
  }
  
  // Create directory if it doesn't exist
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // Load existing config or create a new one
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      const configData = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configData);
    } catch (error) {
      console.error(`Error reading config file: ${error}`);
    }
  }
  
  // Update or create mcpServers section
  if (!config.mcpServers) {
    config.mcpServers = {};
  }
  
  // Get the current directory path
  const currentDir = path.resolve(__dirname);
  
  // Add our server configuration
  config.mcpServers["claude-mcp-data-explorer"] = {
    "command": "npx",
    "args": [
      "ts-node",
      path.join(currentDir, "src", "index.ts")
    ]
  };
  
  // Write updated config back to file
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`Updated Claude Desktop config at ${configPath}`);
    return true;
  } catch (error) {
    console.error(`Error updating config file: ${error}`);
    return false;
  }
}

// Create necessary directories
function createDirectories() {
  // Create logs directory
  if (!fs.existsSync("logs")) {
    fs.mkdirSync("logs");
  }
  
  // Create data directory for sample data
  if (!fs.existsSync("data")) {
    fs.mkdirSync("data");
  }
}

// Main function
function main() {
  console.log("Starting Claude MCP Data Explorer setup...");
  
  // Check Node.js version
  const nodeVersion = process.versions.node.split('.').map(Number);
  if (nodeVersion[0] < 16) {
    console.error(`Node.js 16+ is required. Found Node.js ${process.versions.node}`);
    return false;
  }
  
  // Create necessary directories
  createDirectories();
  
  // Update Claude Desktop config
  if (!updateClaudeConfig()) {
    console.error("Failed to update Claude Desktop configuration");
    return false;
  }
  
  console.log("\n=================================================");
  console.log("Setup completed successfully!");
  console.log("Please complete these steps:");
  console.log("1. Install dependencies: npm install");
  console.log("2. Restart Claude Desktop app");
  console.log("3. In Claude Desktop, enable Developer Mode from Help menu");
  console.log("4. Check the MCP Log File for connection status");
  console.log("=================================================");
  
  return true;
}

// Run the main function
if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}
