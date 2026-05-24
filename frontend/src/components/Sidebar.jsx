import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Sparkles, 
  TrendingUp, 
  Lightbulb, 
  FileText, 
  MessageSquare, 
  LogOut, 
  User, 
  Menu, 
  X,
  Sun,
  Moon,
  Home,
  CheckSquare
} from 'lucide-react';

export default function Sidebar({ user, onLogout, isDarkMode, toggleTheme }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Overview', path: '/', icon: Home },
    { name: 'Upload Dataset', path: '/upload', icon: UploadCloud },
    { name: 'Data Cleaning', path: '/cleaning', icon: CheckSquare },
    { name: 'KPI Dashboard', path: '/kpis', icon: LayoutDashboard },
    { name: 'AI Insights', path: '/insights', icon: Lightbulb },
    { name: 'Action Plan', path: '/recommendations', icon: Sparkles },
    { name: 'Forecasting', path: '/forecasting', icon: TrendingUp },
    { name: 'Export Reports', path: '/export', icon: FileText },
    { name: 'AI Assistant Chat', path: '/chat', icon: MessageSquare },
  ];

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 w-full z-40">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-gradient-to-tr from-teal-400 to-cyan-500 rounded-lg text-slate-950 font-bold">
            CA
          </div>
          <span className="font-extrabold text-lg text-white">CORP<span className="text-teal-400">ANALYTICS</span></span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="text-slate-300 hover:text-white focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Sidebar overlay wrapper */}
      <div 
        className={`fixed inset-y-0 left-0 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-auto transition-transform duration-300 ease-in-out z-50 flex flex-col w-64 h-screen bg-slate-900/90 border-r border-slate-800 backdrop-blur-md`}
      >
        {/* Brand / Logo Area */}
        <div className="hidden lg:flex items-center space-x-3 px-6 py-6 border-b border-slate-800">
          <div className="p-2 bg-gradient-to-tr from-teal-400 to-cyan-500 rounded-xl text-slate-950 font-black shadow-[0_0_15px_rgba(20,184,166,0.3)]">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-black text-base text-white tracking-tight leading-none">
              CORP<span className="text-teal-400">ANALYTICS</span>
            </h1>
            <span className="text-[9px] font-bold text-slate-500 tracking-wider">ENTERPRISE HUB</span>
          </div>
        </div>

        {/* User Account Quick Info */}
        {user && (
          <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-900/40">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                <User className="h-4 w-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-teal-400 text-slate-950 shadow-[0_0_15px_rgba(45,212,191,0.2)] font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-teal-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions Area */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20 space-y-3">
          {/* Light/Dark mode Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800 rounded-xl cursor-pointer transition-colors duration-200"
          >
            <span className="flex items-center space-x-2">
              {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              <span>{isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </span>
          </button>

          {/* Sign Out Button */}
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-xl cursor-pointer transition-colors duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
      
      {/* Background dimmer overlay for mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
        />
      )}
    </>
  );
}
