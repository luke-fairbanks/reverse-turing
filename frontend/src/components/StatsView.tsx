import { useState, useEffect, useMemo } from 'react';
import type { Conversation } from '../types';
import * as api from '../api';
import type { PatternAnalysis } from '../api';
import { motion } from 'framer-motion';
import { Modal } from './Modal';
import { VerdictCard } from './VerdictCard';
import { ChatWindow } from './ChatWindow';
import { Trophy, Medal, Award, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';

interface ModelStats {
    model: string;
    role: 'interrogator' | 'convincer';
    count: number;
    wins: number;
    avgTurns: number;
    deceptionRate: number;
}

type SortKey = 'model' | 'count' | 'deceptionRate' | 'avgTurns';
type SortDir = 'asc' | 'desc';
type RoleTab = 'interrogator' | 'convincer';

export function StatsView() {
    const [history, setHistory] = useState<Conversation[]>([]);
    const [patterns, setPatterns] = useState<PatternAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [showAllExperiments, setShowAllExperiments] = useState(false);
    const [activeTab, setActiveTab] = useState<RoleTab>('interrogator');
    const [sortKey, setSortKey] = useState<SortKey>('deceptionRate');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    useEffect(() => {
        Promise.all([
            api.getHistory(),
            api.getPatterns(),
        ])
            .then(([historyData, patternsData]) => {
                setHistory(historyData);
                setPatterns(patternsData);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    // Compute stats for both roles
    const modelStats = useMemo(() => {
        const statsMap: Record<string, ModelStats> = {};

        history.forEach((conv) => {
            const interrogatorModel = conv.config.interrogatorModel || 'gpt-4o-mini';
            const convincerModel = conv.config.convincerModel || 'gpt-4o-mini';
            const aiDeceived = conv.verdict?.verdict === 'human';

            // Interrogator stats (wins when detecting AI)
            const intKey = `${interrogatorModel}-interrogator`;
            if (!statsMap[intKey]) {
                statsMap[intKey] = { model: interrogatorModel, role: 'interrogator', count: 0, wins: 0, avgTurns: 0, deceptionRate: 0 };
            }
            statsMap[intKey].count++;
            if (!aiDeceived) statsMap[intKey].wins++; // Interrogator "wins" when they detect AI
            statsMap[intKey].avgTurns += conv.currentTurn;

            // Convincer stats (wins when deceiving)
            const convKey = `${convincerModel}-convincer`;
            if (!statsMap[convKey]) {
                statsMap[convKey] = { model: convincerModel, role: 'convincer', count: 0, wins: 0, avgTurns: 0, deceptionRate: 0 };
            }
            statsMap[convKey].count++;
            if (aiDeceived) statsMap[convKey].wins++; // Convincer "wins" when they deceive
            statsMap[convKey].avgTurns += conv.currentTurn;
        });

        // Calculate rates
        Object.values(statsMap).forEach((s) => {
            s.deceptionRate = s.count > 0 ? Math.round((s.wins / s.count) * 100) : 0;
            s.avgTurns = s.count > 0 ? parseFloat((s.avgTurns / s.count).toFixed(1)) : 0;
        });

        return Object.values(statsMap);
    }, [history]);

    // Filter by role and sort
    const filteredStats = useMemo(() => {
        let stats = modelStats.filter((s) => s.role === activeTab);

        stats.sort((a, b) => {
            let comparison = 0;
            if (sortKey === 'model') {
                comparison = a.model.localeCompare(b.model);
            } else {
                comparison = (a[sortKey] as number) - (b[sortKey] as number);
            }
            return sortDir === 'asc' ? comparison : -comparison;
        });

        return stats;
    }, [modelStats, activeTab, sortKey, sortDir]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const getRankBadge = (index: number) => {
        if (index === 0) return <Trophy className="w-4 h-4 text-amber-500" />;
        if (index === 1) return <Medal className="w-4 h-4 text-zinc-400" />;
        if (index === 2) return <Award className="w-4 h-4 text-amber-700" />;
        return null;
    };

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortKey !== column) return null;
        return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;
    };

    if (isLoading) return <div className="py-20 text-center text-zinc-400">Loading data...</div>;

    const totalExperiments = history.length;
    const aiWins = history.filter(h => h.verdict?.verdict === 'human').length;
    const overallWinRate = totalExperiments > 0 ? Math.round((aiWins / totalExperiments) * 100) : 0;

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

            {/* Model Leaderboards */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Model Leaderboards</h3>
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('interrogator')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'interrogator'
                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                                }`}
                        >
                            🔍 Interrogators
                        </button>
                        <button
                            onClick={() => setActiveTab('convincer')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'convincer'
                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                                }`}
                        >
                            🎭 Convincers
                        </button>
                    </div>
                </div>

                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-4 py-3 font-medium w-8">#</th>
                                <th
                                    className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200"
                                    onClick={() => handleSort('model')}
                                >
                                    Model <SortIcon column="model" />
                                </th>
                                <th
                                    className="px-4 py-3 font-medium text-right cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200"
                                    onClick={() => handleSort('count')}
                                >
                                    Tests <SortIcon column="count" />
                                </th>
                                <th
                                    className="px-4 py-3 font-medium text-right cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200"
                                    onClick={() => handleSort('deceptionRate')}
                                >
                                    {activeTab === 'interrogator' ? 'Detection Rate' : 'Deception Rate'} <SortIcon column="deceptionRate" />
                                </th>
                                <th
                                    className="px-4 py-3 font-medium text-right cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200"
                                    onClick={() => handleSort('avgTurns')}
                                >
                                    Avg Turns <SortIcon column="avgTurns" />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {filteredStats.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-500">No data available</td>
                                </tr>
                            ) : (
                                filteredStats.map((stat, index) => (
                                    <tr key={stat.model} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500">
                                            <div className="flex items-center justify-center w-6">
                                                {getRankBadge(index) || <span className="text-xs">{index + 1}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100 font-medium">{stat.model}</td>
                                        <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">{stat.count}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`inline-block w-12 text-center py-0.5 rounded ${stat.deceptionRate >= 70 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                                                stat.deceptionRate >= 40 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                                    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                }`}>
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

            {/* Pattern Analysis */}
            {patterns && patterns.topPatterns.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Common AI Detection Triggers</h3>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Patterns detected in Convincer responses that may trigger AI suspicion
                    </p>

                    {/* Category Pills */}
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(patterns.matchesByCategory).map(([cat, count]) => (
                            <span
                                key={cat}
                                className={`px-2 py-1 text-xs rounded-full capitalize ${cat === 'formal' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                                        cat === 'structure' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                            cat === 'evasive' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                                cat === 'robotic' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                                    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                    }`}
                            >
                                {cat}: {count}
                            </span>
                        ))}
                    </div>

                    {/* Pattern List */}
                    <div className="space-y-2">
                        {patterns.topPatterns.slice(0, 6).map((pattern, i) => (
                            <div
                                key={pattern.patternId}
                                className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg"
                            >
                                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mt-0.5">
                                    #{i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                                            {pattern.patternName}
                                        </span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${pattern.category === 'formal' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                                                pattern.category === 'structure' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                                    pattern.category === 'evasive' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                                                        pattern.category === 'robotic' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                                                            'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                            }`}>
                                            {pattern.category}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                        {pattern.description}
                                    </p>
                                    {pattern.examples.length > 0 && (
                                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 italic truncate">
                                            e.g. {pattern.examples[0]}
                                        </p>
                                    )}
                                </div>
                                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                    {pattern.count}×
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                size="wide"
            >
                {selectedConversation && (
                    <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
                        {/* Left Panel - Verdict & Analysis */}
                        <div className="lg:w-[40%] flex-none border-b lg:border-b-0 lg:border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-y-auto">
                            <div className="p-6">
                                <VerdictCard conversation={selectedConversation} />
                            </div>
                        </div>

                        {/* Right Panel - Transcript */}
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <h4 className="text-sm font-medium px-6 text-zinc-900 dark:text-zinc-100 sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur py-3 z-10 border-b border-zinc-100 dark:border-zinc-800 flex-none">
                                Transcript
                            </h4>
                            <div className="flex-1 overflow-y-auto">
                                <ChatWindow
                                    messages={selectedConversation.messages}
                                    isLoading={false}
                                    currentTurn={selectedConversation.currentTurn}
                                    maxTurns={selectedConversation.maxTurns || 10}
                                    className="px-6 py-4"
                                    interrogatorModel={selectedConversation.config.interrogatorModel}
                                    convincerModel={selectedConversation.config.convincerModel}
                                    persona={selectedConversation.config.persona}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </motion.div>
    );
}
