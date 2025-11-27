import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { ChatMessage, MessageAuthor } from '../types';
import { geminiChat } from '../services/geminiService';

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.author === MessageAuthor.USER;
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-sm ${
                    isUser ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-br-lg' : 'bg-white text-gray-800 rounded-bl-lg border border-slate-100'
                }`}
            >
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            </div>
        </div>
    );
};

const TypingIndicator: React.FC = () => (
    <div className="flex justify-start">
        <div className="bg-white text-gray-800 rounded-2xl rounded-bl-lg px-4 py-3 border border-slate-100 shadow-sm">
            <div className="flex items-center space-x-1">
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
            </div>
        </div>
    </div>
);

const SuggestionChip: React.FC<{text: string, onClick: () => void}> = ({text, onClick}) => (
    <button onClick={onClick} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-sky-700 font-medium hover:bg-sky-50 transition-colors">
        {text}
    </button>
)

const Chatbot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { author: MessageAuthor.AI, text: "Hello! I'm Aqua-Helper. How can I assist you with your farm today? Feel free to ask about shrimp health, water quality, or feed management." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim() || isLoading) return;

        const userMessage: ChatMessage = { author: MessageAuthor.USER, text: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await geminiChat.sendMessage({ message: messageText });
            const aiMessage: ChatMessage = { author: MessageAuthor.AI, text: response.text };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Gemini API error:", error);
            const errorMessage: ChatMessage = { author: MessageAuthor.AI, text: "Sorry, I'm having trouble connecting. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleSuggestionClick = (suggestion: string) => {
        sendMessage(suggestion);
    }
    
    return (
        <div className="h-full flex flex-col relative">
            <div className="flex-grow space-y-4 overflow-y-auto p-4 pb-4">
                {messages.map((msg, index) => (
                    <ChatBubble key={index} message={msg} />
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t border-slate-200 sticky bottom-0">
                <div className="max-w-5xl mx-auto w-full">
                    {!isLoading && messages.length <= 2 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-3">
                             <SuggestionChip text="Shrimp disease?" onClick={() => handleSuggestionClick("What are common shrimp diseases?")}/>
                             <SuggestionChip text="Water quality?" onClick={() => handleSuggestionClick("Best water quality tips for shrimp?")}/>
                             <SuggestionChip text="Best feed?" onClick={() => handleSuggestionClick("What is the best feed for Vannamei shrimp?")}/>
                        </div>
                    )}
                    <form onSubmit={handleFormSubmit} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask Aqua-Helper..."
                            className="flex-grow p-3 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            className="bg-sky-600 text-white rounded-full p-3 disabled:bg-sky-300 hover:bg-sky-700 transition-colors flex-shrink-0"
                            disabled={isLoading || !input.trim()}
                            aria-label="Send message"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;