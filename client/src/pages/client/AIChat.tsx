import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Bot, Lightbulb, Scale, FileText, Clock } from 'lucide-react';
import { Button, GlassCard } from '../../components/common';
import { aiAPI } from '../../services/api';
import './AIChat.css';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const suggestedPrompts = [
    { icon: <Scale size={18} />, text: 'What are my rights in a property dispute?' },
    { icon: <FileText size={18} />, text: 'What documents do I need for a divorce case?' },
    { icon: <Clock size={18} />, text: 'How long does a consumer complaint take?' },
    { icon: <Lightbulb size={18} />, text: 'Can I file a case without an advocate?' }
];

export function AIChat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Hello! I\'m your AI Legal Assistant. I can help you understand legal concepts, explain procedures, and guide you through the legal process. How can I assist you today?',
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
        if (!messageText.trim()) return;

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

            if (response.data.success) {
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: response.data.data.response,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
            }
        } catch (error: any) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'I apologize, but I am having trouble connecting to my legal knowledge base. Please try again in a moment.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
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

    return (
        <div className="ai-chat-page">
            <div className="chat-container">
                <div className="chat-header">
                    <div className="chat-header-icon">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h1>AI Legal Assistant</h1>
                        <p>Get instant answers to your legal questions</p>
                    </div>
                </div>

                <div className="chat-messages">
                    {messages.map((message) => (
                        <div key={message.id} className={`message ${message.role}`}>
                            <div className="message-avatar">
                                {message.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                            </div>
                            <div className="message-content">
                                <div className="message-text">{message.content}</div>
                                <div className="message-time">
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
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
                        <p className="prompts-title">Try asking:</p>
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
                            placeholder="Ask a legal question..."
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
                        This AI provides general legal information, not legal advice. Consult a qualified advocate for specific matters.
                    </p>
                </div>
            </div>
        </div>
    );
}
