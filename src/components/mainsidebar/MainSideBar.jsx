import React, { useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./MainSideBar.css";
import { Link,useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { changeNavbarState } from "../../features/navbarSlice";

function MainSideBar() {
  const location = useLocation();
  const dispatch = useDispatch();
  const value = useSelector((state) => state.navbarChange.value);

  useEffect(() => {
    if (location.pathname === '/browse') dispatch(changeNavbarState(3));
    if (location.pathname === '/browser') dispatch(changeNavbarState(7));
    if (location.pathname === '/notifications') dispatch(changeNavbarState(1));
    if (location.pathname === '/search') dispatch(changeNavbarState(2));
    if (location.pathname === '/ceipal-details') dispatch(changeNavbarState(5));
    if (location.pathname === '/sprint-hub-app') dispatch(changeNavbarState(6));
  }, [location.pathname]);

  return (
    <div className="sideBar">
      <Link to="/">
        <div className={`sideBarItem ${value === 0 ? "active" : ""}`} onClick={() => dispatch(changeNavbarState(0))}>
          <i className="bi bi-house sideIcons"></i><span className="sideBarLabel">Home</span>
        </div>
      </Link>
      <Link to="/search">
        <div className={`sideBarItem ${value === 2 ? "active" : ""}`} onClick={() => dispatch(changeNavbarState(2))}>
          <i className="bi bi-search sideIcons"></i><span className="sideBarLabel">Search</span>
        </div>
      </Link>
      <Link to="/browse">
        <div className={`sideBarItem ${value === 3 ? "active" : ""}`} onClick={() => dispatch(changeNavbarState(3))}>
          <i className="bi bi-folder sideIcons"></i><span className="sideBarLabel">Browse</span>
        </div>
      </Link>
      <Link to="/analytics">
        <div className={`sideBarItem ${value === 7 ? "active" : ""}`} onClick={() => dispatch(changeNavbarState(7))}>
          <i className="bi bi-grid-3x3-gap sideIcons"></i><span className="sideBarLabel">Analytics</span>
        </div>
      </Link>
      <Link to="/manage">
        <div className={`sideBarItem ${value === 4 ? "active" : ""}`} onClick={() => dispatch(changeNavbarState(4))}>
          <i className="bi bi-gear sideIcons"></i><span className="sideBarLabel">Manage</span>
        </div>
      </Link>
      {/* <Link to="/ceipal-details">
        <div className={`sideBarItem ${value === 5 ? "active" : ""}`} onClick={() => dispatch(changeNavbarState(5))}>
          <i className="bi bi-file-earmark-excel sideIcons"></i><span className="sideBarLabel">CEIPAL Details</span>
        </div>
      </Link> */}
      <Link to="/sprint-hub-app">
        <div className={`sideBarItem ${value === 6 ? "active" : ""}`} onClick={() => dispatch(changeNavbarState(6))}>
          <i className="bi bi-shield-lock sideIcons"></i><span className="sideBarLabel">My Teams</span>
        </div>
      </Link>
    </div>
  );
}

export default MainSideBar;
