import os
import asyncio
import logging
import pandas as pd
import numpy as np
import traceback
from mcp.types import TextContent

# Store loaded dataframes
_dataframes = {}
_df_counter = 1

async def handle_load_csv(arguments):
    """Handle the load-csv tool"""
    global _df_counter
    
    csv_path = arguments.get("csv_path")
    df_name = arguments.get("df_name")
    
    if not csv_path:
        return [TextContent(type="text", text="Error: csv_path is required")]
    
    # Normalize path for Windows
    csv_path = os.path.normpath(csv_path)
    
    # Generate a default name if none provided
    if not df_name:
        df_name = f"df_{_df_counter}"
        _df_counter += 1
    
    try:
        # Get file size
        file_size_mb = os.path.getsize(csv_path) / (1024 * 1024)
        logging.info(f"Loading CSV file: {csv_path} ({file_size_mb:.2f} MB)")
        
        # Use chunking for large files
        if file_size_mb > 100:
            return await _load_large_csv(csv_path, df_name)
        else:
            return await _load_small_csv(csv_path, df_name)
    
    except FileNotFoundError:
        return [TextContent(
            type="text", 
            text=f"Error: File not found: {csv_path}"
        )]
    except Exception as e:
        error_message = f"Error loading CSV: {str(e)}\n{traceback.format_exc()}"
        logging.error(error_message)
        return [TextContent(
            type="text", 
            text=f"Error loading CSV: {str(e)}"
        )]

async def _load_small_csv(csv_path, df_name):
    """Load a small CSV file directly"""
    loop = asyncio.get_event_loop()
    
    # Run pandas operations in a thread pool
    df = await loop.run_in_executor(
        None, 
        lambda: pd.read_csv(csv_path, low_memory=False)
    )
    
    # Store the dataframe globally
    _dataframes[df_name] = df
    
    # Generate summary statistics
    summary = await _generate_summary(df)
    
    return [TextContent(
        type="text",
        text=f"Successfully loaded {csv_path} as {df_name}\n\n{summary}"
    )]

async def _load_large_csv(csv_path, df_name):
    """Load a large CSV file using chunking"""
    loop = asyncio.get_event_loop()
    
    # Get the number of rows
    def count_rows():
        total_rows = 0
        for chunk in pd.read_csv(csv_path, chunksize=100000):
            total_rows += len(chunk)
        return total_rows
    
    try:
        total_rows = await loop.run_in_executor(None, count_rows)
        logging.info(f"Total rows in {csv_path}: {total_rows}")
    except Exception as e:
        logging.error(f"Error counting rows: {e}")
        total_rows = "Unknown"
    
    # Sample the file to get column information
    def sample_file():
        sample = pd.read_csv(csv_path, nrows=10000)
        return sample
    
    sample_df = await loop.run_in_executor(None, sample_file)
    
    # Load the entire file in chunks
    def load_full_file():
        chunks = []
        for chunk in pd.read_csv(csv_path, chunksize=100000):
            chunks.append(chunk)
        return pd.concat(chunks)
    
    logging.info(f"Loading full file: {csv_path}")
    df = await loop.run_in_executor(None, load_full_file)
    
    # Store the full dataframe globally
    _dataframes[df_name] = df
    
    # Generate summary statistics from sample
    summary = await _generate_summary(df)
    
    return [TextContent(
        type="text",
        text=f"Successfully loaded {csv_path} as {df_name} ({total_rows} rows)\n\n{summary}"
    )]

async def _generate_summary(df):
    """Generate a summary of the dataframe"""
    loop = asyncio.get_event_loop()
    
    def create_summary():
        # Basic information
        summary = []
        summary.append(f"Shape: {df.shape[0]} rows × {df.shape[1]} columns")
        
        # Column information
        summary.append("\nColumns:")
        for col in df.columns:
            dtype = df[col].dtype
            n_unique = df[col].nunique()
            n_missing = df[col].isna().sum()
            
            if np.issubdtype(dtype, np.number):
                summary.append(f"  - {col}: {dtype} (unique: {n_unique}, missing: {n_missing}, "  
                              f"min: {df[col].min()}, max: {df[col].max()}, "  
                              f"mean: {df[col].mean():.2f})")
            else:
                summary.append(f"  - {col}: {dtype} (unique: {n_unique}, missing: {n_missing})")
        
        return "\n".join(summary)
    
    return await loop.run_in_executor(None, create_summary)

# Make dataframes accessible to other modules
def get_dataframe(name):
    """Get a loaded dataframe by name"""
    return _dataframes.get(name)

def get_all_dataframes():
    """Get all loaded dataframes"""
    return _dataframes
