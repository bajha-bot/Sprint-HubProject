import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createFile,
  createFolder,
  updateFileLink,
  renameFile,
  deleteFile,
} from "../../features/createFolderFilesSlice";
import FolderImg from "/folder.webp";
import FolderOpenImg from "/open-folder.webp";
import FileImg from "/file.webp";
import AddFolderImg from "/add-folder.webp";
import AddFileImg from "/add-document.webp";
import DeleteImg from "/deleteImg.webp";
import RenameImg from "/rename.webp";
import AddUser from "/adduser.webp";
import ManageClientProjectTree from "../../components/ManageClientProjectTree";
import ClientProjectTree from "../../components/ClientProjectTree";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Manage() {
  const value = useSelector((state) => state.create.value);
  const navbarStatus = useSelector((state) => state.navbarChange.value);
  const dispatch = useDispatch();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [openFolders, setOpenFolders] = useState({});

  if (authLoading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (!user) { navigate('/role-based-login'); return null; }

  const toggleFolder = (folderId) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  function displayLoop(x) {
  if (!Array.isArray(x)) {
    console.warn("❗ displayLoop received NON-array:", x);
    return null;
  }

  // Sort safely
  const sorted = [...x].sort((a, b) => {
    const nameA = (a?.name || "").toLowerCase();
    const nameB = (b?.name || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return sorted.map((val) => (
    <div key={val.id} className="folderContainer">
      <div className="subFolderTabs" style={{ justifyContent: "flex-start" }}>
        <div
          className={val.type === "folder" ? "isFolder" : "isFile"}
          style={{
            display: "flex",
            width: "80%",
            alignItems: "center",
            cursor: "pointer",
            border: "1px solid #0583ff",
            borderRadius: "5px",
          }}
          onClick={() =>
            val.type === "folder"
              ? toggleFolder(val.id)
              : dispatch(updateFileLink(val.id))
          }
        >
          {val.type === "folder" ? (
            <div>
              <i
                className={`bi ${
                  openFolders[val.id]
                    ? "bi-chevron-down"
                    : "bi-chevron-right"
                }`}
                style={{ fontSize: "12px", marginRight: "5px" }}
              ></i>

              <img
                src={openFolders[val.id] ? FolderOpenImg : FolderImg}
                alt="Folder"
                width="17"
                className="folderIcon"
              />
            </div>
          ) : (
            <img src={FileImg} alt="File" width="17" />
          )}

          <p>{val.name}</p>

          <div style={{ marginLeft: "auto", display: "flex" }}>
            <div
              style={{ display: "flex" }}
              onClick={(e) => {
                e.stopPropagation();
                dispatch(renameFile(val.id));
              }}
            >
              <img src={AddUser} width="20" />
              <p style={{ marginLeft: 5 }}>Add User</p>
            </div>

            <div
              style={{ display: "flex", marginLeft: "1rem" }}
              onClick={(e) => {
                e.stopPropagation();
                dispatch(renameFile(val.id));
              }}
            >
              <img src={RenameImg} width="20" />
              <p style={{ marginLeft: 5 }}>Rename</p>
            </div>

            <div
              style={{ display: "flex", marginLeft: "1rem" }}
              onClick={(e) => {
                e.stopPropagation();
                dispatch(deleteFile(val.id));
              }}
            >
              <img src={DeleteImg} width="22" />
              <p>Delete</p>
            </div>
          </div>
        </div>

        {val.type === "folder" && (
          <div>
            <img
              src={AddFolderImg}
              width="20"
              style={{ marginLeft: "8px" }}
              onClick={(e) => {
                e.stopPropagation();
                dispatch(createFolder(val.id));
              }}
            />

            <img
              src={AddFileImg}
              width="19"
              style={{ marginLeft: "8px" }}
              onClick={(e) => {
                e.stopPropagation();
                dispatch(createFile(val.id));
              }}
            />
          </div>
        )}
      </div>

      {/* Render children recursively */}
      {val.type === "folder" &&
        openFolders[val.id] &&
        Array.isArray(val.children) &&
        val.children.length > 0 && (
          <div
            className="subFolderChildren"
            style={{ marginLeft: "20px" }}
          >
            {displayLoop(val.children)}
          </div>
        )}
    </div>
  ));
 
}  

  return (
    <div style={{ width: '100%', height: '100vh', overflowY: 'auto' }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "82%",
          marginLeft: "2rem",
          marginBottom: "1rem",
          marginTop: "1rem",
        }}
      >
        <div>
          <h5>Manage</h5>
          <p>Click on the file to update its Link:</p>
        </div>
        <div>
          <img src={AddFolderImg} alt="Add Folder" width="35" onClick={(e) => { e.stopPropagation(); dispatch(createFolder(0)); }} />
          <img src={AddFileImg} alt="Add File" width="35" style={{ marginLeft: "8px" }} onClick={(e) => { e.stopPropagation(); dispatch(createFile(0)); }} />
        </div>
      </div>
      <ManageClientProjectTree user={user} />
      {/* <div style={{ marginLeft: "2rem" }}>{displayLoop(value)}</div> */}
    </div>
  );
}

export default Manage;
