from mcp.types import Prompt, TemplateVariable

def get_explore_data_prompt():
    """Create the data exploration prompt template"""
    return Prompt(
        id="explore-data",
        name="Explore Data",
        description="Analyze and visualize CSV data with detailed insights",
        template="You are an expert data scientist assistant tasked with exploring and analyzing a CSV dataset. I'll provide you with the path to a CSV file and the topic to explore.\n\nCSV Path: {{csv_path}}\nTopic to explore: {{topic}}\n\nPlease help me explore this dataset through these steps:\n\n1. Load the data using the 'load-csv' tool with the path provided above\n2. Understand the basic structure of the data (columns, data types, missing values)\n3. Perform statistical analysis relevant to the topic\n4. Create visualizations to illustrate key patterns or relationships\n5. Provide meaningful insights about the {{topic}}\n6. Suggest potential next steps for further analysis\n\nWhen creating visualizations or running analyses, use the 'run-script' tool with appropriate Python code using pandas, numpy, matplotlib, seaborn, or scikit-learn as needed.\n\nIf the CSV file is large, focus on efficient analysis techniques that work with large datasets, such as sampling or chunking.",
        variables=[
            TemplateVariable(
                name="csv_path",
                description="Full path to the CSV file to analyze",
                required=True
            ),
            TemplateVariable(
                name="topic",
                description="What aspect of the data you want to explore (e.g., 'Housing price trends in California')",
                required=True
            )
        ]
    )
