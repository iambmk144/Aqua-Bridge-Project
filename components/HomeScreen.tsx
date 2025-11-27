
import React from 'react';
import { ShrimpPrice, HarvestRequest } from '../types';

interface HomeScreenProps {
    onSellHarvest: () => void;
    harvestRequest: HarvestRequest | null;
    marketPrices: ShrimpPrice[];
    isMarketLive: boolean;
}

const PriceCard: React.FC<{ item: ShrimpPrice }> = ({ item }) => {
  const change = item.price - (item.previousPrice ?? item.price);
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  const badgeClasses = isPositive
    ? 'bg-emerald-100 text-emerald-700'
    : isNegative
    ? 'bg-rose-100 text-rose-700'
    : 'bg-slate-100 text-slate-600';

  const icon = isPositive ? '▲' : isNegative ? '▼' : '—';
  const changeText = isNeutral ? 'Stable' : `₹${Math.abs(change).toFixed(2)}`;

  return (
    <div className="bg-white p-3 rounded-2xl shadow-sm border border-sky-100 flex flex-col items-center justify-center text-center space-y-2 transform transition-all duration-200 hover:scale-105 hover:shadow-md h-full">
      <p className="text-xs font-black text-black uppercase tracking-wider">{item.grade}</p>
      <p className="text-xl font-extrabold text-sky-600 tracking-tight">₹{item.price.toFixed(2)}</p>
      <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClasses}`}>
        {icon}
        <span className="ml-1">{changeText}</span>
      </div>
    </div>
  );
};

const SaleStatusCard: React.FC<{ request: HarvestRequest }> = ({ request }) => (
    <div className="bg-white p-3 rounded-xl shadow-sm border border-sky-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
             <div className="h-10 w-10 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0 border border-sky-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div>
                <p className="text-sm font-bold text-gray-800">Harvest Listed</p>
                <p className="text-xs text-gray-500 font-medium">{request.grade} • {request.quantity} Kg</p>
            </div>
        </div>
        <div className="bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
             <p className="text-xs font-bold text-sky-700">{request.status}</p>
        </div>
    </div>
);


const ActionCard: React.FC<{icon: React.ReactNode, title: string, subtitle: string, onClick: () => void, iconBg: string}> = ({ icon, title, subtitle, onClick, iconBg }) => (
    <button onClick={onClick} className="bg-white p-4 rounded-2xl shadow-sm border border-sky-100 hover:border-sky-300 hover:shadow-md flex items-center space-x-4 text-left w-full transition-all duration-200 group h-full">
        <div className={`p-3 rounded-xl transition-colors ${iconBg} group-hover:scale-105 transform duration-200 shadow-sm`}>{icon}</div>
        <div className="flex-grow">
            <p className="font-bold text-gray-800 text-md group-hover:text-sky-700 transition-colors">{title}</p>
            <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
         <div className="h-8 w-8 rounded-full bg-sky-50 flex items-center justify-center group-hover:bg-sky-100 transition-all">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-400 group-hover:text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
         </div>
    </button>
);


const HomeScreen: React.FC<HomeScreenProps> = ({ onSellHarvest, harvestRequest, marketPrices, isMarketLive }) => {
  return (
    <div className="h-full overflow-y-auto hide-scrollbar p-4 sm:p-5 space-y-6 sm:space-y-8">
      {harvestRequest && (
        <section>
             <h2 className="text-lg font-bold text-gray-800 mb-3 px-1">Sale Status</h2>
             <div className="max-w-lg">
                <SaleStatusCard request={harvestRequest} />
             </div>
        </section>
      )}

      <section>
        <div className="flex justify-between items-baseline mb-3 px-1">
            <h2 className="text-lg font-bold text-gray-800">Live Market Prices</h2>
            {isMarketLive && <span className="text-xs text-sky-600 font-semibold bg-sky-100 px-2 py-1 rounded-full">Updated today</span>}
        </div>
        {isMarketLive ? (
            /* Responsive Grid: 3 cols mobile, 4 cols sm, 5 cols md, 6 cols lg */
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
            {marketPrices.map((item) => (
                <PriceCard key={item.grade} item={item} />
            ))}
            </div>
        ) : (
            <div className="bg-gradient-to-r from-sky-100 to-blue-100 border border-sky-200 rounded-2xl p-8 text-center shadow-inner">
                 <div className="flex justify-center mb-3">
                     <div className="relative">
                        <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-sky-600 relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                     </div>
                 </div>
                 <h3 className="text-lg font-bold text-sky-800 mb-1 animate-pulse">Prices Updating</h3>
                 <p className="text-sky-700 text-sm font-medium">We are currently updating market prices. <br/>Please check back shortly.</p>
            </div>
        )}
      </section>
      
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-3 px-1">Quick Actions</h2>
        {/* Responsive Grid: 1 col mobile, 2 cols md */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <ActionCard 
            onClick={onSellHarvest}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            title="Sell Your Harvest"
            subtitle="Get the best price"
            iconBg="bg-gradient-to-br from-sky-500 to-blue-600"
          />
           <ActionCard 
            onClick={() => {}}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.4 7.6l-2.8-2.8A2 2 0 0015.2 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8.8c0-.5-.2-1-.6-1.4z" /><path d="M14 2v4a2 2 0 002 2h4" /><path d="M9 14h6" /><path d="M9 17h3" /></svg>}
            title="Request Lab Test"
            subtitle="Free water & soil testing"
            iconBg="bg-gradient-to-br from-teal-400 to-emerald-500"
          />
        </div>
      </section>
    </div>
  );
};

export default HomeScreen;
