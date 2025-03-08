# Claude MCP Data Explorer for Windows

A TypeScript implementation of a Model Context Protocol (MCP) server for data exploration with Claude. This server integrates with Claude Desktop and enables advanced data analysis by providing tools to load CSV files and execute JavaScript data analysis scripts.

## Prerequisites

- Node.js v16+ - [Download Node.js](https://nodejs.org/)
- Claude Desktop - [Download Claude Desktop](https://claude.ai/download)

## Installation

1. **Clone this repository**
   ```cmd
   git clone https://github.com/tofunori/claude-mcp-data-explorer.git
   cd claude-mcp-data-explorer
   ```

2. **Install dependencies**
   ```cmd
   npm install
   ```

3. **Run setup script**
   ```cmd
   node setup.js
   ```

4. **Restart Claude Desktop and enable Developer Mode**
   - Open Claude Desktop
   - Go to Help → Enable Developer Mode
   - Restart Claude Desktop

## Fixing TypeScript ESM Issues (Important!)

If you encounter errors like `Unknown file extension ".ts"`, follow these steps:

1. **Run the server with the ESM flag**:
   ```cmd
   npx ts-node --esm src/index.ts
   ```

2. **Verify server configuration in Claude Desktop**:
   - Check configuration file at `%APPDATA%\Claude\claude_desktop_config.json`
   - Ensure the configuration includes the `--esm` flag:
   ```json
   "claude-mcp-data-explorer": {
     "command": "npx",
     "args": [
       "ts-node",
       "--esm",
       "C:\\Users\\yourusername\\claude-mcp-data-explorer\\src\\index.ts"
     ]
   }
   ```

3. **Alternatively, build the project and use JavaScript**:
   ```cmd
   npm run build
   ```
   Then update the configuration to use:
   ```json
   "claude-mcp-data-explorer": {
     "command": "node",
     "args": [
       "C:\\Users\\yourusername\\claude-mcp-data-explorer\\dist\\index.js"
     ]
   }
   ```

## How It Works

This MCP server provides two main tools for Claude:

1. **load-csv** - Loads CSV data into memory for analysis
2. **run-script** - Executes JavaScript code for data processing and analysis

It also includes a prompt template that guides Claude through a structured data exploration process.

## Usage

1. **Start Claude Desktop**

2. **Select the "Explore Data" prompt template**
   - This prompt will appear in Claude Desktop after setup

3. **Enter CSV file path and exploration topic**
   - Example file path: `C:/Users/YourName/Documents/data.csv`
   - Example topic: "Sales trends by region"

4. **Let Claude analyze your data**
   - Claude will load the CSV file and generate insights automatically
   - The server handles large files efficiently using chunking

## Troubleshooting

1. **Claude doesn't show the MCP server**
   - Check that Claude Desktop is restarted after setup
   - Verify the configuration file at `%APPDATA%\\Claude\\claude_desktop_config.json`
   - Enable Developer Mode and check the MCP Log File
   - Try running the server manually: `npx ts-node --esm src/index.ts`

2. **Permission errors reading files**
   - Make sure Claude has access to the CSV file location
   - Try using absolute paths with forward slashes (`/`) or escaped backslashes (`\\`)

3. **JavaScript errors in scripts**
   - Check that your script is compatible with the allowed modules
   - Review any error messages in Claude's response

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Based on the official MCP TypeScript SDK from Anthropic
- Thanks to the MCP community for examples and inspiration
