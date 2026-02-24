import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import MainLogo from "/nisum-technologies-logo.webp";
import CreateFileImg from "/add-document.webp";
import CreateFolderImg from "/add-folder.webp";
import { useDispatch, useSelector } from "react-redux";
import {
  createFile,
  createFolder,
} from "../../features/createFolderFilesSlice";
import folderImg from "/folder.webp";
import openFolderImg from "/open-folder.webp";
import fileImg from "/file.webp";
import { openFileLink } from "../../features/openFileSlice";
import { changeBreadcrumb } from "../../features/breadcrumbSlice";
import SprintHubLogo from "/SprintHubLogo.png";
import EmployeeStatsCard from "../../components/EmployeeStatsCard";
import ProjectStatsCard from "../../components/ProjectStatsCard";
import ClientProjectTree from "../../components/ClientProjectTree";
import useGetAllEmployees from "../../hooks/useGetAllEmployees";

function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [openedFolder, setOpenedFolder] = useState([]);
  const [searchOutput, setSearchOutput] = useState([]);
  const objValue = useSelector((state) => state.create.value);
  const { data: employeeData } = useGetAllEmployees();

  // Debug logging
  // useEffect(() => {
  //   console.log('Employee data:', employeeData);
  //   if (employeeData?.records) {
  //     console.log('Records count:', employeeData.records.length);
  //     console.log('Sample record:', employeeData.records[0]);
  //     console.log('Sample record keys:', Object.keys(employeeData.records[0]));
  //     // Check if any record has allocation data
  //     const recordWithAllocation = employeeData.records.find(emp => emp.employeeAllocationDataDTO);
  //     console.log('Record with allocation:', recordWithAllocation);
  //     if (recordWithAllocation?.employeeAllocationDataDTO) {
  //       console.log('Allocation data keys:', Object.keys(recordWithAllocation.employeeAllocationDataDTO));
  //       console.log('Full allocation data:', recordWithAllocation.employeeAllocationDataDTO);
  //     }
  //     console.log('Opened clients:', openedClients);
  //   }
  // }, [employeeData, openedClients]);

  const searchRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOutput([]); 
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

function searchByName(searchText) {
  if (!searchText.trim()) {
    setSearchOutput([]);
    return;
  }

  const obj = objValue;
  const safe = escapeRegex(searchText);
  const regex = new RegExp(safe, "i");

  let results = [];

  function recurse(node) {
    if (Array.isArray(node)) {
      node.forEach((item) => recurse(item));
    } else if (typeof node === "object" && node !== null) {
      if (node.name && regex.test(node.name)) {
        results.push(node);
      }
      Object.values(node).forEach((value) => recurse(value));
    }
  }

  recurse(obj);
  setSearchOutput(results);
}


  function toggleFolder(id) {
    if (openedFolder.includes(id)) {
      const tempArr = [...openedFolder];
      const tempId = tempArr.indexOf(id);
      tempArr.splice(tempId, 1);
      setOpenedFolder(tempArr);
    } else {
      setOpenedFolder((prev) => [...prev, id]);
    }
  }
  const fileClicked = (link, name) => {
    navigate("/browse");

    //change content section with the file link

    dispatch(openFileLink(link));

    // change breadcrumb accordingly
    dispatch(changeBreadcrumb(name));

    // change folder structure to save opened file when visited browse page from home
  };

  function viewFolder(x = objValue) {
    return x.map((val) => {
      return (
        <div
          key={val.name}
          onClick={(e) => {
            e.stopPropagation();
            val.type === "folder"
              ? toggleFolder(val.id)
              : fileClicked(val.url, val.name);
          }}
        >
          <div style={{ display: "flex", cursor: "pointer" }}>
            {val.type === "folder" ? (
              <img src={folderImg} height={20} />
            ) : (
              <img src={fileImg} height={20} />
            )}
            <h5 style={{ marginLeft: "10px" }}>{val.name}</h5>
          </div>

          {openedFolder.includes(val.id) && val.children.length > 0 && (
            <div style={{ marginLeft: "1rem" }}>
              <h6>{viewFolder(val.children)}</h6>
            </div>
          )}
        </div>
      );
    });
  }

  return (
    <div className="home">
             <img src={MainLogo} alt="Nisum Logo" width={160} height={55} 
             style={{position:'absolute',right:'1.5rem',top:'1.5rem',backgroundColor:'white',boxShadow:'-2px 2px 6px grey',padding: '15px',borderRadius:'5px'}}/>

      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          margin: "1.5rem 0rem 2rem 0rem",
        }}
      >
        <img src={SprintHubLogo} alt="SprintHub Logo" width={300} />
       
      </div>
      <div ref={searchRef}>
        <input
        type="text"
        className="searchBar"
        placeholder="  🔍︎  Search File/Folder here"
        onChange={(e) => searchByName(e.target.value)}
      />

      {searchOutput.length > 0 && (
        <div className="searchItems">
          {searchOutput?.map((val) => {
            return <p>{val.name}</p>;
          })}
        </div>
      )}
      </div>

      <div className="createSection">
        <div
          className="createSomething"
          onClick={() => dispatch(createFolder(0))}
        >
          <img src={CreateFolderImg} alt="Create New Folder" />
          <h6>Create New Project</h6>
        </div>
        <div
          className="createSomething"
          onClick={() => dispatch(createFile(0))}
        >
          <img src={CreateFileImg} alt="Create New File" />
          <h6>Create New File</h6>
        </div>
      </div>
      {/* <EmployeeStatsCard /> */}
      
      <div className="existingProjects">
        <h4
          style={{
            marginBottom: "1rem",
            fontWeight: "bold",
            textDecoration: "underline",
            color: "rgb(36 66 198)",
            cursor: "pointer",
          }}
        >
          All Projects And Files
        </h4>
        
        {/* Client Names as Folders */}
        <ClientProjectTree />
        
        {/* {viewFolder()} */}
      </div>
    </div>
  );
}

export default Home;
