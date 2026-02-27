import { useEffect, useState } from "react";
import "./App.css";
import MainSideBar from "./components/mainsidebar/MainSideBar";
import { Routes, Route, useNavigate } from "react-router-dom";
import Home from "./pages/home/Home";
import Notifications from "./pages/notifications/Notifications";
import Search from "./pages/search/Search";
import Browse from "./pages/browse/Browse";
import { useSelector } from "react-redux";
import Manage from "./pages/manage/Manage";
import EmployeeStatsCard from "./components/EmployeeStatsCard";
import CeipalDetails from "./components/CeipalDetails";
import { AuthProvider } from "./context/AuthContext";
import RoleBasedClientBrowser from "./components/RoleBasedClientBrowser";
import RoleBasedLogin from "./components/RoleBasedLogin";
import { initializeToken } from "./constants/apiToken";

function App() {
  const navbarState = useSelector((state) => state.navbarChange.value);
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    initializeToken().then(() => setTokenReady(true));
  }, []);

  if (!tokenReady) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <AuthProvider>
      <div className="wholeScreen">
        <MainSideBar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/search" element={<Search />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/manage" element={<Manage />} />
          <Route path="/EmployeeStatsCard" element={<EmployeeStatsCard />} />
          <Route path="/ceipal-details" element={<CeipalDetails />} />
          <Route path="/role-based-login" element={<RoleBasedLogin />} />
          <Route path="/sprint-hub-app" element={<RoleBasedClientBrowser />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
