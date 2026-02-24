import { configureStore } from "@reduxjs/toolkit";
import createFolderFilesReducer from "../features/createFolderFilesSlice";
import navbarReducer from "../features/navbarSlice";
import openFileReducer from "../features/openFileSlice";
import breadcrumbReducer from "../features/breadcrumbSlice";
import clientProjectTreeReducer from "../features/clientProjectTreeSlice";

export const store = configureStore({
  reducer: {
    create: createFolderFilesReducer,
    navbarChange: navbarReducer,
    breacrumbTitle:breadcrumbReducer,
    changeFileLink: openFileReducer,
    clientProjectTree: clientProjectTreeReducer,
  },
});

export default store;
