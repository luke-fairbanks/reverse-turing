import { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronDown, Search, Sparkles, BrainCircuit, Zap, Box, Wind, Bot, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ModelInfo } from '../api';

interface ModelSelectorProps {
    models: ModelInfo[];
    selectedId: string;
    onChange: (id: string) => void;
    label: string;
    disabled?: boolean;
}

export function ModelSelector({ models, selectedId, onChange, label, disabled }: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedModel = models.find(m => m.id === selectedId);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const getProviderIcon = (provider: string) => {
        const p = provider.toLowerCase();
        if (p.includes('openai')) return <Sparkles className="w-4 h-4 text-emerald-500" />;
        if (p.includes('anthropic')) return <BrainCircuit className="w-4 h-4 text-amber-500" />;
        if (p.includes('google')) return <Zap className="w-4 h-4 text-blue-500" />;
        if (p.includes('meta')) return <Box className="w-4 h-4 text-blue-400" />;
        if (p.includes('mistral')) return <Wind className="w-4 h-4 text-purple-500" />;
        return <Bot className="w-4 h-4 text-zinc-400" />;
    };

    const formatProviderName = (provider: string) => {
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    };

    const { filteredGroups, hasMore } = useMemo(() => {
        const groups: Record<string, ModelInfo[]> = {};
        let count = 0;
        const LIMIT = 50;

        for (const model of models) {
            if (searchQuery &&
                !model.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !model.id.toLowerCase().includes(searchQuery.toLowerCase())) {
                continue;
            }

            if (count >= LIMIT) {
                return { filteredGroups: groups, hasMore: true };
            }

            const p = model.provider || 'other';
            if (!groups[p]) groups[p] = [];
            groups[p].push(model);
            count++;
        }

        return { filteredGroups: groups, hasMore: false };
    }, [models, searchQuery]);

    const hasResults = Object.keys(filteredGroups).length > 0;

    return (
        <div className="space-y-2" ref={containerRef}>
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300 block">{label}</label>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`w-full bg-white dark:bg-zinc-900 border rounded-lg px-3 py-2.5 text-left text-sm flex items-center justify-between transition-all
                        ${disabled ? 'opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700' : 'hover:border-zinc-300 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10'}
                        ${isOpen ? 'border-zinc-400 dark:border-zinc-500 ring-2 ring-zinc-900/10 dark:ring-white/10' : 'border-zinc-200 dark:border-zinc-700'}
                    `}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        {selectedModel ? (
                            <>
                                {getProviderIcon(selectedModel.provider)}
                                <span className="text-zinc-900 dark:text-zinc-100 truncate">{selectedModel.name}</span>
                                <span className="text-zinc-400 dark:text-zinc-500 text-xs truncate ml-1 opacity-50 font-mono hidden sm:inline">{selectedModel.id.split('/').pop()}</span>
                            </>
                        ) : (
                            <span className="text-zinc-500 dark:text-zinc-400">Select a model...</span>
                        )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute z-50 mt-2 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 flex flex-col max-h-[400px] w-[140%] -left-[20%] origin-top"
                        >
                            <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 flex-none sticky top-0 bg-white dark:bg-zinc-900 rounded-t-lg z-10">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search models..."
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md pl-9 pr-8 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors placeholder-zinc-400 dark:placeholder-zinc-600"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-1"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="overflow-y-auto flex-1 p-1">
                                {hasResults ? (
                                    <>
                                        {Object.entries(filteredGroups).map(([provider, groupModels]) => (
                                            <div key={provider} className="mb-1 last:mb-0">
                                                <div className="px-2 py-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                                    {formatProviderName(provider)}
                                                </div>
                                                {groupModels.map(model => (
                                                    <button
                                                        key={model.id}
                                                        onClick={() => {
                                                            onChange(model.id);
                                                            setIsOpen(false);
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors group
                                                    ${selectedId === model.id ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                                                    >
                                                        <div className="flex-shrink-0">
                                                            {getProviderIcon(model.provider)}
                                                        </div>
                                                        <div className="flex flex-col items-start min-w-0 flex-1">
                                                            <span className="font-medium truncate w-full text-left">{model.name}</span>
                                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono truncate w-full text-left opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {model.id}
                                                            </span>
                                                        </div>
                                                        {selectedId === model.id && (
                                                            <Check className="w-4 h-4 text-zinc-900 dark:text-zinc-100 flex-shrink-0" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        ))}
                                        {hasMore && (
                                            <div className="text-center py-2 text-xs text-zinc-400 dark:text-zinc-600 italic bg-zinc-50/50 dark:bg-zinc-800/50 rounded mt-1">
                                                Type to search more...
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="py-8 text-center text-zinc-400 dark:text-zinc-500 text-sm">
                                        No models found
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
