# CEIPAL Excel File Format

## Expected Column Headers

The Excel file should contain the following columns (case-insensitive):

| Column Name | Alternative Names | Description |
|-------------|-------------------|-------------|
| Job Code | job_code, JobCode, Job_Code | Unique identifier for the job |
| Client | client, CLIENT | Client name |
| Department | department, DEPARTMENT | Department name |
| Project Name | project_name, ProjectName, Project_Name | Name of the project |

## Sample Excel Structure

```
| Job Code | Client    | Department | Project Name        |
|----------|-----------|------------|---------------------|
| JOB001   | ABC Corp  | IT         | Web Development     |
| JOB002   | XYZ Ltd   | Finance    | ERP Implementation  |
| JOB003   | DEF Inc   | HR         | Recruitment Portal  |
```

## Supported File Formats
- .xlsx (Excel 2007+)
- .xls (Excel 97-2003)

## Features
- Automatic column name detection (supports various naming conventions)
- Error handling for invalid files
- Loading indicators
- Responsive table display
- Record count display
- Empty state handling

## Usage
1. Navigate to CEIPAL Details from the sidebar
2. Click "Select Excel File" and choose your file
3. The data will be automatically processed and displayed in a table
4. Use the table to view all records with proper formatting