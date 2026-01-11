import { useState } from 'react';
import type { Message, Persona } from '../types';
import { User, Cpu, BrainCircuit, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageBubbleProps {
    message: Message;
    isLatest: boolean;
    interrogatorModel?: string;
    convincerModel?: string;
    persona?: Persona | null;
}

export function MessageBubble({ message, interrogatorModel, convincerModel, persona }: MessageBubbleProps) {
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isInterrogator ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400' : 'bg-black dark:bg-white text-white dark:text-black'}`}>
                        {isInterrogator ? <Cpu className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium text-center max-w-[60px] truncate" title={`${agentLabel} (${modelLabel})`}>
                        {!isInterrogator && agentLabel}
                    </span>
                </div>

                <div className={`flex flex-col max-w-[85%] ${isInterrogator ? 'items-start' : 'items-end'}`}>
                    <div className={`px-4 py-2.5 rounded-lg text-sm leading-relaxed ${isInterrogator
                        ? 'bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
                        : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'}`}>
                        {message.content}
                    </div>
                    <div className={`flex w-full justify-between gap-2 mt-1 ${isInterrogator ? '' : 'flex-row-reverse'}`}>
                        <span className="text-[10px] text-zinc-300 dark:text-zinc-600">{modelLabel}</span>
                        {isInterrogator && (message.internalThought || message.suspicionScore !== undefined) && (
                            <div className="">
                                <button
                                    onClick={() => setShowThought(!showThought)}
                                    className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                >
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800 flex items-center gap-1">{showThought ? 'Hide Analysis' : 'Show Analysis'} {showThought ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
                                    {message.suspicionScore !== undefined && (
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${message.suspicionScore > 70 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                                            message.suspicionScore > 40 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                                                'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                                            Suspicion: {message.suspicionScore}%
                                        </span>
                                    )}
                                </button>
                            </div>)}
                    </div>
                </div>
            </div>

            {isInterrogator && (message.internalThought || message.suspicionScore !== undefined) && (
                <div className="ml-12 max-w-[85%]">
                    <AnimatePresence>
                        {showThought && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-1.5 w-full p-3 bg-zinc-50 dark:bg-zinc-900 rounded-md border border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 italic">
                                    <div className="flex gap-2">
                                        <BrainCircuit className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0 mt-0.5" />
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
