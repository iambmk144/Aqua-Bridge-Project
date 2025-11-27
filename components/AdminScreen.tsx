
import React, { useState } from 'react';
import { HarvestRequest, HarvestStatus, ShrimpPrice, ShrimpGrade } from '../types';

const StatusBadge: React.FC<{ status: HarvestRequest['status'] }> = ({ status }) => {
    const baseClasses = "px-2 py-0.5 text-xs font-semibold rounded-full";
    let colorClasses = "";
    switch (status) {
        case 'Pending Approval':
            colorClasses = 'bg-orange-100 text-orange-800';
            break;
        case 'Finding Buyer':
            colorClasses = 'bg-yellow-100 text-yellow-800';
            break;
        case 'Buyer Found':
            colorClasses = 'bg-blue-100 text-blue-800';
            break;
        case 'Payment in Progress':
            colorClasses = 'bg-indigo-100 text-indigo-800';
            break;
        case 'Completed':
            colorClasses = 'bg-green-100 text-green-800';
            break;
    }
    return <span className={`${baseClasses} ${colorClasses}`}>{status}</span>;
};


const RequestCard: React.FC<{ request: HarvestRequest, onUpdate: (id: string, newStatus: HarvestStatus) => Promise<void> }> = ({ request, onUpdate }) => {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = async (newStatus: HarvestStatus) => {
        setIsUpdating(true);
        await onUpdate(request.id, newStatus);
        setIsUpdating(false);
    };

    const getNextAction = (): { label: string, nextStatus: HarvestStatus, style: string } | null => {
        switch (request.status) {
            case 'Pending Approval':
                return { label: 'Approve for Matching', nextStatus: 'Finding Buyer', style: 'bg-yellow-500 hover:bg-yellow-600' };
            case 'Finding Buyer':
                return { label: 'Mark Buyer Found', nextStatus: 'Buyer Found', style: 'bg-blue-500 hover:bg-blue-600' };
            case 'Buyer Found':
                return { label: 'Start Payment', nextStatus: 'Payment in Progress', style: 'bg-indigo-500 hover:bg-indigo-600' };
            case 'Payment in Progress':
                return { label: 'Mark as Completed', nextStatus: 'Completed', style: 'bg-green-500 hover:bg-green-600' };
            case 'Completed':
            default:
                return null;
        }
    };

    const action = getNextAction();

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-3 h-full flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-bold text-gray-800">{request.grade}</h3>
                        <p className="text-sm text-gray-500">{request.location}</p>
                    </div>
                    <StatusBadge status={request.status} />
                </div>
                <div className="text-sm text-gray-600 space-y-2 border-t pt-3">
                    <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span className="font-medium text-gray-900">{request.quantity} Kg</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Submitted:</span>
                        <span className="font-medium text-gray-900">{new Date(request.timestamp).toLocaleString()}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Farmer ID:</span>
                        <span className="font-medium text-gray-900 font-mono text-xs">{request.farmerId}</span>
                    </div>
                </div>
            </div>
            {action && (
                <div className="border-t pt-3 mt-3">
                    <button
                        onClick={() => handleUpdate(action.nextStatus)}
                        disabled={isUpdating}
                        className={`w-full text-white py-2 px-4 rounded-md font-semibold text-sm transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center ${action.style}`}
                    >
                        {isUpdating && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                        {isUpdating ? 'Updating...' : action.label}
                    </button>
                </div>
            )}
        </div>
    );
};

const PriceEditorCard: React.FC<{
    priceItem: ShrimpPrice;
    onUpdate: (grade: ShrimpGrade, newPrice: number) => Promise<void>;
}> = ({ priceItem, onUpdate }) => {
    const [newPrice, setNewPrice] = useState(priceItem.price.toString());
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = async () => {
        const priceValue = parseFloat(newPrice);
        if (isNaN(priceValue) || priceValue <= 0) {
            alert('Please enter a valid price.');
            return;
        }
        setIsUpdating(true);
        await onUpdate(priceItem.grade, priceValue);
        setIsUpdating(false);
    };

    return (
        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between space-y-2 h-full">
            <div className="flex flex-col">
                <p className="font-bold text-gray-800 text-sm">{priceItem.grade}</p>
                <p className="text-xs text-gray-500">Current: <span className="font-medium text-gray-700">₹{priceItem.price.toFixed(2)}</span></p>
            </div>
            <div className="flex items-center space-x-1 pt-1">
                <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 text-sm min-w-0"
                    placeholder="Price"
                    disabled={isUpdating}
                />
                <button
                    onClick={handleUpdate}
                    disabled={isUpdating || !newPrice || parseFloat(newPrice) === priceItem.price}
                    className="bg-sky-600 text-white px-2 py-1.5 rounded text-xs font-bold hover:bg-sky-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    {isUpdating ? '...' : 'Set'}
                </button>
            </div>
        </div>
    );
};


interface AdminScreenProps {
    allRequests: HarvestRequest[];
    onUpdateRequest: (id: string, newStatus: HarvestStatus) => Promise<void>;
    marketPrices: ShrimpPrice[];
    onUpdatePrice: (grade: ShrimpGrade, newPrice: number) => Promise<void>;
    isMarketLive: boolean;
    onToggleMarketStatus: (status: boolean) => Promise<void>;
}

const AdminScreen: React.FC<AdminScreenProps> = ({ allRequests, onUpdateRequest, marketPrices, onUpdatePrice, isMarketLive, onToggleMarketStatus }) => {
    const [isToggling, setIsToggling] = useState(false);

    const handleToggle = async () => {
        setIsToggling(true);
        await onToggleMarketStatus(!isMarketLive);
        setIsToggling(false);
    };

    return (
        <div className="h-full overflow-y-auto hide-scrollbar p-4 space-y-8">
            <section>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 space-y-4 md:space-y-0">
                    <h2 className="text-2xl font-bold text-gray-800">Manage Market Prices</h2>
                    <div className="flex items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                        <span className={`text-sm font-medium mr-3 ${isMarketLive ? 'text-green-600' : 'text-orange-600'}`}>
                            {isMarketLive ? '● Market is LIVE' : '● Market is PAUSED'}
                        </span>
                        <button 
                            onClick={handleToggle}
                            disabled={isToggling}
                            className={`px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors ${isMarketLive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} disabled:opacity-50`}
                        >
                            {isToggling ? 'Processing...' : isMarketLive ? 'Stop Live Updates' : 'Resume Live Updates'}
                        </button>
                    </div>
                </div>
                
                {!isMarketLive && (
                    <div className="mb-6 bg-orange-50 border-l-4 border-orange-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-orange-700">
                                    Users are currently seeing a "Prices Updating" message. You can update prices below without them seeing changes in real-time.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {marketPrices.map(priceItem => (
                        <PriceEditorCard key={priceItem.grade} priceItem={priceItem} onUpdate={onUpdatePrice} />
                    ))}
                </div>
            </section>
            
            <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Incoming Harvest Requests</h2>
                
                {allRequests.length === 0 ? (
                    <div className="text-center py-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7s-4 4 0 4s4-4 4-4" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11s-4 4 0 4s4-4 4-4" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No active requests</h3>
                        <p className="mt-1 text-sm text-gray-500">New harvest requests from farmers will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allRequests.map(request => (
                            <RequestCard key={request.id} request={request} onUpdate={onUpdateRequest} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default AdminScreen;
