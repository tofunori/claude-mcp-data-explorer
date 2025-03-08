import { McpPrompt } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Creates a prompt template for data exploration
 */
export function getExploreDataPrompt(): McpPrompt {
  return {
    id: "explore-data",
    name: "Explore Data",
    description: "Analyze and visualize CSV data with detailed insights",
    template: `You are an expert data scientist assistant tasked with exploring and analyzing a CSV dataset. I'll provide you with the path to a CSV file and the topic to explore.

CSV Path: {{csv_path}}
Topic to explore: {{topic}}

Please help me explore this dataset through these steps:

1. Load the data using the 'load-csv' tool with the path provided above
2. Understand the basic structure of the data (columns, data types, missing values)
3. Perform statistical analysis relevant to the topic
4. Create visualizations to illustrate key patterns or relationships 
5. Provide meaningful insights about the {{topic}}
6. Suggest potential next steps for further analysis

When creating visualizations or running analyses, use the 'run-script' tool with appropriate JavaScript code.

For data analysis and summary statistics, you can use these helper functions that are automatically available after loading a DataFrame called 'df_1':

- df_1_describe() - Get descriptive statistics for all columns
- df_1_columns() - Get list of column names
- df_1_head(n) - Get first n rows (default: 5)
- df_1_tail(n) - Get last n rows (default: 5)
- df_1_filter(fn) - Filter rows based on criteria
- df_1_map(fn) - Transform rows
- df_1_groupBy(key) - Group rows by column

If the CSV file is large, focus on efficient analysis techniques that work with large datasets, such as sampling or analyzing subsets of the data.
`,
    variables: [
      {
        name: "csv_path",
        description: "Full path to the CSV file to analyze",
        required: true
      },
      {
        name: "topic",
        description: "What aspect of the data you want to explore (e.g., 'Housing price trends in California')",
        required: true
      }
    ]
  };
}
