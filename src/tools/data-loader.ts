import * as fs from 'fs-extra';
import * as path from 'path';
import Papa from 'papaparse';
import * as ss from 'simple-statistics';

// Global storage for loaded DataFrames
const dataFrames: Record<string, any[]> = {};
let dfCounter = 1;

// Interface for loadCsv arguments
interface LoadCsvArgs {
  csv_path: string;
  df_name?: string;
}

/**
 * Loads a CSV file into memory and returns a summary of its contents
 */
export async function loadCsv(args: LoadCsvArgs): Promise<{ type: string, text: string }[]> {
  const { csv_path, df_name } = args;
  
  if (!csv_path) {
    return [{ type: 'text', text: 'Error: csv_path is required' }];
  }
  
  // Normalize path for Windows
  const normalizedPath = path.normalize(csv_path);
  
  // Generate a default name if none provided
  const dataFrameName = df_name || `df_${dfCounter++}`;
  
  try {
    // Check if file exists
    if (!fs.existsSync(normalizedPath)) {
      return [{ type: 'text', text: `Error: File not found: ${normalizedPath}` }];
    }
    
    // Get file size
    const stats = fs.statSync(normalizedPath);
    const fileSizeMb = stats.size / (1024 * 1024);
    
    // Read file content
    const fileContent = fs.readFileSync(normalizedPath, 'utf8');
    
    // Parse CSV
    const parseResult = Papa.parse(fileContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });
    
    if (parseResult.errors && parseResult.errors.length > 0) {
      return [{ type: 'text', text: `Error parsing CSV: ${parseResult.errors[0].message}` }];
    }
    
    const data = parseResult.data as any[];
    
    // Store in global storage
    dataFrames[dataFrameName] = data;
    
    // Generate summary
    const summary = generateSummary(data, parseResult.meta.fields || []);
    
    return [{ 
      type: 'text', 
      text: `Successfully loaded ${normalizedPath} as ${dataFrameName} (${data.length} rows × ${parseResult.meta.fields?.length || 0} columns)\n\n${summary}` 
    }];
    
  } catch (error: any) {
    return [{ type: 'text', text: `Error loading CSV: ${error.message}` }];
  }
}

/**
 * Generates a summary of the data
 */
function generateSummary(data: any[], fields: string[]): string {
  if (data.length === 0 || fields.length === 0) {
    return 'No data or columns found in the file.';
  }
  
  const summary = ['### Data Summary'];
  
  // Column information
  summary.push('\n#### Columns:');
  
  for (const field of fields) {
    const values = data.map(row => row[field]).filter(val => val !== null && val !== undefined);
    const numValues = values.length;
    const numMissing = data.length - numValues;
    
    let columnInfo = `- **${field}**:`;
    
    // Determine column type
    if (numValues === 0) {
      columnInfo += ` (All values missing)`;
    } else if (typeof values[0] === 'number') {
      // Numeric column
      const min = ss.min(values);
      const max = ss.max(values);
      const mean = ss.mean(values);
      const median = ss.median(values);
      
      columnInfo += ` numeric (${numValues} values, ${numMissing} missing)`;
      columnInfo += `\n  - Range: ${min} to ${max}`;
      columnInfo += `\n  - Mean: ${mean.toFixed(2)}, Median: ${median.toFixed(2)}`;
    } else if (typeof values[0] === 'string') {
      // String column
      const uniqueValues = new Set(values).size;
      
      columnInfo += ` string (${numValues} values, ${numMissing} missing)`;
      columnInfo += `\n  - Unique values: ${uniqueValues}`;
      
      // Show top values if there aren't too many
      if (uniqueValues <= 10) {
        const valueCounts: Record<string, number> = {};
        for (const val of values) {
          valueCounts[val] = (valueCounts[val] || 0) + 1;
        }
        
        const topValues = Object.entries(valueCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([val, count]) => `${val} (${count})`);
        
        columnInfo += `\n  - Top values: ${topValues.join(', ')}`;
      }
    } else if (typeof values[0] === 'boolean') {
      // Boolean column
      const trueCount = values.filter(v => v === true).length;
      const falseCount = values.filter(v => v === false).length;
      
      columnInfo += ` boolean (${numValues} values, ${numMissing} missing)`;
      columnInfo += `\n  - True: ${trueCount}, False: ${falseCount}`;
    } else {
      // Other type
      columnInfo += ` (${numValues} values, ${numMissing} missing)`;
    }
    
    summary.push(columnInfo);
  }
  
  return summary.join('\n');
}

// Export functions to access the data
export function getDataFrame(name: string): any[] | undefined {
  return dataFrames[name];
}

export function getAllDataFrames(): Record<string, any[]> {
  return dataFrames;
}
