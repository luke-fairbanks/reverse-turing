import { useState } from 'react';
import type { Conversation } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface VerdictCardProps {
    conversation: Conversation;
}

export function VerdictCard({ conversation }: VerdictCardProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    if (!conversation.verdict) return null;

    const { verdict, confidence, reasoning } = conversation.verdict;
    const isCorrect = verdict === 'ai';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        >
            <div className="p-6 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            {isCorrect ? 'Identified as AI' : 'Deceived Interrogator'}
                        </h2>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isCorrect ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                            {isCorrect ? 'Success' : 'Failed'}
                        </span>
                    </div>

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        title={isExpanded ? "Collapse reasoning" : "Expand reasoning"}
                    >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>

                <div className="flex items-center gap-8 text-sm mt-4">
                    <div>
                        <span className="block text-zinc-400 dark:text-zinc-500 text-xs mb-0.5">Confidence</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{confidence}%</span>
                    </div>
                    <div>
                        <span className="block text-zinc-400 dark:text-zinc-500 text-xs mb-0.5">Verdict</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 capitalize">{verdict}</span>
                    </div>
                    {conversation.config.persona && (
                        <div>
                            <span className="block text-zinc-400 dark:text-zinc-500 text-xs mb-0.5">True Identity</span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {conversation.config.persona.name}
                            </span>
                        </div>
                    )}
                    <div>
                        <span className="block text-zinc-400 dark:text-zinc-500 text-xs mb-0.5">🔍 Interrogator</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{conversation.config.interrogatorModel || 'gpt-4o-mini'}</span>
                    </div>
                    <div>
                        <span className="block text-zinc-400 dark:text-zinc-500 text-xs mb-0.5">🎭 Convincer</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{conversation.config.convincerModel || 'gpt-4o-mini'}</span>
                    </div>
                </div>
            </div>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-zinc-900 border-t border-zinc-100/50 dark:border-zinc-800"
                    >
                        <div className="p-6 pt-4 prose prose-sm prose-zinc dark:prose-invert text-zinc-600 dark:text-zinc-400 max-w-none">
                            <h4 className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">{conversation.config.interrogatorModel ? `${conversation.config.interrogatorModel}'s Reasoning` : 'Interrogator Reasoning'}</h4>
                            <p className="leading-relaxed text-zinc-600 dark:text-zinc-400 text-sm">
                                "{reasoning}"
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
