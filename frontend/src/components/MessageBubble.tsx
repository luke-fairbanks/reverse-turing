import { useState } from 'react';
import type { Message, Persona } from '../types';
import { User, Cpu, BrainCircuit, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageBubbleProps {
    message: Message;
    isLatest: boolean;
    interrogatorModel?: string;
    convincerModel?: string;
    persona?: Persona | null;
}

export function MessageBubble({ message, isLatest, interrogatorModel, convincerModel, persona }: MessageBubbleProps) {
    const isInterrogator = message.agent === 'interrogator';
    const [showThought, setShowThought] = useState(false);

    const agentLabel = isInterrogator
        ? `Interrogator`
        : persona?.name || 'Convincer';

    const modelLabel = isInterrogator
        ? interrogatorModel || 'gpt-4o-mini'
        : convincerModel || 'gpt-4o-mini';

    return (
        <div className={`space-y-1 ${isInterrogator ? '' : 'flex flex-col items-end'}`}>
            <div className={`flex gap-4 ${isInterrogator ? '' : 'flex-row-reverse'}`}>
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isInterrogator ? 'bg-zinc-100 text-zinc-500' : 'bg-black text-white'
                        }`}>
                        {isInterrogator ? <Cpu className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium text-center max-w-[60px] truncate" title={`${agentLabel} (${modelLabel})`}>
                        {!isInterrogator && agentLabel}
                    </span>
                </div>

                <div className={`flex flex-col max-w-[85%] ${isInterrogator ? 'items-start' : 'items-end'}`}>
                    <div className={`px-4 py-2.5 rounded-lg text-sm leading-relaxed ${isInterrogator
                        ? 'bg-zinc-50 border border-zinc-100 text-zinc-800'
                        : 'bg-zinc-100 text-zinc-900'
                        }`}>
                        {message.content}
                    </div>
                    <div className={`flex w-full justify-between gap-2 mt-1 ${isInterrogator ? '' : 'flex-row-reverse'}`}>
                        <span className="text-[10px] text-zinc-300 ">{modelLabel}</span>
                        {isInterrogator && (message.internalThought || message.suspicionScore !== undefined) && (
                            <div className="">
                                <button
                                    onClick={() => setShowThought(!showThought)}
                                    className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-zinc-400 hover:text-zinc-600 transition-colors"
                                >
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 flex items-center gap-1">{showThought ? 'Hide Analysis' : 'Show Analysis'} {showThought ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
                                    {message.suspicionScore !== undefined && (
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${message.suspicionScore > 70 ? 'bg-red-100 text-red-600' :
                                            message.suspicionScore > 40 ? 'bg-amber-100 text-amber-600' :
                                                'bg-emerald-100 text-emerald-600'
                                            }`}>
                                            Suspicion: {message.suspicionScore}%
                                        </span>
                                    )}
                                </button>
                            </div>)}
                    </div>
                </div>
            </div>

            {/* Internal Thought / Analysis (Only for Interrogator) */}
            {isInterrogator && (message.internalThought || message.suspicionScore !== undefined) && (
                <div className="ml-12 max-w-[85%]">
                    {/* <button
                        onClick={() => setShowThought(!showThought)}
                        className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                        {showThought ? 'Hide Analysis' : 'Show Analysis'}
                        {message.suspicionScore !== undefined && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${message.suspicionScore > 70 ? 'bg-red-100 text-red-600' :
                                message.suspicionScore > 40 ? 'bg-amber-100 text-amber-600' :
                                    'bg-emerald-100 text-emerald-600'
                                }`}>
                                Suspicion: {message.suspicionScore}%
                            </span>
                        )}
                    </button> */}

                    <AnimatePresence>
                        {showThought && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-1.5 w-full p-3 bg-zinc-50 rounded-md border border-zinc-100 text-xs text-zinc-600 italic">
                                    <div className="flex gap-2">
                                        <BrainCircuit className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                                        <p>"{message.internalThought}"</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
