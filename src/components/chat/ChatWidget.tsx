'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hi! I\'m your AI shopping assistant. How can I help you find the perfect software today?' },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/ai-assistant/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages.slice(-10),
                }),
            });

            const data = await res.json();

            if (data.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.data.message }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: 'Sorry, I couldn\'t process that. Please try again or contact support.'
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Connection error. Please check your internet and try again.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[500px] bg-card border rounded-lg shadow-xl flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
                        <Bot className="h-6 w-6" />
                        <div>
                            <h3 className="font-semibold">AI Assistant</h3>
                            <p className="text-xs opacity-80">Ask me anything about our products</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea ref={scrollRef} className="flex-1 p-4">
                        <div className="space-y-4">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                        }`}>
                                        {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                    </div>
                                    <div className={`rounded-lg px-3 py-2 max-w-[80%] ${msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                        }`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                    <div className="bg-muted rounded-lg px-3 py-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Input */}
                    <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            disabled={isLoading}
                            className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            )}
        </>
    );
}
