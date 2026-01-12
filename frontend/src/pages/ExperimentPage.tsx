import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Conversation, ConversationMode, Persona } from '../types';
import * as api from '../api';
import { ChatWindow } from '../components/ChatWindow';
import { SetupPanel } from '../components/SetupPanel';
import { ControlPanel } from '../components/ControlPanel';
import { VerdictCard } from '../components/VerdictCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';

export function ExperimentPage() {
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingVerdict, setIsGeneratingVerdict] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [mode, setMode] = useState<ConversationMode>('auto');
    const [humanMessage, setHumanMessage] = useState('');
    const autoIntervalRef = useRef<number | null>(null);

    // Compute isHumanTurn FIRST so it can be used in useEffect
    const isHumanTurn = useMemo(() => {
        if (!conversation || !conversation.config.humanRole || conversation.status !== 'active') {
            return false;
        }
        if (conversation.messages.length === 0) {
            return conversation.config.humanRole === 'interrogator';
        }
        const lastMsg = conversation.messages[conversation.messages.length - 1];
        const nextAgent = lastMsg.agent === 'interrogator' ? 'convincer' : 'interrogator';
        return conversation.config.humanRole === nextAgent;
    }, [conversation]);

    useEffect(() => {
        api.fetchPersonas()
            .then(setPersonas)
            .catch((err) => setError(err.message));
    }, []);

    const handleAdvance = useCallback(async () => {
        if (!conversation || isLoading) return;
        setIsLoading(true);
        try {
            const updatedConv = await api.advanceConversation(conversation.id);
            setConversation(updatedConv);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to advance conversation');
        } finally {
            setIsLoading(false);
        }
    }, [conversation, isLoading]);

    useEffect(() => {
        if (conversation?.status === 'active' && mode === 'auto' && !isLoading && !isHumanTurn) {
            autoIntervalRef.current = window.setTimeout(() => {
                handleAdvance();
            }, 2000);
        }
        return () => {
            if (autoIntervalRef.current) clearTimeout(autoIntervalRef.current);
        };
    }, [conversation, mode, isLoading, isHumanTurn, handleAdvance]);

    const handleStart = useCallback(async (config: {
        turnLimit: number;
        personaId?: string;
        customPersona?: Persona;
        mode: ConversationMode;
        interrogatorModel: string;
        convincerModel: string;
        interrogatorStyle: 'neutral' | 'aggressive' | 'casual' | 'philosophical' | 'tricky';
        humanRole?: 'interrogator' | 'convincer' | null;
    }) => {
        setIsLoading(true);
        setError(null);
        setMode(config.mode);
        try {
            const newConv = await api.createConversation({
                turnLimit: config.turnLimit,
                personaId: config.personaId,
                customPersona: config.customPersona,
                interrogatorModel: config.interrogatorModel,
                convincerModel: config.convincerModel,
                interrogatorStyle: config.interrogatorStyle,
                humanRole: config.humanRole,
            });
            const startedConv = await api.startConversation(newConv.id);
            setConversation(startedConv);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start conversation');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleEnd = useCallback(async () => {
        if (!conversation) return;
        setIsGeneratingVerdict(true);
        try {
            const endedConv = await api.endConversation(conversation.id);
            setConversation(endedConv);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to end conversation');
        } finally {
            setIsGeneratingVerdict(false);
        }
    }, [conversation]);

    const handleSubmitMessage = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!conversation || !humanMessage.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        try {
            const updatedConv = await api.submitMessage(conversation.id, humanMessage.trim());
            setConversation(updatedConv);
            setHumanMessage('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit message');
        } finally {
            setIsLoading(false);
        }
    }, [conversation, humanMessage, isLoading]);

    const handleReset = useCallback(() => {
        setConversation(null);
        setError(null);
        setHumanMessage('');
    }, []);

    const handleModeChange = useCallback((newMode: ConversationMode) => {
        setMode(newMode);
    }, []);

    return (
        <div className="space-y-6">
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-8 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-md border border-red-100 dark:border-red-800"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {!conversation ? (
                    <motion.div
                        key="setup"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <SetupPanel
                            personas={personas}
                            onStart={handleStart}
                            isLoading={isLoading}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="experiment"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-rows-[auto_1fr_auto] gap-0 bg-zinc-50 dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden"
                        style={{ minHeight: '70vh', maxHeight: '85vh' }}
                    >
                        <div className="flex-none border-b border-zinc-100 dark:border-zinc-800">
                            <ControlPanel
                                status={conversation.status}
                                currentTurn={conversation.currentTurn}
                                maxTurns={conversation.maxTurns}
                                isLoading={isLoading}
                                mode={mode}
                                onAdvance={handleAdvance}
                                onEnd={handleEnd}
                                onReset={handleReset}
                                onModeChange={handleModeChange}
                                humanRole={conversation.config.humanRole}
                            />

                            <AnimatePresence>
                                {conversation.verdict && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                                    >
                                        <VerdictCard conversation={conversation} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-zinc-950 safe-scrollbar">
                            <ChatWindow
                                messages={conversation.messages}
                                isLoading={isLoading}
                                currentTurn={conversation.currentTurn}
                                maxTurns={conversation.maxTurns}
                                interrogatorModel={conversation.config.interrogatorModel}
                                convincerModel={conversation.config.convincerModel}
                                persona={conversation.config.persona}
                            />

                            <AnimatePresence>
                                {isGeneratingVerdict && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-3 mt-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-100 dark:border-zinc-700"
                                    >
                                        <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-500 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
                                        <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Generating final verdict...</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Human Chat Input */}
                        {isHumanTurn && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex-none border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4"
                            >
                                <form onSubmit={handleSubmitMessage} className="flex gap-3">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={humanMessage}
                                            onChange={(e) => setHumanMessage(e.target.value)}
                                            placeholder={
                                                conversation.config.humanRole === 'interrogator'
                                                    ? "Ask a question to detect the AI..."
                                                    : "Reply to convince them you're human..."
                                            }
                                            className="w-full px-4 py-3 pr-12 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400 focus:border-transparent transition-all"
                                            disabled={isLoading}
                                            autoFocus
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 dark:text-zinc-500">
                                            {conversation.config.humanRole === 'interrogator' ? '🔍' : '🎭'}
                                        </span>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!humanMessage.trim() || isLoading}
                                        className="px-5 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                    >
                                        <Send className="w-4 h-4" />
                                        Send
                                    </button>
                                </form>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 text-center">
                                    {conversation.config.humanRole === 'interrogator'
                                        ? "You are the interrogator. Try to detect if you're talking to an AI."
                                        : "You are the convincer. Make them believe you're human!"}
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
