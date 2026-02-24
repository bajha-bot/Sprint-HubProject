import React, { useState } from "react";
import "./FolderSection.css";
import { useDispatch, useSelector } from "react-redux";
import {
  createFile,
  createFolder,
  deleteFile,
  renameFile,
  updateFileLink,

} from "../../../features/createFolderFilesSlice";
import { openFileLink } from "../../../features/openFileSlice";
import { changeBreadcrumb } from "../../../features/breadcrumbSlice";
import FolderImg from "/folder.webp";
import FolderOpenImg from "/open-folder.webp";
import FileImg from "/file.webp";
import AddFolderImg from "/add-folder.webp";
import AddFileImg from "/add-document.webp";
import DeleteImg from "/deleteImg.webp";
import LinkImg from "/link.webp";
import RenameImg from "/rename.webp";
import { changeNavbarState } from "../../../features/navbarSlice";

function FolderSection() {
  const [optionSelected, setOptionSelected] = useState(0);
  const [fileSelected, setFileSelected] = useState(0);
  const value = useSelector((state) => state.create.value);
  const navbarStatus = useSelector((state) => state.navbarChange.value);
  const dispatch = useDispatch();

  const [openFolders, setOpenFolders] = useState({});
  let currentPathname = window.location.pathname;
  currentPathname === "/browse" && dispatch(changeNavbarState(3));

  const toggleFolder = (folderId) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  function handleOptions(file) {
    setOptionSelected((prev) => (prev === file.id ? "" : file.id));
  }

  function showFolderOptions(id) {
    return (
      <div>
        <div className="optionsAlignment" onClick={()=>dispatch(createFolder(id))}>
          <img
            src={AddFolderImg}
            alt="Folder Image"
            height="20"
            className="folderIcon"
          />
          <p>Add Folder</p>
        </div>
        <div className="optionsAlignment" onClick={()=>dispatch(createFile(id))}>
          <img
            src={AddFileImg}
            alt="Folder Image"
            height="20"
            className="folderIcon"
          />
          <p>Add File</p>
        </div>
        <div className="optionsAlignment" onClick={()=>dispatch(renameFile(id))}>
          <img
            src={RenameImg}
            alt="Folder Image"
            width="18"
            className="folderIcon"
          />
          <p>Rename</p>
        </div>
        <div className="optionsAlignment" onClick={()=>dispatch(deleteFile(id))}>
          <img
            src={DeleteImg}
            alt="Folder Image"
            height="20"
            className="folderIcon"
          />
          <p>Delete</p>
        </div>
      </div>
    );
  }

  function showFileOptions(id) {
    return (
      <div>
        <div className="optionsAlignment" onClick={()=>dispatch(updateFileLink(id))}>
          <img
            src={LinkImg}
            alt="Folder Image"
            height="17"
            className="folderIcon"
          />
          <p>Change Link</p>
        </div>
        <div className="optionsAlignment" onClick={()=>dispatch(renameFile(id))}>
          <img
            src={RenameImg}
            alt="Folder Image"
            width="18"
            className="folderIcon"
          />
          <p>Rename</p>
        </div>
        <div className="optionsAlignment" onClick={()=>dispatch(deleteFile(id))}>
          <img
            src={DeleteImg}
            alt="Folder Image"
            height="20"
            className="folderIcon"
          />
          <p>Delete</p>
        </div>
      </div>
    );
  }

function displayLoop(x) {
  // First, separate folders and files
  const folders = x
    ?.filter((item) => item.type === "folder")
    .slice()
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  const files = x
    ?.filter((item) => item.type === "file")
    .slice()
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  // Combine folders first, then files
  const sorted = [...folders, ...files];

  return sorted.map((val) => (
    <div key={val.name} className="folderContainer">
      <div className="subFolderTabs">
        <div
          className={val.type === "folder" ? "isFolder" : "isFile"}
          style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          onClick={() =>
            val.type === "folder"
              ? toggleFolder(val.id)
              : (dispatch(openFileLink(val.url)), dispatch(changeBreadcrumb(val.name)),setFileSelected(val.id))
          }
        >
          {val.type === "folder" ? (
            <div>
              <i
                className={`bi ${
                  openFolders[val.id] ? "bi-chevron-down" : "bi-chevron-right"
                }`}
                style={{ fontSize: "12px", marginRight: "5px" }}
              ></i>

              {openFolders[val.id] ? (
                <img
                  src={FolderOpenImg}
                  alt="Folder Image"
                  width="17"
                  className="folderIcon"
                />
              ) : (
                <img
                  src={FolderImg}
                  alt="Folder Image"
                  width="17"
                  className="folderIcon"
                />
              )}
            </div>
          ) : (
            <img src={FileImg} alt="File Image" width="17" />
          )}

          <p className={val.id===fileSelected && 'selectedFileStyle'}>{val.name}</p>
        </div>

        <div className="options" onClick={() => handleOptions(val)}>
          <center>︙</center>
          {optionSelected === val.id && (
            <div className="optionDiv">
              {val.type === "folder"
                ? showFolderOptions(val.id)
                : showFileOptions(val.id)}
            </div>
          )}
        </div>
      </div>

      {val.type === "folder" &&
        openFolders[val.id] &&
        val.children?.length > 0 && (
          <div className="subFolderChildren" style={{ marginLeft: "20px" }}>
            {displayLoop(val.children)}
          </div>
        )}
    </div>
  ));
}



  return (
    <div className="folderSection">
      <div className="folderTabs">
        <div>
          <h5>Browse</h5>
        </div>
        <div>
          <img
            src={AddFolderImg}
            alt="Add Folder Image"
            width="20"
            onClick={(e) => {
              e.stopPropagation();
              dispatch(createFolder(0));
            }}
          />
          <img
            src={AddFileImg}
            alt="Add File Image"
            width="19"
            style={{ marginLeft: "8px" }}
            onClick={(e) => {
              e.stopPropagation();
              dispatch(createFile(0));
            }}
          />
        </div>
      </div>

      {displayLoop(value)}
    </div>
  );
}

export default FolderSection;
