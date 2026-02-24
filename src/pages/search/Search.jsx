import React, { useState } from "react";
import './Search.css'

function Search() {
  //  let openedFolder = [];
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
            name: "Sub Folder",
            children: [
              {
                id: 3,
                type: "file",
                name: "Team",
                url: "https://example.com/team",
              },
              {
                id: 4,
                type: "file",
                name: "Work Plan",
                url: "https://example.com/work-plan",
              },
              {
                id: 5,
                type: "folder",
                name: "Sub Folder2",
                children: [
                  {
                    id: 6,
                    type: "file",
                    name: "Team 2",
                    url: "https://example.com/team-2",
                  },
                  {
                    id: 7,
                    type: "file",
                    name: "Work Plan 2",
                    url: "https://example.com/work-plan-2",
                  },
                ],
              },
            ],
          },
          {
            id: 8,
            type: "file",
            name: "Work Progress",
            url: "https://example.com/work-progress",
          },
        ],
      },
      {
        id: 9,
        type: "folder",
        name: "WSI",
        children: [
          {
            id: 10,
            type: "file",
            name: "Project Details",
            url: "https://docs.google.com/document/d/1cgnD9N2TPCvFOpk8AW4-zMVDmLLJoWKB/edit?usp=sharing&ouid=102042161869103939919&rtpof=true&sd=true",
          },
        ],
      },
      {
        id: 11,
        type: "file",
        name: "Sprint _Hub",
        url: "https://docs.google.com/spreadsheets/d/1tUO5g6odx8j1_wCYe6_qFrTc67p2PXPNVHlQ8iwhj3o/edit?usp=sharing",
      },
      {
        id: 12,
        type: "folder",
        name: "GAP",
        children: [
          {
            id: 15,
            type: "file",
            name: "App Features",
            url: "https://docs.google.com/document/d/18bM0PKyPLHEDzaTGyK-pMfcujhFSGki-_BpKJOW3cYU/edit?usp=sharing",
          },
          {
            id: 16,
            type: "file",
            name: "GAP PowerBI Report",
            url: "https://app.powerbi.com/reportEmbed?reportId=7c43af94-4751-4aa7-be8c-31ddcf2f102f&autoAuth=true&ctid=06408ebc-5eb8-4b0d-827f-76dd3b58bc84",
          },
        ],
      },
    ],
  };

  const [toggleFolder, setToggleFolder] = useState([]);

  function openSubfolders(id) {
    const a = localStorage.getItem('okta-token-storage')
     console.log(a)
    
    console.log(id);
    if (!toggleFolder.includes(id)) {
      let a = [...toggleFolder, id];
      setToggleFolder(a);
    } else {
      const availableId = toggleFolder.indexOf(id);
      const tempFolder = [...toggleFolder];
      tempFolder.splice(availableId, 1);
      setToggleFolder(tempFolder);
    }
  }

  return (
    <div className="searchSection">
      <h5>Search for Files/Folders by Name:</h5>
      <input type='text' className="inputField" id='searchBar' autoFocus/>
    </div>
  );
}

export default Search;


