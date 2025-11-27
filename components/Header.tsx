
import React from 'react';

const NotificationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V5a1 1 0 00-2 0v.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const HeaderLogo = () => (
    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600 drop-shadow-sm select-none leading-none pb-1">
        A
    </span>
);

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);
  

interface HeaderProps {
    onLogout: () => void;
    isAdmin: boolean;
}

const Header: React.FC<HeaderProps> = ({ onLogout, isAdmin }) => {
  return (
    <header className="bg-white border-b border-slate-200 flex-shrink-0 shadow-sm z-20">
      <div className="max-w-5xl mx-auto p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
            <HeaderLogo />
            <div>
                <h1 className="text-lg font-bold text-gray-800 leading-tight">Aqua Bridge</h1>
                <p className="text-xs text-gray-500">{isAdmin ? 'Welcome, Admin!' : 'Welcome, Farmer!'}</p>
            </div>
        </div>
        <div className="flex items-center space-x-2">
            <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
                <NotificationIcon />
                <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white"></span>
            </button>
            <button onClick={onLogout} className="p-2 rounded-full hover:bg-slate-100 transition-colors" aria-label="Logout">
                <LogoutIcon />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;