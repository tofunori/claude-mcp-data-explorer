import asyncio
import os
import sys
import logging
import json
import traceback
from datetime import datetime
from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions
import mcp.server.stdio
import mcp.types as types
from mcp.types import InitializeResponse

from .tools.data_loader import handle_load_csv
from .tools.script_runner import handle_run_script
from .prompts import get_explore_data_prompt


def create_server():
    """Create and configure the MCP server"""
    server = Server("claude-mcp-data-explorer")
    
    # Register tools
    register_tools(server)
    
    # Register prompts
    register_prompts(server)
    
    return MCPDataExplorerServer(server)


def register_tools(server):
    """Register all available tools with the server"""
    
    @server.list_tools()
    async def handle_list_tools() -> list[types.Tool]:
        """List available tools"""
        return [
            types.Tool(
                name="load-csv",
                description="Load a CSV file into a DataFrame for analysis",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "csv_path": {
                            "type": "string",
                            "description": "Path to the CSV file to load"
                        },
                        "df_name": {
                            "type": "string",
                            "description": "Name for the DataFrame (optional, defaults to df_1, df_2, etc.)"
                        }
                    },
                    "required": ["csv_path"]
                }
            ),
            types.Tool(
                name="run-script",
                description="Execute a Python script for data analysis and visualization",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "script": {
                            "type": "string",
                            "description": "Python script to execute"
                        }
                    },
                    "required": ["script"]
                }
            )
        ]
    
    @server.call_tool()
    async def handle_call_tool(
        name: str,
        arguments: dict | None
    ) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
        """Handle tool execution"""
        try:
            if name == "load-csv":
                return await handle_load_csv(arguments)
            elif name == "run-script":
                return await handle_run_script(arguments)
            else:
                raise ValueError(f"Unknown tool: {name}")
        except Exception as e:
            error_message = f"Error executing tool {name}: {str(e)}\n{traceback.format_exc()}"
            logging.error(error_message)
            return [
                types.TextContent(
                    type="text",
                    text=f"Error: {str(e)}"
                )
            ]


def register_prompts(server):
    """Register all available prompts with the server"""
    
    @server.list_prompts()
    async def handle_list_prompts() -> list[types.Prompt]:
        """List available prompts"""
        explore_data_prompt = get_explore_data_prompt()
        return [explore_data_prompt]


class MCPDataExplorerServer:
    """Wrapper class for the MCP server"""
    
    def __init__(self, server):
        self.server = server
    
    async def start(self):
        """Start the MCP server"""
        try:
            async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
                await self.server.run(
                    read_stream,
                    write_stream,
                    InitializationOptions(
                        server_name="claude-mcp-data-explorer",
                        server_version="0.1.0",
                        capabilities=self.server.get_capabilities(
                            notification_options=NotificationOptions(),
                            experimental_capabilities={},
                        ),
                    )
                )
        except Exception as e:
            logging.error(f"Server error: {e}", exc_info=True)
            raise
