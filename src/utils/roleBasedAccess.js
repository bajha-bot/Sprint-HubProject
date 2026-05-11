import { ROLES } from '../constants/roles';

export const isFullAccessRole = (user) =>
  user?.role === ROLES.ADMIN || user?.role === ROLES.CDH;

export const canAccessClient = (user, clientName) => {
  if (!user) return false;
  if (isFullAccessRole(user)) return true;
  return user.accountName === clientName;
};

export const canAccessProject = (user, clientName, projectName) => {
  if (!user) return false;
  if (isFullAccessRole(user)) return true;
  if (user.role === ROLES.CCL) return user.accountName === clientName;
  if (user.role === ROLES.EMPLOYEE)
    return user.accountName === clientName && user.projectName === projectName;
  return false;
};

export const filterEmployeesByRole = (user, employees) => {
  if (!user) return [];
  if (isFullAccessRole(user)) return employees;
  if (user.role === ROLES.CCL)
    return employees.filter(emp =>
      emp.employeeAllocationDataDTO?.parentAccount?.accountName === user.accountName
    );
  if (user.role === ROLES.EMPLOYEE)
    return employees.filter(emp =>
      emp.employeeAllocationDataDTO?.parentAccount?.accountName === user.accountName &&
      emp.employeeAllocationDataDTO?.project?.projectName === user.projectName
    );
  return [];
};
