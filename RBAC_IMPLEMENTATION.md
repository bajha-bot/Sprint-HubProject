# Role-Based Authorization Implementation

## Overview
This implementation provides role-based access control (RBAC) for the SprintHub application with 4 roles: Admin, Employee, CCL, and CDH.

## Roles & Permissions

### 1. **Employee**
- Access: Only assigned client (Albertsons)
- Projects: Only assigned project (e.g., "UMA FF")
- Domain: Only assigned domain (e.g., "ECOM")
- Can view: Own project data only

### 2. **CCL (Client Capability Lead)**
- Access: All projects within assigned client
- Can view: All projects under their client (e.g., all Albertsons projects)

### 3. **CDH (Client Delivery Head)**
- Access: All clients and all projects
- Can view: Everything across all clients

### 4. **Admin**
- Access: Full system access
- Can view: Everything

## Files Created

### 1. `/src/constants/roles.js`
Defines role constants and client sheet mappings:
```javascript
export const ROLES = {
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
  CCL: 'CCL',
  CDH: 'CDH'
};

export const CLIENT_SHEETS = {
  Albertsons: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit'
};
```

### 2. `/src/context/AuthContext.jsx`
Manages user authentication state from API:
- Fetches user data from `/myTeam/open-apis/getAllEmployees`
- Extracts role, client, project, and domain info
- Provides user context throughout app

### 3. `/src/utils/roleBasedAccess.js`
Core access control functions:
- `canAccessClient(user, clientName)` - Check client access
- `canAccessProject(user, clientName, projectName)` - Check project access
- `filterEmployeesByRole(user, employees)` - Filter data by role

### 4. `/src/components/RoleBasedClientBrowser.jsx`
Main component for role-based navigation:
- Shows accessible clients based on role
- Displays projects within selected client
- Opens client Google Sheet on click
- Route: `/role-based-browser`

## Usage

### Setup Client Sheets
Update `/src/constants/roles.js` with actual Google Sheet URLs:
```javascript
export const CLIENT_SHEETS = {
  Albertsons: 'https://docs.google.com/spreadsheets/d/ACTUAL_SHEET_ID/edit',
  // Add more clients as needed
};
```

### Access the Browser
Navigate to `/role-based-browser` to see role-based client/project view.

### Integration with Existing Components
ProjectStatsCard now includes:
- Role-based access checks
- "Open Client Sheet" button that opens static Google Sheet
- Automatic access denial for unauthorized users

## API Data Structure Expected
```json
{
  "employeeId": "41918",
  "role": "Employee",
  "employeeAllocationDataDTO": {
    "project": {
      "projectId": "Albertsons0122",
      "projectName": "UMA FF"
    },
    "domain": [{
      "domainName": "ECOM"
    }],
    "parentAccount": {
      "accountId": "Acc032",
      "accountName": "Albertsons"
    }
  }
}
```

## Testing
For testing, the AuthContext currently uses the first employee from the API. Modify line 15 in `AuthContext.jsx` to test different roles:
```javascript
// Test as specific user
const currentUser = data.records.find(emp => emp.employeeId === "41918");
```

## Next Steps
1. Update CLIENT_SHEETS with actual Google Sheet URLs
2. Implement proper user authentication (currently uses first employee)
3. Add role selection for testing
4. Integrate with existing authentication system
