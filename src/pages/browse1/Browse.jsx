import React from "react";
import "./Browse.css";
import ContentSection from "../../components/browse/contentSection/ContentSection";
import FolderSection from "../../components/browse/folderSection/FolderSection";
import { useSelector } from "react-redux";

function Browse() {
    const selectedFileUrl = useSelector((state) => state.changeFileLink.link);

  return (
    <div className="browseScreen">
      <FolderSection />
      <ContentSection selectedFileUrl={selectedFileUrl}/>
    </div> 
  );
}

export default Browse;
