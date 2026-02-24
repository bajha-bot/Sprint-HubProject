import { createSlice } from "@reduxjs/toolkit";

let initialState = {
  value: [
    {
      id: 1,
      type: "folder",
      name: "Albertson",
      children: [
        {
          id: 2,
          type: "folder",
          name: "Compute & Integration",
          children: [
            {
              id: 3,
              type: "file",
              name: "Project Dashboard",
              url: "https://example.com/team",
            },
            {
              id: 4,
              type: "file",
              name: "Project Plan",
              url: "https://example.com/work-plan",
            },
             {
              id: 41,
              type: "file",
              name: "Project Team",
              url: "https://example.com/work-plan",
            },
          
          ],
        },
        {
          id: 18,
          type: "folder",
          name: "Shipping Project",
          children: [
            {
              id: 191,
              type: "file",
              name: "Project Team",
              url: "https://example.com/team",
            },
            {
              id: 201,
              type: "file",
              name: "Project Plan",
              url: "https://example.com/work-plan",
            },
             {
              id: 234,
              type: "file",
              name: "Project Dashboard",
              url: "https://example.com/work-plan",
            },
          
          ],
        },
      ],
    },
    {
      id: 9,
      type: "folder",
      name: "WSI",
      children: [
        {
          id: 18,
          type: "folder",
          name: "Digital Experience",
          children: [
            {
              id: 1912,
              type: "file",
              name: "Project Team",
              url: "https://example.com/team",
            },
            {
              id: 2012,
              type: "file",
              name: "Project Plan",
              url: "https://example.com/work-plan",
            },
             {
              id: 2342,
              type: "file",
              name: "Project Dashboard",
              url: "https://example.com/work-plan",
            },
          
          ],
        },
          {
          id: 818,
          type: "folder",
          name: "Product Catalogue",
          children: [
            {
              id: 1191,
              type: "file",
              name: "Project Team",
              url: "https://example.com/team",
            },
            {
              id: 1201,
              type: "file",
              name: "Project Plan",
              url: "https://example.com/work-plan",
            },
             {
              id: 1234,
              type: "file",
              name: "Project Dashboard",
              url: "https://example.com/work-plan",
            },
          
          ],
        },
      ],
    },

    {
      id: 12,
      type: "folder",
      name: "GAP",
      children: [
          {
          id: 218,
          type: "folder",
          name: "Data & Insights",
          children: [
            {
              id: 2191,
              type: "file",
              name: "Project Team",
              url: "https://example.com/team",
            },
            {
              id: 2201,
              type: "file",
              name: "Project Plan",
              url: "https://example.com/work-plan",
            },
             {
              id: 2234,
              type: "file",
              name: "Project Dashboard",
              url: "https://example.com/work-plan",
            },
          
          ],
        },
           {
          id: 318,
          type: "folder",
          name: "Product 360 Sourcing",
          children: [
             {
          id: 11,
          type: "file",
          name: "Project Plan",
          url: "https://docs.google.com/spreadsheets/d/1tUO5g6odx8j1_wCYe6_qFrTc67p2PXPNVHlQ8iwhj3o/edit?usp=sharing",
        },
        
        {
          id: 15,
          type: "file",
          name: "Project Team",
          url: "https://docs.google.com/spreadsheets/d/180ww3cCVw8uonS-nUmgOIjFfgkYdA4y3RiWV86hEU4s/edit?usp=sharing",
        },
        {
          id: 16,
          type: "file",
          name: "Project Dashboard",
          url: "https://app.powerbi.com/reportEmbed?reportId=7c43af94-4751-4aa7-be8c-31ddcf2f102f&autoAuth=true&ctid=06408ebc-5eb8-4b0d-827f-76dd3b58bc84",
        },
        
          
          ],
        },
          {
          id: 418,
          type: "folder",
          name: "Inbound Transportation",
          children: [
            {
              id: 4191,
              type: "file",
              name: "Project Team",
              url: "https://example.com/team",
            },
            {
              id: 4201,
              type: "file",
              name: "Project Plan",
              url: "https://example.com/work-plan",
            },
             {
              id: 4234,
              type: "file",
              name: "Project Dashboard",
              url: "https://example.com/work-plan",
            },
          
          ],
        },
          {
          id: 518,
          type: "folder",
          name: "Plan Reporting",
          children: [
            {
              id: 5191,
              type: "file",
              name: "Project Team",
              url: "https://example.com/team",
            },
            {
              id: 5201,
              type: "file",
              name: "Project Plan",
              url: "https://example.com/work-plan",
            },
             {
              id: 5234,
              type: "file",
              name: "Project Dashboard",
              url: "https://example.com/work-plan",
            },
          
          ],
        },
      
      ],
    },
  ],
};

