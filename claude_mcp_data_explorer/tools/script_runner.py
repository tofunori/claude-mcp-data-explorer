import os
import asyncio
import logging
import traceback
import sys
import io
import contextlib
from mcp.types import TextContent

from .data_loader import get_all_dataframes

async def handle_run_script(arguments):
    """Handle the run-script tool"""
    script = arguments.get("script")
    
    if not script:
        return [TextContent(type="text", text="Error: script is required")]
    
    try:
        # Execute the script with access to loaded dataframes
        result = await execute_script(script)
        return [TextContent(type="text", text=result)]
    
    except Exception as e:
        error_message = f"Error executing script: {str(e)}\n{traceback.format_exc()}"
        logging.error(error_message)
        return [TextContent(
            type="text", 
            text=f"Error executing script: {str(e)}\n{traceback.format_exc()}"
        )]

async def execute_script(script):
    """Execute a Python script with access to loaded dataframes"""
    loop = asyncio.get_event_loop()
    
    # Capture stdout and stderr
    stdout = io.StringIO()
    stderr = io.StringIO()
    
    def run_script():
        # Create a globals dictionary with loaded dataframes
        globals_dict = {
            "pd": __import__("pandas"),
            "np": __import__("numpy"),
            "plt": __import__("matplotlib.pyplot"),
            "sns": __import__("seaborn"),
            "sklearn": __import__("sklearn"),
            "stats": __import__("scipy.stats"),
        }
        
        # Add all loaded dataframes to the globals
        globals_dict.update(get_all_dataframes())
        
        # Redirect stdout and stderr
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            # Execute the script
            exec(script, globals_dict)
        
        # Combine stdout and stderr
        out = stdout.getvalue()
        err = stderr.getvalue()
        
        if err:
            return f"Script output:\n{out}\n\nErrors:\n{err}"
        else:
            return f"Script output:\n{out}"
    
    # Run the script in a separate thread
    return await loop.run_in_executor(None, run_script)
