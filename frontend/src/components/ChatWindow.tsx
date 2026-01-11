import { useRef, useEffect } from 'react';
import type { Message, Persona } from '../types';
import { MessageBubble } from './MessageBubble';

interface ChatWindowProps {
    messages: Message[];
    isLoading: boolean;
    currentTurn: number;
    maxTurns: number;
    className?: string;
    interrogatorModel?: string;
    convincerModel?: string;
    persona?: Persona | null;
}

export function ChatWindow({ messages, isLoading, currentTurn, maxTurns, className, interrogatorModel, convincerModel, persona }: ChatWindowProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Messages */}
            <div className="space-y-6">
                {messages.length === 0 ? (
                    <div className="py-20 text-center">
                        <p className="text-zinc-300 text-sm">Conversation thread empty</p>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            isLatest={index === messages.length - 1}
                            interrogatorModel={interrogatorModel}
                            convincerModel={convincerModel}
                            persona={persona}
                        />
                    ))
                )}

                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100" />
                        <div className="flex gap-1 items-center h-8">
                            <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce delay-0" />
                            <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce delay-150" />
                            <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce delay-300" />
                        </div>
                    </div>
                )}

                <div ref={bottomRef} className="h-4" />
            </div>
        </div>
    );
}
