# Claude MCP Data Explorer for Windows

A Model Context Protocol (MCP) server implementation for Windows that enables advanced data exploration using Claude. This server acts as a personal Data Scientist assistant, transforming complex datasets into clear, actionable insights.

## Features

- Load and analyze CSV data of any size
- Execute Python scripts with pandas, numpy, scikit-learn, and other data science libraries
- Generate visualizations and insights automatically
- Windows-specific setup and optimization

## 🚀 Getting Started

### Prerequisites

1. **Python 3.10+** - [Download Python](https://www.python.org/downloads/windows/)
2. **Claude Desktop** - [Download Claude Desktop](https://claude.ai/download)

### Installation

1. **Clone this repository**
   ```powershell
   git clone https://github.com/tofunori/claude-mcp-data-explorer.git
   cd claude-mcp-data-explorer
   ```

2. **Set up a virtual environment**
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. **Install dependencies**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Run the setup script**
   ```powershell
   python setup.py
   ```

### Configuration

The setup script will automatically configure the Claude Desktop application to use this MCP server. It will:

1. Locate the Claude Desktop configuration file
2. Register the data explorer MCP server
3. Create necessary directories for data storage

## 📊 Using the Data Explorer

1. **Start Claude Desktop**

2. **Select the explore-data prompt template**
   - This template will appear in Claude Desktop once the server is properly configured

3. **Provide the required inputs:**
   - `csv_path`: Full path to your CSV file
   - `topic`: The specific aspect of the data you want to explore (e.g., "Housing price trends in California")

4. **Let Claude analyze your data**
   - The server will handle loading the data, even for very large files
   - Claude will automatically generate insights, statistics, and visualizations

## 🧰 Available Tools

### Data Loading
- **load-csv**: Loads a CSV file into a DataFrame
  - `csv_path` (string, required): Path to the CSV file
  - `df_name` (string, optional): Name for the DataFrame. Defaults to df_1, df_2, etc.

### Script Execution
- **run-script**: Executes a Python script
  - `script` (string, required): The Python code to execute

## 🔧 Troubleshooting

### Common Issues

1. **Claude doesn't show the MCP server**
   - Ensure Claude Desktop is restarted after setup
   - Check the configuration file at `%APPDATA%\Claude\claude_desktop_config.json`

2. **Error loading large CSV files**
   - The server is designed to handle large files efficiently using chunking
   - Ensure you have sufficient RAM available

3. **Script execution fails**
   - Check for Python syntax errors
   - Verify all required libraries are imported in your script

### Logs

Log files are stored in the `logs` directory of this repository. Check these files for detailed error information.

## 🛠️ Advanced Configuration

### Custom Dependencies

You can add additional Python libraries by editing the `requirements.txt` file and running:
```powershell
pip install -r requirements.txt
```

### Manual Configuration

To manually configure Claude Desktop on Windows:

1. Open `%APPDATA%\Claude\claude_desktop_config.json`
2. Add the server configuration:
   ```json
   "mcpServers": {
     "claude-mcp-data-explorer": {
       "command": "python",
       "args": [
         "-m",
         "claude_mcp_data_explorer"
       ]
     }
   }
   ```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by [reading-plus-ai/mcp-server-data-exploration](https://github.com/reading-plus-ai/mcp-server-data-exploration)
- Uses the [Anthropic Model Context Protocol](https://modelcontextprotocol.io/introduction)
