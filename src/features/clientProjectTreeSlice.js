import { createSlice } from "@reduxjs/toolkit";

const KEY = 'sprintHub_customTree';
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

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
    customProjects: state.customProjects,
    customFiles: state.customFiles,
    deletedProjects: state.deletedProjects,
    deletedClients: state.deletedClients,
  };
  const value = JSON.stringify(data);
  // save to localStorage immediately
  try { localStorage.setItem(KEY, value); } catch {}
  // save to server permanently
  fetch(`${SERVER_URL}/api/sheet-ids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [KEY]: value }),
  }).catch(() => {});
};

// Load from server on startup, merge with localStorage
export const loadCustomTreeFromServer = async () => {
  try {
    const res = await fetch(`${SERVER_URL}/api/sheet-ids`);
    const data = await res.json();
    if (data[KEY]) {
      localStorage.setItem(KEY, data[KEY]);
    }
  } catch {}
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
      // remove from customProjects across all clients (case-insensitive)
      Object.keys(state.customProjects).forEach(c => {
        state.customProjects[c] = state.customProjects[c].filter(
          p => p.toLowerCase() !== projectName.toLowerCase()
        );
      });
      // blocklist so API-sourced project with same name also hides
      if (!state.deletedProjects.some(d => d.toLowerCase() === projectName.toLowerCase())) {
        state.deletedProjects.push(projectName);
      }
      delete state.customFiles[projectName];
      state.openedProjects = state.openedProjects.filter(p => p.toLowerCase() !== projectName.toLowerCase());
      persist(state);
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
  },
});

export const {
  toggleClient, toggleProject,
  addClient, addProject, addFile,
  renameClient, deleteClient,
  renameProject, deleteProject,
  renameFile, deleteFile,
  resetTree,
} = clientProjectTreeSlice.actions;

export default clientProjectTreeSlice.reducer;
