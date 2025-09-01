import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import Status from "./components/Status";
import Items from "./components/Items";
import Admin from "./components/Admin";
import Login from "./components/Login";

function App() {
  const [currentView, setCurrentView] = useState("status");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  // Check for existing login on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUsername = localStorage.getItem('username');
    const savedIsAdmin = localStorage.getItem('isAdmin') === 'true';
    
    if (token && savedUsername) {
      setIsLoggedIn(true);
      setUsername(savedUsername);
      setIsAdmin(savedIsAdmin);
    }
  }, []);

  const handleLogin = () => {
    setShowLogin(true);
  };

  const handleLoginSuccess = (user: string, adminStatus: boolean) => {
    setIsLoggedIn(true);
    setUsername(user);
    setIsAdmin(adminStatus);
    setShowLogin(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
    setIsLoggedIn(false);
    setUsername("");
    setIsAdmin(false);
    // If user was on admin page, redirect to status
    if (currentView === "admin") {
      setCurrentView("status");
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "status":
        return <Status />;
      case "items":
        return <Items />;
      case "admin":
        return isAdmin ? <Admin /> : <div className="text-center py-8 text-red-600">Admin access required</div>;
      default:
        return <Status />;
    }
  };

  return (
    <>
      <Layout 
        currentView={currentView} 
        onViewChange={setCurrentView}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        onLogin={handleLogin}
        onLogout={handleLogout}
        username={username}
      >
        {renderCurrentView()}
      </Layout>
      
      {showLogin && (
        <Login 
          onLoginSuccess={handleLoginSuccess}
          onCancel={() => setShowLogin(false)}
        />
      )}
    </>
  );
}

export default App;
