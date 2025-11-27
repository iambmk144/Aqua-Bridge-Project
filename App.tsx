
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomeScreen from './components/HomeScreen';
import Chatbot from './components/Chatbot';
import PlaceholderScreen from './components/PlaceholderScreen';
import LoginScreen from './components/LoginScreen';
import SellHarvestScreen from './components/SellHarvestScreen';
import AdminScreen from './components/AdminScreen';
import { HarvestRequest, HarvestStatus, ShrimpPrice, ShrimpGrade } from './types';
import { submitHarvestRequest, getHarvestRequestsForUser, getAllHarvestRequests, updateHarvestRequestStatus, getMarketPrices, updateMarketPrice, getMarketStatus, updateMarketStatus } from './services/apiService';

export type Tab = 'home' | 'sell' | 'market' | 'support' | 'admin';

// Define the admin phone number
const ADMIN_PHONE_NUMBER = '7995675571';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [harvestRequest, setHarvestRequest] = useState<HarvestRequest | null>(null);
  const [allHarvestRequests, setAllHarvestRequests] = useState<HarvestRequest[]>([]);
  const [marketPrices, setMarketPrices] = useState<ShrimpPrice[]>([]);
  const [isMarketLive, setIsMarketLive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const loadAdminData = async () => {
    const allRequests = await getAllHarvestRequests();
    setAllHarvestRequests(allRequests);
  };

  useEffect(() => {
    if(isLoggedIn && currentUser) {
      // Fetch data once the user is logged in
      const loadData = async () => {
        setIsLoading(true);

        const [userRequests, prices, marketStatus] = await Promise.all([
          getHarvestRequestsForUser(currentUser),
          getMarketPrices(),
          getMarketStatus()
        ]);
        
        setMarketPrices(prices);
        setIsMarketLive(marketStatus);

        // Find the most recent, non-completed request for the user
        const activeRequest = userRequests
            .filter(req => req.status !== 'Completed')
            .sort((a, b) => b.timestamp - a.timestamp)[0] || null;
        setHarvestRequest(activeRequest);
        
        // Load all requests for the admin view if the user is an admin
        if (isAdmin) {
          await loadAdminData();
        }
        
        setIsLoading(false);
      };
      loadData();
    }
  }, [isLoggedIn, currentUser, isAdmin]);

  const handleLoginSuccess = (phoneNumber: string) => {
    setCurrentUser(phoneNumber);
    setIsAdmin(phoneNumber === ADMIN_PHONE_NUMBER);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab('home');
    setHarvestRequest(null);
    setAllHarvestRequests([]);
    setMarketPrices([]);
    setIsMarketLive(true);
    setCurrentUser(null);
    setIsAdmin(false);
  };
  
  const handleHarvestSubmit = async (details: Omit<HarvestRequest, 'id' | 'farmerId' | 'status' | 'timestamp'>) => {
    if (!currentUser) return;
    const newRequest = await submitHarvestRequest({
      ...details,
      farmerId: currentUser,
    });
    setHarvestRequest(newRequest);
    // Refresh admin data if admin is the one submitting (for testing, etc.)
     if (isAdmin) {
        await loadAdminData();
     }
    
    setActiveTab('home');
  }

  const handleUpdatePrice = async (grade: ShrimpGrade, newPrice: number) => {
    await updateMarketPrice(grade, newPrice);
    const updatedPrices = await getMarketPrices();
    setMarketPrices(updatedPrices);
  };
  
  const handleToggleMarketStatus = async (status: boolean) => {
      await updateMarketStatus(status);
      setIsMarketLive(status);
  };
  
  const handleUpdateRequestStatus = async (requestId: string, newStatus: HarvestStatus) => {
    await updateHarvestRequestStatus(requestId, newStatus);
    // Refresh data for both user and admin after an update
    await loadAdminData();
    
    if (currentUser) {
      const userRequests = await getHarvestRequestsForUser(currentUser);
      const activeRequest = userRequests
          .filter(req => req.status !== 'Completed')
          .sort((a, b) => b.timestamp - a.timestamp)[0] || null;
      setHarvestRequest(activeRequest);
    }
  };

  const renderContent = () => {
    if (isLoading && isLoggedIn) {
      return <div className="flex justify-center items-center h-full"><p className="text-sky-600 font-medium">Loading...</p></div>
    }

    if (activeTab === 'admin' && !isAdmin) {
        // Fallback in case user tries to access admin tab without privileges
        return <HomeScreen onSellHarvest={() => setActiveTab('sell')} harvestRequest={harvestRequest} marketPrices={marketPrices} isMarketLive={isMarketLive} />;
    }

    switch (activeTab) {
      case 'home':
        return <HomeScreen onSellHarvest={() => setActiveTab('sell')} harvestRequest={harvestRequest} marketPrices={marketPrices} isMarketLive={isMarketLive} />;
      case 'support':
        return <Chatbot />;
      case 'sell':
        return <SellHarvestScreen onHarvestSubmit={handleHarvestSubmit} harvestRequest={harvestRequest} />;
      case 'market':
        return <PlaceholderScreen title="Marketplace" icon={MarketIcon} message="Order quality feed and medicine from trusted suppliers, delivered to your farm." />;
      case 'admin':
        return <AdminScreen allRequests={allHarvestRequests} onUpdateRequest={handleUpdateRequestStatus} marketPrices={marketPrices} onUpdatePrice={handleUpdatePrice} isMarketLive={isMarketLive} onToggleMarketStatus={handleToggleMarketStatus} />;
      default:
        return <HomeScreen onSellHarvest={() => setActiveTab('sell')} harvestRequest={harvestRequest} marketPrices={marketPrices} isMarketLive={isMarketLive} />;
    }
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen w-full flex flex-col bg-sky-50 overflow-hidden">
      <Header onLogout={handleLogout} isAdmin={isAdmin} />
      <main className="flex-grow relative overflow-hidden pb-20">
        <div className="h-full w-full max-w-5xl mx-auto bg-sky-50 md:bg-transparent relative">
             {renderContent()}
        </div>
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin} />
    </div>
  );
};

// Icon for placeholder screen
const MarketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
);


export default App;
