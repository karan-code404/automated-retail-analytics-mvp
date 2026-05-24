import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Import Sidebar
import Sidebar from './components/Sidebar';

// Import Pages
import Login from './pages/Login';
import Home from './pages/Home';
import UploadPage from './pages/Upload';
import Cleaning from './pages/Cleaning';
import KPIDashboard from './pages/KPIDashboard';
import Insights from './pages/Insights';
import Recommendations from './pages/Recommendations';
import Forecasting from './pages/Forecasting';
import Export from './pages/Export';
import Chat from './pages/Chat';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('corp_token'));
  const [currentDataset, setCurrentDataset] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    validateSession();
  }, [token]);

  const validateSession = async () => {
    if (!token) {
      setUser(null);
      setIsSessionLoading(false);
      return;
    }
    
    setIsSessionLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/auth/session', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data && response.data.success) {
        setUser(response.data.user);
      } else {
        throw new Error('Invalid session validation.');
      }
    } catch (err) {
      console.warn('Session verification failed. Clearing credentials:', err.message);
      localStorage.removeItem('corp_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsSessionLoading(false);
    }
  };

  const handleLoginSuccess = (userData, tokenVal) => {
    localStorage.setItem('corp_token', tokenVal);
    setToken(tokenVal);
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (e) {
      // Ignore cleanup failures
    }
    localStorage.removeItem('corp_token');
    setToken(null);
    setUser(null);
    setCurrentDataset(null);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // Enforce class toggle on body/html wrapper
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('light-mode');
      root.style.colorScheme = 'light';
    } else {
      root.classList.remove('light-mode');
      root.style.colorScheme = 'dark';
    }
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#070b13] text-teal-400 font-semibold text-sm">
        <span>Authenticating corporate session...</span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div className={`flex flex-col lg:flex-row min-h-screen ${isDarkMode ? 'bg-[#070b13] text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
          {/* Left Sidebar Layout */}
          <Sidebar 
            user={user} 
            onLogout={handleLogout} 
            isDarkMode={isDarkMode} 
            toggleTheme={toggleTheme} 
          />

          {/* Right Main Panel Routing */}
          <main className="flex-1 p-6 lg:p-10 max-h-screen overflow-y-auto">
            <Routes>
              <Route path="/" element={<Home user={user} />} />
              <Route 
                path="/upload" 
                element={
                  <UploadPage 
                    token={token} 
                    currentDataset={currentDataset} 
                    onUploadSuccess={(data) => setCurrentDataset(data)} 
                  />
                } 
              />
              <Route 
                path="/cleaning" 
                element={
                  <Cleaning 
                    token={token} 
                    currentDataset={currentDataset} 
                    onCleanSuccess={(updatedData) => setCurrentDataset(updatedData)} 
                  />
                } 
              />
              <Route 
                path="/kpis" 
                element={
                  <KPIDashboard 
                    token={token} 
                    currentDataset={currentDataset} 
                  />
                } 
              />
              <Route 
                path="/insights" 
                element={
                  <Insights 
                    token={token} 
                    currentDataset={currentDataset} 
                  />
                } 
              />
              <Route 
                path="/recommendations" 
                element={
                  <Recommendations 
                    token={token} 
                    currentDataset={currentDataset} 
                  />
                } 
              />
              <Route 
                path="/forecasting" 
                element={
                  <Forecasting 
                    token={token} 
                    currentDataset={currentDataset} 
                  />
                } 
              />
              <Route 
                path="/export" 
                element={
                  <Export 
                    token={token} 
                    currentDataset={currentDataset} 
                  />
                } 
              />
              <Route 
                path="/chat" 
                element={
                  <Chat 
                    token={token} 
                    currentDataset={currentDataset} 
                  />
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      )}
    </BrowserRouter>
  );
}
