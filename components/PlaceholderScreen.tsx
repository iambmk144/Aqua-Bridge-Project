
import React from 'react';

interface PlaceholderScreenProps {
    title: string;
    message: string;
    icon: React.ComponentType;
}

const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({ title, message, icon: Icon }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-50">
            <div className="bg-sky-100 rounded-full p-5 mb-6">
               <Icon />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
            <p className="text-gray-600 max-w-sm">{message}</p>
            <div className="mt-8 bg-slate-200 text-slate-600 text-xs font-semibold px-3 py-1 rounded-full">
                COMING SOON
            </div>
        </div>
    );
};

export default PlaceholderScreen;
