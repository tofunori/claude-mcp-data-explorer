import { getAllDataFrames } from './data-loader.js';
import * as util from 'util';

// Interface for runScript arguments
interface RunScriptArgs {
  script: string;
}

/**
 * Safely executes JavaScript code with access to loaded data
 */
export async function runScript(args: RunScriptArgs): Promise<{ type: string, text: string }[]> {
  const { script } = args;
  
  if (!script) {
    return [{ type: 'text', text: 'Error: script is required' }];
  }
  
  // Capture console output
  let consoleOutput: string[] = [];
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.log = (...args) => {
    consoleOutput.push(args.map(formatOutput).join(' '));
  };
  
  console.error = (...args) => {
    consoleOutput.push(`ERROR: ${args.map(formatOutput).join(' ')}`);
  };
  
  console.warn = (...args) => {
    consoleOutput.push(`WARNING: ${args.map(formatOutput).join(' ')}`);
  };
  
  try {
    // Create a context with available libraries and data
    const contextObject: Record<string, any> = {
      // Make loaded data frames available to the script
      ...getAllDataFrames(),
      // Add utilities
      require: (moduleName: string) => {
        try {
          // Only allow specific modules for security
          const allowedModules: { [key: string]: any } = {
            'simple-statistics': require('simple-statistics'),
            'papaparse': require('papaparse'),
          };
          
          if (moduleName in allowedModules) {
            return allowedModules[moduleName];
          } else {
            throw new Error(`Module not allowed: ${moduleName}`);
          }
        } catch (error) {
          throw new Error(`Error requiring module '${moduleName}': ${error}`);
        }
      },
      // Add global variables and functions
      console: {
        log: console.log,
        error: console.error,
        warn: console.warn
      },
      Math,
      Date,
      JSON,
      Object,
      Array,
      String,
      Number,
      Boolean,
      Map,
      Set,
      Promise,
      Error,
    };
    
    // Add Data Frame helper methods
    for (const [name, data] of Object.entries(getAllDataFrames())) {
      contextObject[name] = data;
      
      // Add common DataFrame operations
      if (Array.isArray(data) && data.length > 0) {
        // Use method binding to ensure 'this' is preserved
        contextObject[`${name}_describe`] = () => describeDataFrame(data);
        contextObject[`${name}_columns`] = () => Object.keys(data[0] || {});
        contextObject[`${name}_head`] = (n = 5) => data.slice(0, n);
        contextObject[`${name}_tail`] = (n = 5) => data.slice(-n);
        contextObject[`${name}_filter`] = (fn: (row: any) => boolean) => data.filter(fn);
        contextObject[`${name}_map`] = (fn: (row: any) => any) => data.map(fn);
        contextObject[`${name}_groupBy`] = (key: string) => {
          const groups: Record<string, any[]> = {};
          for (const row of data) {
            const groupKey = String(row[key]);
            if (!groups[groupKey]) {
              groups[groupKey] = [];
            }
            groups[groupKey].push(row);
          }
          return groups;
        };
      }
    }
    
    // Create a secure function for execution
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const secureFunction = new AsyncFunction(
      ...Object.keys(contextObject),
      `"use strict";
      try {
        return (async () => {
          ${script}
          return "Script executed successfully";
        })();
      } catch (error) {
        throw error;
      }`
    );
    
    // Execute the function with context
    const result = await secureFunction(...Object.values(contextObject));
    
    // Add result to console output if we got something back
    if (result !== "Script executed successfully") {
      consoleOutput.push(formatOutput(result));
    }
    
    // Clean up and return the result
    return [{ type: 'text', text: consoleOutput.join('\n') }];
  } catch (error: any) {
    return [{ type: 'text', text: `Error executing script: ${error.message}\n\nConsole output:\n${consoleOutput.join('\n')}` }];
  } finally {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  }
}

/**
 * Format any output value into a readable string
 */
function formatOutput(value: any): string {
  try {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    
    if (typeof value === 'object') {
      return util.inspect(value, { depth: 2, colors: false, maxArrayLength: 100 });
    }
    
    return String(value);
  } catch (error) {
    return `[Error formatting output: ${error}]`;
  }
}

/**
 * Generate descriptive statistics for a DataFrame
 */
function describeDataFrame(data: any[]): Record<string, any> {
  if (!data || data.length === 0) {
    return { error: 'Empty dataset' };
  }
  
  const columns = Object.keys(data[0]);
  const result: Record<string, any> = {};
  
  for (const column of columns) {
    const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined);
    
    if (values.length === 0) {
      result[column] = { count: 0, missing: data.length };
      continue;
    }
    
    if (typeof values[0] === 'number') {
      try {
        const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v)) as number[];
        if (numericValues.length === 0) continue;
        
        result[column] = {
          count: numericValues.length,
          missing: data.length - numericValues.length,
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          mean: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
          // More advanced stats could be added here
        };
      } catch (error) {
        result[column] = { error: `Error calculating stats: ${error}` };
      }
    } else {
      const uniqueValues = new Set(values);
      result[column] = {
        count: values.length,
        missing: data.length - values.length,
        unique: uniqueValues.size,
        type: typeof values[0]
      };
    }
  }
  
  return result;
}
