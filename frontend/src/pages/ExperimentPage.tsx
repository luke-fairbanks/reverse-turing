import { useState, useEffect, useCallback, useRef } from 'react';
import type { Conversation, ConversationMode, Persona } from '../types';
import * as api from '../api';
import { ChatWindow } from '../components/ChatWindow';
import { SetupPanel } from '../components/SetupPanel';
import { ControlPanel } from '../components/ControlPanel';
import { VerdictCard } from '../components/VerdictCard';
import { motion, AnimatePresence } from 'framer-motion';

export function ExperimentPage() {
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [mode, setMode] = useState<ConversationMode>('auto');
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingVerdict, setIsGeneratingVerdict] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const autoIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        api.fetchPersonas()
            .then(setPersonas)
            .catch((err) => setError(err.message));
    }, []);

    useEffect(() => {
        if (conversation?.status === 'active' && mode === 'auto' && !isLoading) {
            autoIntervalRef.current = window.setTimeout(() => {
                handleAdvance();
            }, 2000);
        }
        return () => {
            if (autoIntervalRef.current) clearTimeout(autoIntervalRef.current);
        };
    }, [conversation, mode, isLoading]);

    const handleStart = useCallback(async (config: {
        turnLimit: number;
        personaId?: string;
        customPersona?: Persona;
        mode: ConversationMode;
        interrogatorModel: string;
        convincerModel: string;
        interrogatorStyle: 'neutral' | 'aggressive' | 'casual' | 'philosophical' | 'tricky';
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
            });
            const startedConv = await api.startConversation(newConv.id);
            setConversation(startedConv);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleAdvance = useCallback(async () => {
        if (!conversation || isLoading) return;
        setIsLoading(true);
        try {
            const updated = await api.advanceConversation(conversation.id);
            setConversation(updated);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to advance');
        } finally {
            setIsLoading(false);
        }
    }, [conversation, isLoading]);

    const handleEnd = useCallback(async () => {
        if (!conversation) return;
        setIsGeneratingVerdict(true);
        try {
            const ended = await api.endConversation(conversation.id);
            setConversation(ended);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to end');
        } finally {
            setIsGeneratingVerdict(false);
        }
    }, [conversation]);

    const handleReset = useCallback(() => {
        setConversation(null);
        setError(null);
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
                        className="mb-8 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100"
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
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <SetupPanel
                            personas={personas}
                            onStart={handleStart}
                            isLoading={isLoading}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="conversation"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden"
                    >
                        <div className="flex-none bg-zinc-50/50 border-b border-zinc-100 z-10">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100/50">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${conversation.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                                        <span className="text-sm font-medium text-zinc-900 capitalize">{conversation.status}</span>
                                    </div>
                                    <p className="text-xs text-zinc-400">Turn {conversation.currentTurn} of {conversation.maxTurns}</p>
                                </div>

                                <ControlPanel
                                    status={conversation.status}
                                    mode={mode}
                                    isLoading={isLoading}
                                    currentTurn={conversation.currentTurn}
                                    maxTurns={conversation.maxTurns}
                                    onAdvance={handleAdvance}
                                    onEnd={handleEnd}
                                    onModeChange={handleModeChange}
                                    onReset={handleReset}
                                />
                            </div>

                            <AnimatePresence>
                                {conversation.verdict && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeOut' }}
                                        className="px-6 py-4 bg-white/50 backdrop-blur-sm border-b border-zinc-100"
                                    >
                                        <VerdictCard conversation={conversation} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-white safe-scrollbar">
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
                                        className="flex items-center gap-3 mt-6 p-4 bg-zinc-50 rounded-lg border border-zinc-100"
                                    >
                                        <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                                        <span className="text-sm text-zinc-600 font-medium">Generating final verdict...</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
