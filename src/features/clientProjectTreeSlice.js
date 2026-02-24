import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  openedClients: [],
  openedProjects: [],
};

const clientProjectTreeSlice = createSlice({
  name: "clientProjectTree",
  initialState,
  reducers: {
    toggleClient: (state, action) => {
      const clientName = action.payload;
      if (state.openedClients.includes(clientName)) {
        state.openedClients = state.openedClients.filter(name => name !== clientName);
      } else {
        state.openedClients.push(clientName);
      }
    },
    toggleProject: (state, action) => {
      const projectName = action.payload;
      if (state.openedProjects.includes(projectName)) {
        state.openedProjects = state.openedProjects.filter(name => name !== projectName);
      } else {
        state.openedProjects.push(projectName);
      }
    },
    resetTree: (state) => {
      state.openedClients = [];
      state.openedProjects = [];
    }
  },
});

export const { toggleClient, toggleProject, resetTree } = clientProjectTreeSlice.actions;
export default clientProjectTreeSlice.reducer;