function insertInto(arrVal, gotId, newObj) {
  if (gotId === 0) {
    arrVal.push(newObj);
    return arrVal;
  }
  let arrVal2 = arrVal?.map((v) => {
    if (v.id === gotId) {
      v.children.push(newObj);
    }
    if (v.children && v.children.length > 0) {
      insertInto(v.children, gotId, newObj);
    }
    return v;
  });
  return arrVal2;
}

function updateLink(arr, targetId) {
  let arr2 = arr.map((v) => {
    if (v.id === targetId) {
      const newLink = prompt(
        `Your current link is:\n\n${v.url}\n\n Enter the New Link below and press OK to Update:`
      );
      newLink && (v.url = newLink);
    }
    if (v.children && v.children.length > 0) {
      updateLink(v.children, targetId);
    }
    return v;
  });

  return arr2;
}
function renameById(arr, targetId) {
  let arr2 = arr.map((v) => {
    if (v.id === targetId) {
      const newName = prompt(
        `Your current File/Folder Name is:\n\n${v.name}\n\n Enter the New Name below and press OK to Update:`
      );
      newName && (v.name = newName);
    }
    if (v.children && v.children.length > 0) {
      renameById(v.children, targetId);
    }
    return v;
  });

  return arr2;
}

function deleteById(arr, targetId) {
  arr.forEach((val, i) => {
    if (val.id === targetId) {
      let confirmByUser = confirm("Are you sure, you want to delete it?");
      confirmByUser && arr.splice(i, 1);
    }
    val.children && deleteById(val.children, targetId);
  });
  return arr;
}

const createFolderFilesSlice = createSlice({
  name: "Create Folder and Files",
  initialState,
  reducers: {
    createFolder(state, action) {
      let currentFolderId = Math.floor(Math.random() * 10000);

      let fileNameEntered = prompt("Enter Your Folder Name:");
      // fileNameEntered.split('').length <=1 && 
      const newVal = insertInto(state.value, action.payload, {
        id: currentFolderId,
        type: "folder",
        name: fileNameEntered,
        children: [],
      });
     if(action.payload !== 0){
       state.value = newVal;
      const projectTeamFile = insertInto(state.value, currentFolderId, {
        id: Math.floor(Math.random() * 10000),
        type: "file",
        url: "https://example.com/",
        name: "Project Team",
      });

      state.value = projectTeamFile;
      const projectPlanFile = insertInto(state.value, currentFolderId, {
        id: Math.floor(Math.random() * 10000),
        type: "file",
        url: "https://example.com/",
        name: "Project Plan",
      });

      state.value = projectPlanFile;
      const projectDashboardFile = insertInto(state.value, currentFolderId, {
        id: Math.floor(Math.random() * 10000),
        type: "file",
        url: "https://example.com/",
        name: "Project Dashboard",
      });

      state.value = projectDashboardFile;
     }
    },
    createFile(state, action) {
      const fileNameEntered = prompt("Enter Your File Name:");
      const objectVal = action.payload;
      const newFile = {
        id: Math.floor(Math.random() * 10000),
        type: "file",
        url: "https://example.com/",
        name: fileNameEntered,
      };
      const newVal = insertInto(state.value, objectVal, newFile);
      state.value = newVal;
    },

    updateFileLink(state, action) {
      let targetId = action.payload;
      state.value = updateLink(state.value, targetId);
    },
    renameFile(state, action) {
      let targetId = action.payload;
      state.value = renameById(state.value, targetId);
    },
    deleteFile(state, action) {
      let targetId = action.payload;
      deleteById(state.value, targetId);
      // alert('Deleted Successfully.')
    },
  },
});

export const {
  createFile,
  createFolder,
  updateFileLink,
  renameFile,
  deleteFile,
} = createFolderFilesSlice.actions;
export default createFolderFilesSlice.reducer;
