import { useState, useEffect } from 'react';
import type { Conversation } from '../types';
import * as api from '../api';
import { motion } from 'framer-motion';
import { Modal } from './Modal';
import { VerdictCard } from './VerdictCard';
import { ChatWindow } from './ChatWindow';

interface ModelStats {
    model: string;
    count: number;
    wins: number;
    avgTurns: number;
}

export function StatsView() {
    const [history, setHistory] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [showAllExperiments, setShowAllExperiments] = useState(false);

    useEffect(() => {
        api.getHistory()
            .then(setHistory)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) return <div className="py-20 text-center text-zinc-400">Loading data...</div>;

    const totalExperiments = history.length;
    const aiWins = history.filter(h => h.verdict?.verdict === 'human').length;
    const overallWinRate = totalExperiments > 0 ? Math.round((aiWins / totalExperiments) * 100) : 0;

    const modelStatsMap = history.reduce<Record<string, ModelStats>>((acc, curr) => {
        const model = curr.config.interrogatorModel || 'gpt-4o-mini';
        if (!acc[model]) {
            acc[model] = { model, count: 0, wins: 0, avgTurns: 0 };
        }
        acc[model].count++;
        if (curr.verdict?.verdict === 'human') acc[model].wins++;
        acc[model].avgTurns += curr.currentTurn;
        return acc;
    }, {});

    const modelStats = Object.values(modelStatsMap).map(s => ({
        ...s,
        deceptionRate: Math.round((s.wins / s.count) * 100),
        avgTurns: (s.avgTurns / s.count).toFixed(1)
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
        >
            {/* Top Metrics */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-lg">
                    <span className="block text-zinc-500 dark:text-zinc-400 text-xs font-medium uppercase tracking-wide">Deception Rate</span>
                    <span className="block text-3xl font-semibold text-zinc-900 dark:text-zinc-100 mt-2">{overallWinRate}%</span>
                    <span className="block text-zinc-400 dark:text-zinc-500 text-sm mt-1">AI Identified as Human</span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-lg">
                    <span className="block text-zinc-500 dark:text-zinc-400 text-xs font-medium uppercase tracking-wide">Total Experiments</span>
                    <span className="block text-3xl font-semibold text-zinc-900 dark:text-zinc-100 mt-2">{totalExperiments}</span>
                    <span className="block text-zinc-400 dark:text-zinc-500 text-sm mt-1">Completed Runs</span>
                </div>
            </div>

            {/* Model Benchmarks */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Model Performance</h3>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-4 py-3 font-medium">Model</th>
                                <th className="px-4 py-3 font-medium text-right">Tests</th>
                                <th className="px-4 py-3 font-medium text-right">Deception Rate</th>
                                <th className="px-4 py-3 font-medium text-right">Avg Turns</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {modelStats.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-500">No data available</td>
                                </tr>
                            ) : (
                                modelStats.map((stat) => (
                                    <tr key={stat.model} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100 font-medium">{stat.model}</td>
                                        <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">{stat.count}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`inline-block w-12 text-center py-0.5 rounded ${stat.deceptionRate > 50 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                                                {stat.deceptionRate}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">{stat.avgTurns}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Experiments */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                        {showAllExperiments ? 'All Experiments' : 'Recent Experiments'}
                    </h3>
                    {history.length > 5 && (
                        <button
                            onClick={() => setShowAllExperiments(!showAllExperiments)}
                            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                        >
                            {showAllExperiments ? 'Show Less' : `View All (${history.length})`}
                        </button>
                    )}
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {(showAllExperiments ? history : history.slice(0, 5)).map((h) => {
                        const isWin = h.verdict?.verdict === 'human';
                        const interrogatorModel = h.config.interrogatorModel || 'gpt-4o-mini';
                        const convincerModel = h.config.convincerModel || 'gpt-4o-mini';
                        return (
                            <div
                                key={h.id}
                                onClick={() => setSelectedConversation(h)}
                                className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-sm cursor-pointer transition-all"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                        {h.config.persona?.name || 'Unknown Persona'}
                                        <span className="text-zinc-400 dark:text-zinc-500 font-normal"> vs Interrogator</span>
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                        <span title="Interrogator Model">🔍 {interrogatorModel}</span>
                                        <span title="Convincer Model">🎭 {convincerModel}</span>
                                        <span>•</span>
                                        <span>{new Date(h.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className={`text-xs font-medium px-2 py-1 rounded flex-shrink-0 ml-3 ${isWin ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'}`}>
                                    {isWin ? 'Deceived' : 'Detected'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Detail Modal */}
            <Modal
                isOpen={!!selectedConversation}
                onClose={() => setSelectedConversation(null)}
                title="Experiment Details"
            >
                {selectedConversation && (
                    <>
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex-none z-10">
                            <VerdictCard conversation={selectedConversation} />
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <h4 className="text-sm font-medium px-6 text-zinc-900 dark:text-zinc-100 mb-4 sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur py-2 z-10 border-b border-zinc-50 dark:border-zinc-800">Transcript</h4>
                            <ChatWindow
                                messages={selectedConversation.messages}
                                isLoading={false}
                                currentTurn={selectedConversation.currentTurn}
                                maxTurns={selectedConversation.maxTurns || 10}
                                className="px-6"
                                interrogatorModel={selectedConversation.config.interrogatorModel}
                                convincerModel={selectedConversation.config.convincerModel}
                                persona={selectedConversation.config.persona}
                            />
                        </div>
                    </>
                )}
            </Modal>
        </motion.div>
    );
}
