import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Bot, Lightbulb, Scale, FileText, Clock, Shield, Building2, Gavel, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button, GlassCard } from '../../components/common';
import { aiAPI } from '../../services/api';
import './AIChat.css';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    suggestions?: string[];
}

const suggestedPrompts = [
    { icon: <Scale size={18} />, text: 'What are my rights in a property dispute?' },
    { icon: <FileText size={18} />, text: 'How do I file an FIR if police refuse?' },
    { icon: <Clock size={18} />, text: 'How long does a consumer complaint take?' },
    { icon: <Lightbulb size={18} />, text: 'Can I file a case without an advocate?' },
    { icon: <Shield size={18} />, text: 'What are my rights if I get arrested?' },
    { icon: <Building2 size={18} />, text: 'How to register a startup in India?' },
    { icon: <Gavel size={18} />, text: 'What are grounds for divorce in India?' },
    { icon: <Lightbulb size={18} />, text: 'How to report a cyber crime online?' },
];

export function AIChat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Hello! 👋 I\'m your **Nexora AI Legal Assistant**. I can help you understand Indian legal concepts, explain procedures, and guide you through the legal process.\n\nI cover topics including **Property Law**, **Criminal Law**, **Family Law**, **Consumer Rights**, **Labor Law**, **Cyber Crime**, **Tax Law**, **Constitutional Law**, and more.\n\nHow can I assist you today?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (text?: string) => {
        const messageText = text || input;
        if (!messageText.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await aiAPI.chat(messageText);
            const resData = response.data?.data || response.data;

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: resData?.response || 'I\'m sorry, I couldn\'t process that. Please try rephrasing your question.',
                timestamp: new Date(),
                suggestions: resData?.suggestions || ['What are my property rights?', 'How to file an FIR?', 'Tell me about consumer protection']
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error: any) {
            console.error('Chat error:', error);
            // Try to extract response from error if server returned one
            const errorData = error?.response?.data?.data || error?.response?.data;
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: errorData?.response || 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment or rephrase your question.',
                timestamp: new Date(),
                suggestions: errorData?.suggestions || ['Property law help', 'Criminal law help', 'Family law help']
            };
            setMessages(prev => [...prev, assistantMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClearChat = () => {
        setMessages([{
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Chat cleared! 🔄 How can I help you with your legal question?',
            timestamp: new Date()
        }]);
    };

    return (
        <div className="ai-chat-page">
            <div className="chat-container">
                <div className="chat-header">
                    <div className="chat-header-icon">
                        <Sparkles size={24} />
                    </div>
                    <div className="chat-header-info">
                        <h1>AI Legal Assistant</h1>
                        <p>Get instant answers to your legal questions</p>
                    </div>
                    <button className="clear-chat-btn" onClick={handleClearChat} title="Clear chat">
                        <RefreshCw size={18} />
                    </button>
                </div>

                <div className="chat-messages">
                    {messages.map((message) => (
                        <div key={message.id} className={`message ${message.role}`}>
                            <div className="message-avatar">
                                {message.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                            </div>
                            <div className="message-content">
                                <div className="message-text">
                                    {message.role === 'assistant' ? (
                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                    ) : (
                                        message.content
                                    )}
                                </div>
                                <div className="message-time">
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                {message.suggestions && message.suggestions.length > 0 && (
                                    <div className="message-suggestions">
                                        <span className="suggestions-label">Related questions:</span>
                                        <div className="suggestions-list">
                                            {message.suggestions.map((s, i) => (
                                                <button key={i} className="suggestion-chip" onClick={() => handleSend(s)}>
                                                    <Lightbulb size={14} />
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="message assistant">
                            <div className="message-avatar"><Bot size={20} /></div>
                            <div className="message-content">
                                <div className="typing-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {messages.length === 1 && (
                    <div className="suggested-prompts">
                        <p className="prompts-title">💡 Try asking:</p>
                        <div className="prompts-grid">
                            {suggestedPrompts.map((prompt, i) => (
                                <button
                                    key={i}
                                    className="prompt-button"
                                    onClick={() => handleSend(prompt.text)}
                                >
                                    {prompt.icon}
                                    <span>{prompt.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="chat-input-container">
                    <GlassCard variant="liquid" className="chat-input-card">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask any legal question... (e.g., 'How to file for bail?')"
                            rows={1}
                            disabled={isLoading}
                        />
                        <Button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className="send-button"
                        >
                            <Send size={20} />
                        </Button>
                    </GlassCard>
                    <p className="disclaimer">
                        ⚖️ This AI provides general legal information, not legal advice. Consult a qualified advocate for specific matters.
                    </p>
                </div>
            </div>
        </div>
    );
}
