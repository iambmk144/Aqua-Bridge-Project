import React, { useState, FormEvent } from 'react';
import { ShrimpGrade, HarvestRequest } from '../types';

interface SellHarvestScreenProps {
    onHarvestSubmit: (details: Omit<HarvestRequest, 'id' | 'farmerId' | 'status' | 'timestamp'>) => void;
    harvestRequest: HarvestRequest | null;
}

const shrimpGrades = Object.values(ShrimpGrade);

const SellHarvestScreen: React.FC<SellHarvestScreenProps> = ({ onHarvestSubmit, harvestRequest }) => {
    const [grade, setGrade] = useState<ShrimpGrade | ''>('');
    const [quantity, setQuantity] = useState('');
    const [location, setLocation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ grade?: string; quantity?: string; location?: string }>({});

    const validate = () => {
        const newErrors: { grade?: string; quantity?: string; location?: string } = {};
        if (!grade) newErrors.grade = "Please select a shrimp grade.";
        if (!quantity) {
            newErrors.quantity = "Please enter the harvest quantity.";
        } else if (Number(quantity) <= 0) {
            newErrors.quantity = "Quantity must be greater than zero.";
        }
        if (!location.trim()) newErrors.location = "Please enter your farm location.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await onHarvestSubmit({
                grade: grade as ShrimpGrade,
                quantity,
                location,
            });
        } catch (error) {
            console.error("Failed to submit harvest:", error);
            setIsSubmitting(false);
        }
    };

    const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setGrade(e.target.value as ShrimpGrade);
        if (errors.grade) setErrors({ ...errors, grade: undefined });
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuantity(e.target.value);
        if (errors.quantity) setErrors({ ...errors, quantity: undefined });
    };

    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocation(e.target.value);
        if (errors.location) setErrors({ ...errors, location: undefined });
    };

    if (harvestRequest) {
        return (
            <div className="p-4 h-full flex flex-col items-center justify-center text-center bg-gradient-to-b from-white to-sky-50 overflow-y-auto hide-scrollbar">
                <div className="max-w-md w-full flex flex-col items-center my-auto">
                     <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mb-6 relative shadow-lg border border-sky-200">
                        <svg className="w-10 h-10 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                         <span className="absolute h-full w-full rounded-full border-4 border-sky-200 opacity-50 animate-ping"></span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Listing Active</h2>
                    <p className="text-gray-600 max-w-sm mb-6">We are actively searching for the best buyer for your harvest.</p>

                    <div className="bg-white rounded-xl p-6 shadow-md shadow-sky-100 border border-sky-100 space-y-4 w-full">
                       <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-500">Shrimp Grade</span>
                            <span className="font-bold text-black">{harvestRequest.grade}</span>
                       </div>
                       <div className="h-px bg-slate-100" />
                       <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-500">Quantity</span>
                            <span className="font-bold text-gray-800">{harvestRequest.quantity} Kg</span>
                       </div>
                       <div className="h-px bg-slate-100" />
                       <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-500">Location</span>
                            <span className="font-bold text-gray-800">{harvestRequest.location}</span>
                       </div>
                        <div className="h-px bg-slate-100" />
                       <div className="flex justify-between items-center pt-2">
                            <span className="font-medium text-gray-500">Status</span>
                            <span className="font-bold text-sky-600 inline-flex items-center bg-sky-50 px-3 py-1 rounded-full text-sm border border-sky-100">
                                <span className="relative flex h-2 w-2 mr-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                                </span>
                                {harvestRequest.status}
                            </span>
                       </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-sky-50/30">
            <div className="p-6 bg-white shadow-sm border-b border-sky-100 z-10">
                <h2 className="text-2xl font-bold text-gray-800 text-center">Sell Your Harvest</h2>
                <p className="text-center text-sm text-gray-500 mt-1">Fill in the details below to find the best buyer.</p>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6 hide-scrollbar">
                <form onSubmit={handleSubmit} className="max-w-xl mx-auto w-full flex flex-col h-full">
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="grade" className="block text-sm font-semibold text-gray-700 mb-2">
                                Shrimp Grade <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    id="grade"
                                    value={grade}
                                    onChange={handleGradeChange}
                                    className={`w-full p-4 bg-white border rounded-xl focus:outline-none focus:ring-2 appearance-none transition-all shadow-sm text-gray-900 ${
                                        errors.grade 
                                        ? 'border-red-300 focus:ring-red-200 bg-red-50' 
                                        : 'border-slate-200 focus:border-sky-500 focus:ring-sky-100'
                                    }`}
                                >
                                    <option value="" disabled className="text-gray-500">Select shrimp count</option>
                                    {shrimpGrades.map(g => <option key={g} value={g} className="text-gray-900">{g}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                </div>
                            </div>
                            {errors.grade && <p className="text-red-500 text-xs mt-2 font-medium flex items-center animate-pulse"><span className="mr-1 text-lg">⚠</span>{errors.grade}</p>}
                        </div>
                        
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-semibold text-gray-700 mb-2">
                                Quantity (Kg) <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="quantity"
                                type="number"
                                value={quantity}
                                onChange={handleQuantityChange}
                                placeholder="e.g., 500"
                                className={`w-full p-4 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all shadow-sm text-gray-900 ${
                                    errors.quantity 
                                    ? 'border-red-300 focus:ring-red-200 bg-red-50' 
                                    : 'border-slate-200 focus:border-sky-500 focus:ring-sky-100'
                                }`}
                            />
                            {errors.quantity && <p className="text-red-500 text-xs mt-2 font-medium flex items-center animate-pulse"><span className="mr-1 text-lg">⚠</span>{errors.quantity}</p>}
                        </div>
                        
                        <div>
                            <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                                Farm Location <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="location"
                                type="text"
                                value={location}
                                onChange={handleLocationChange}
                                placeholder="e.g., Nellore, Andhra Pradesh"
                                className={`w-full p-4 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all shadow-sm text-gray-900 ${
                                    errors.location 
                                    ? 'border-red-300 focus:ring-red-200 bg-red-50' 
                                    : 'border-slate-200 focus:border-sky-500 focus:ring-sky-100'
                                }`}
                            />
                             {errors.location && <p className="text-red-500 text-xs mt-2 font-medium flex items-center animate-pulse"><span className="mr-1 text-lg">⚠</span>{errors.location}</p>}
                        </div>
                    </div>
                    
                    <div className="mt-8 lg:mt-12">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-4 rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 active:from-sky-700 active:to-blue-800 transition-all duration-200 shadow-lg shadow-sky-200/50 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isSubmitting ? (
                                 <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Submitting...
                                 </>
                            ) : (
                                'Submit Selling Order'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SellHarvestScreen;
