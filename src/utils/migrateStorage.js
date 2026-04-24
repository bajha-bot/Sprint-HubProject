export const migrateSheetIdsToServer = () => {
  const oldKeys = [
    'sprintHub_allEmployees_sheetId',
    'sprintHub_ceipal_sheetId',
    'sprintHub_projectPlan_sheets',
    'sprintHub_consolidated_sheet',
    'sprintHub_projectTeam_sheets',
    'sprintHub_team_consolidated_sheet',
    'sprintHub_client_consolidated_sheets',
    'sprintHub_project_positions',
    'sprintHub_next_position'
  ];

  oldKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
    }
  });
};
