import React from 'react';
import type { Tab } from '../App';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isAdmin: boolean;
}

interface NavButtonProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
    </svg>
);
const SellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.41 11.58l-9-9A2 2 0 0011 2H4a2 2 0 00-2 2v7a2 2 0 00.59 1.42l9 9a2 2 0 002.82 0l7-7a2 2 0 000-2.84zM6.5 8.5A1.5 1.5 0 118 7a1.5 1.5 0 01-1.5 1.5z"/>
    </svg>
);
const MarketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
    </svg>
);
const SupportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
    </svg>
);
const AdminIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
    </svg>
);


const NavButton: React.FC<NavButtonProps> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`relative flex flex-col items-center justify-center w-full h-full transition-colors duration-300 ${
            isActive ? 'text-sky-600' : 'text-gray-500 hover:text-sky-500'
        }`}
    >
        <div className={`relative flex items-center justify-center h-8 w-16 rounded-full transition-all duration-300 ${isActive ? 'bg-sky-100' : ''}`}>
            {icon}
        </div>
        <span className={`text-xs mt-0.5 font-medium transition-all duration-300 ${isActive ? 'text-sky-600' : 'text-gray-500'}`}>{label}</span>
    </button>
);


const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, isAdmin }) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
        <div className="max-w-5xl mx-auto px-4 h-full flex justify-around md:justify-center md:gap-16 items-center">
            <NavButton label="Home" icon={<HomeIcon />} isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
            <NavButton label="Sell" icon={<SellIcon />} isActive={activeTab === 'sell'} onClick={() => setActiveTab('sell')} />
            <NavButton label="Market" icon={<MarketIcon />} isActive={activeTab === 'market'} onClick={() => setActiveTab('market')} />
            <NavButton label="Support" icon={<SupportIcon />} isActive={activeTab === 'support'} onClick={() => setActiveTab('support')} />
            {isAdmin && (
                <NavButton label="Admin" icon={<AdminIcon />} isActive={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
            )}
        </div>
    </footer>
  );
};

export default BottomNav;