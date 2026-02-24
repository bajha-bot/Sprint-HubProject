import { ROLES } from '../constants/roles';

export const canAccessClient = (user, clientName) => {
  if (!user) return false;
  
  switch (user.role) {
    case ROLES.CDH:
      return true; // Access all clients
    case ROLES.CCL:
      return user.accountName === clientName; // Only assigned client
    case ROLES.EMPLOYEE:
      return user.accountName === clientName; // Only assigned client
    case ROLES.ADMIN:
      return true;
    default:
      return false;
  }
};

export const canAccessProject = (user, clientName, projectName) => {
  if (!user) return false;
  
  switch (user.role) {
    case ROLES.CDH:
      return true; // Access all projects
    case ROLES.CCL:
      return user.accountName === clientName; // All projects in assigned client
    case ROLES.EMPLOYEE:
      return user.accountName === clientName && user.projectName === projectName; // Only assigned project
    case ROLES.ADMIN:
      return true;
    default:
      return false;
  }
};

export const filterEmployeesByRole = (user, employees) => {
  if (!user) return [];
  
  switch (user.role) {
    case ROLES.CDH:
    case ROLES.ADMIN:
      return employees; // See all employees
    case ROLES.CCL:
      return employees.filter(emp => 
        emp.employeeAllocationDataDTO?.parentAccount?.accountName === user.accountName
      );
    case ROLES.EMPLOYEE:
      return employees.filter(emp => 
        emp.employeeAllocationDataDTO?.parentAccount?.accountName === user.accountName &&
        emp.employeeAllocationDataDTO?.project?.projectName === user.projectName
      );
    default:
      return [];
  }
};
