import os
import sys
import json
import subprocess
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("setup.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

def get_config_path():
    """Get the Claude Desktop config file path based on the platform"""
    if sys.platform == 'win32':
        appdata_path = os.environ.get('APPDATA')
        if not appdata_path:
            logging.error("APPDATA environment variable not found")
            return None
        return os.path.join(appdata_path, "Claude", "claude_desktop_config.json")
    elif sys.platform == 'darwin':  # macOS
        return os.path.expanduser("~/Library/Application Support/Claude/claude_desktop_config.json")
    else:
        logging.error(f"Unsupported platform: {sys.platform}")
        return None

def update_claude_config():
    """Update the Claude Desktop configuration file"""
    config_path = get_config_path()
    if not config_path:
        return False
    
    # Create directory if it doesn't exist
    config_dir = os.path.dirname(config_path)
    os.makedirs(config_dir, exist_ok=True)
    
    # Check if config file exists
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
        except json.JSONDecodeError:
            logging.error(f"Invalid JSON in config file: {config_path}")
            config = {}
        except Exception as e:
            logging.error(f"Error reading config file: {e}")
            config = {}
    else:
        config = {}
    
    # Update or create mcpServers section
    if 'mcpServers' not in config:
        config['mcpServers'] = {}
    
    # Add our server configuration
    current_dir = os.path.dirname(os.path.abspath(__file__))
    module_path = os.path.join(current_dir)
    
    config['mcpServers']['claude-mcp-data-explorer'] = {
        "command": sys.executable,
        "args": [
            os.path.join(module_path, "run_server.py")
        ]
    }
    
    # Write updated config back to file
    try:
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        logging.info(f"Updated Claude Desktop config at {config_path}")
        return True
    except Exception as e:
        logging.error(f"Error updating config file: {e}")
        return False

def install_package():
    """Install the package in development mode"""
    try:
        # Create necessary directories
        os.makedirs("logs", exist_ok=True)
        os.makedirs("data", exist_ok=True)
        
        logging.info("Setup completed successfully!")
        return True
    except Exception as e:
        logging.error(f"Error during setup: {e}")
        return False

def main():
    logging.info("Starting Claude MCP Data Explorer setup...")
    
    # Check Python version
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 10):
        logging.error(f"Python 3.10+ is required. Found Python {python_version.major}.{python_version.minor}")
        return False
    
    # Update Claude Desktop config
    if not update_claude_config():
        logging.error("Failed to update Claude Desktop configuration")
        return False
    
    # Install package
    if not install_package():
        logging.error("Failed to install package")
        return False
    
    logging.info("\n" + "="*50)
    logging.info("Setup completed successfully!")
    logging.info("Please restart Claude Desktop to use the MCP Data Explorer.")
    logging.info("="*50)
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
