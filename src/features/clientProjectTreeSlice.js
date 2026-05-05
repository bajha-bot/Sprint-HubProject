import { createSlice } from "@reduxjs/toolkit";
import { deleteProjectPlanSheet } from '../utils/projectPlanSheetService';

const KEY = 'sprintHub_customTree';

const load = () => {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    return {
      customProjects: d?.customProjects || {},
      customFiles: d?.customFiles || {},
      deletedProjects: d?.deletedProjects || [],
      deletedClients: d?.deletedClients || [],
    };
  } catch {
    return { customProjects: {}, customFiles: {}, deletedProjects: [], deletedClients: [] };
  }
};

const persist = (state) => {
  const data = {
    customProjects: JSON.parse(JSON.stringify(state.customProjects)),
    customFiles: JSON.parse(JSON.stringify(state.customFiles)),
    deletedProjects: [...state.deletedProjects],
    deletedClients: [...state.deletedClients],
  };
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
  fetch(`/api/sheet-ids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [KEY]: data }),
  }).catch(() => {});
};

// Load from server on startup, merge with localStorage
export const loadCustomTreeFromServer = async () => {
  try {
    const res = await fetch(`/api/sheet-ids`);
    const data = await res.json();
    if (data[KEY]) {
      const parsed = typeof data[KEY] === 'string' ? JSON.parse(data[KEY]) : data[KEY];
      localStorage.setItem(KEY, JSON.stringify(parsed));
      return parsed;
    }
  } catch {}
  return null;
};

const saved = load();

const initialState = {
  openedClients: [],
  openedProjects: [],
  customProjects: saved.customProjects,
  customFiles: saved.customFiles,
  deletedProjects: saved.deletedProjects,
  deletedClients: saved.deletedClients,
};

const clientProjectTreeSlice = createSlice({
  name: "clientProjectTree",
  initialState,
  reducers: {
    toggleClient: (state, action) => {
      const n = action.payload;
      state.openedClients = state.openedClients.includes(n)
        ? state.openedClients.filter(c => c !== n)
        : [...state.openedClients, n];
    },
    toggleProject: (state, action) => {
      const n = action.payload;
      state.openedProjects = state.openedProjects.includes(n)
        ? state.openedProjects.filter(p => p !== n)
        : [...state.openedProjects, n];
    },
    addClient: (state, action) => {
      const name = action.payload;
      if (!state.customProjects[name]) state.customProjects[name] = [];
      if (!state.openedClients.includes(name)) state.openedClients.push(name);
      persist(state);
    },
    addProject: (state, action) => {
      const { clientName, projectName } = action.payload;
      if (!state.customProjects[clientName]) state.customProjects[clientName] = [];
      if (!state.customProjects[clientName].includes(projectName)) {
        state.customProjects[clientName].push(projectName);
      }
      if (!state.openedClients.includes(clientName)) state.openedClients.push(clientName);
      persist(state);
    },
    addFile: (state, action) => {
      const { projectName, fileName } = action.payload;
      if (!state.customFiles[projectName]) state.customFiles[projectName] = [];
      if (!state.customFiles[projectName].includes(fileName)) {
        state.customFiles[projectName].push(fileName);
      }
      if (!state.openedProjects.includes(projectName)) state.openedProjects.push(projectName);
      persist(state);
    },
    renameClient: (state, action) => {
      const { oldName, newName } = action.payload;
      if (state.customProjects[oldName] !== undefined) {
        state.customProjects[newName] = state.customProjects[oldName];
        delete state.customProjects[oldName];
      }
      persist(state);
    },
    deleteClient: (state, action) => {
      const name = action.payload;
      if (state.customProjects[name] !== undefined) {
        delete state.customProjects[name];
      } else {
        if (!state.deletedClients.includes(name)) state.deletedClients.push(name);
      }
      state.openedClients = state.openedClients.filter(c => c !== name);
      persist(state);
    },
    renameProject: (state, action) => {
      const { oldName, newName } = action.payload;
      // find and rename in customProjects across all clients
      Object.keys(state.customProjects).forEach(c => {
        const idx = state.customProjects[c].findIndex(p => p.toLowerCase() === oldName.toLowerCase());
        if (idx !== -1) state.customProjects[c][idx] = newName;
      });
      if (state.customFiles[oldName]) {
        state.customFiles[newName] = state.customFiles[oldName];
        delete state.customFiles[oldName];
      }
      persist(state);
    },
    deleteProject: (state, action) => {
      const { projectName } = action.payload;
      Object.keys(state.customProjects).forEach(c => {
        state.customProjects[c] = state.customProjects[c].filter(
          p => p.toLowerCase() !== projectName.toLowerCase()
        );
      });
      if (!state.deletedProjects.some(d => d.toLowerCase() === projectName.toLowerCase())) {
        state.deletedProjects.push(projectName);
      }
      delete state.customFiles[projectName];
      state.openedProjects = state.openedProjects.filter(p => p.toLowerCase() !== projectName.toLowerCase());
      persist(state);
      deleteProjectPlanSheet(projectName);
    },
    renameFile: (state, action) => {
      const { projectName, oldName, newName } = action.payload;
      if (state.customFiles[projectName]) {
        const idx = state.customFiles[projectName].indexOf(oldName);
        if (idx !== -1) state.customFiles[projectName][idx] = newName;
      }
      persist(state);
    },
    deleteFile: (state, action) => {
      const { projectName, fileName } = action.payload;
      if (state.customFiles[projectName]) {
        state.customFiles[projectName] = state.customFiles[projectName].filter(f => f !== fileName);
      }
      persist(state);
    },
    resetTree: (state) => {
      state.openedClients = [];
      state.openedProjects = [];
    },
    loadFromServer: (state, action) => {
      const { customProjects, customFiles, deletedProjects, deletedClients } = action.payload;
      if (customProjects) state.customProjects = customProjects;
      if (customFiles) state.customFiles = customFiles;
      if (deletedProjects) state.deletedProjects = deletedProjects;
      if (deletedClients) state.deletedClients = deletedClients;
    },
  },
});

export const {
  toggleClient, toggleProject,
  addClient, addProject, addFile,
  renameClient, deleteClient,
  renameProject, deleteProject,
  renameFile, deleteFile,
  resetTree, loadFromServer,
} = clientProjectTreeSlice.actions;

export default clientProjectTreeSlice.reducer;
