import { useState, useEffect } from 'react';
import type { Persona, ConversationMode, InterrogatorStyle } from '../types';
import { ChevronDown, Play, Loader2 } from 'lucide-react';
import * as api from '../api';
import { ModelSelector } from './ModelSelector';

interface SetupPanelProps {
    personas: Persona[];
    onStart: (config: {
        turnLimit: number;
        personaId?: string;
        customPersona?: Persona;
        mode: ConversationMode;
        interrogatorModel: string;
        convincerModel: string;
        interrogatorStyle: InterrogatorStyle;
    }) => void;
    isLoading: boolean;
}

export function SetupPanel({ personas, onStart, isLoading }: SetupPanelProps) {
    const [turnLimit, setTurnLimit] = useState(10);
    const [personaType, setPersonaType] = useState<'preset' | 'custom' | 'none'>('preset');
    const [selectedPersonaId, setSelectedPersonaId] = useState('');
    const [mode, setMode] = useState<ConversationMode>('auto');
    const [interrogatorModel, setInterrogatorModel] = useState('gpt-4o-mini');
    const [convincerModel, setConvincerModel] = useState('gpt-4o-mini');
    const [interrogatorStyle, setInterrogatorStyle] = useState<InterrogatorStyle>('neutral');
    const [availableModels, setAvailableModels] = useState<api.ModelInfo[]>([]);
    const [modelsLoading, setModelsLoading] = useState(true);
    const [customPersona, setCustomPersona] = useState({
        name: '',
        age: 30,
        occupation: '',
        personality: '',
        quirk: '',
    });

    // Fetch models on mount
    useEffect(() => {
        api.fetchModels()
            .then(setAvailableModels)
            .catch(console.error)
            .finally(() => setModelsLoading(false));
    }, []);

    useEffect(() => {
        if (personas.length > 0 && !selectedPersonaId) {
            setSelectedPersonaId(personas[0].id);
        }
    }, [personas, selectedPersonaId]);

    const handleStart = () => {
        const config: Parameters<typeof onStart>[0] = {
            turnLimit,
            mode,
            interrogatorModel,
            convincerModel,
            interrogatorStyle,
        };

        if (personaType === 'preset' && selectedPersonaId) {
            config.personaId = selectedPersonaId;
        } else if (personaType === 'custom') {
            config.customPersona = { id: 'custom', ...customPersona };
        } else {
            config.personaId = 'none';
        }

        onStart(config);
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 overflow-visible transition-colors duration-300">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Experiment Setup</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Configure both AI agents and start the experiment</p>
            </div>

            <div className="p-6 space-y-6">
                {/* Mode Selection */}
                <div className="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex-1">
                        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300 block mb-2">Experiment Mode</label>
                        <div className="flex bg-white dark:bg-zinc-950 rounded-lg p-1 border border-zinc-200 dark:border-zinc-800">
                            <button
                                onClick={() => setMode('auto')}
                                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${mode === 'auto'
                                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                AI vs AI
                            </button>
                            <button
                                disabled
                                className="flex-1 py-2 px-3 text-sm font-medium rounded-md text-zinc-400 dark:text-zinc-600 cursor-not-allowed border-l border-transparent"
                                title="Coming soon!"
                            >
                                Human vs AI
                            </button>
                        </div>
                    </div>
                    <div className="w-px bg-zinc-200 dark:bg-zinc-700" />
                    <div className="flex-1">
                        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300 block mb-2">Turn Limit</label>
                        <div className="flex items-center gap-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 h-[42px]">
                            <input
                                type="range"
                                min="5"
                                max="30"
                                value={turnLimit}
                                onChange={(e) => setTurnLimit(Number(e.target.value))}
                                className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                            />
                            <span className="text-sm font-mono font-medium text-zinc-600 dark:text-zinc-400 w-8 text-right">{turnLimit}</span>
                        </div>
                    </div>
                </div>

                {/* Model Selectors */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        {modelsLoading ? (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300 block">Interrogator Model</label>
                                <div className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-2.5 text-sm text-zinc-400 flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                                </div>
                            </div>
                        ) : (
                            <ModelSelector
                                label="Interrogator Model"
                                models={availableModels}
                                selectedId={interrogatorModel}
                                onChange={setInterrogatorModel}
                            />
                        )}
                    </div>

                    <div className="space-y-2">
                        {modelsLoading ? (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300 block">Convincer Model</label>
                                <div className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-2.5 text-sm text-zinc-400 flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                                </div>
                            </div>
                        ) : (
                            <ModelSelector
                                label="Convincer Model"
                                models={availableModels}
                                selectedId={convincerModel}
                                onChange={setConvincerModel}
                            />
                        )}
                    </div>
                </div>

                {/* Interrogator Style */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300 block">Interrogation Style</label>
                    <div className="relative">
                        <select
                            value={interrogatorStyle}
                            onChange={(e) => setInterrogatorStyle(e.target.value as InterrogatorStyle)}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 appearance-none transition-colors pr-8"
                        >
                            <option value="neutral">🎯 Neutral — Balanced and observant</option>
                            <option value="aggressive">⚡ Aggressive — Direct and confrontational</option>
                            <option value="casual">😎 Casual — Relaxed and friendly</option>
                            <option value="philosophical">🧠 Philosophical — Deep and introspective</option>
                            <option value="tricky">🎭 Tricky — Misdirection and traps</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    </div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {interrogatorStyle === 'neutral' && 'Standard questioning approach, balances curiosity with observation.'}
                        {interrogatorStyle === 'aggressive' && 'Challenges claims directly, presses for specifics, shows skepticism.'}
                        {interrogatorStyle === 'casual' && 'Friendly banter, uses slang, makes it feel like a chill chat.'}
                        {interrogatorStyle === 'philosophical' && 'Probes consciousness and identity, asks abstract questions.'}
                        {interrogatorStyle === 'tricky' && 'Sets traps, uses misdirection, checks for contradictions.'}
                    </p>
                </div>

                {/* Persona */}
                <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Convincer Persona</label>
                        <div className="flex gap-4 text-sm">
                            {(['preset', 'custom', 'none'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setPersonaType(type)}
                                    className={`pb-1 transition-colors capitalize ${personaType === type
                                        ? 'text-zinc-900 dark:text-zinc-100 border-b-2 border-black dark:border-white'
                                        : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 border-b-2 border-transparent'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        {personaType === 'preset' && (
                            <div className="relative">
                                <select
                                    value={selectedPersonaId}
                                    onChange={(e) => setSelectedPersonaId(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 appearance-none transition-colors"
                                >
                                    {personas.map((persona) => (
                                        <option key={persona.id} value={persona.id}>
                                            {persona.name} — {persona.occupation}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                            </div>
                        )}

                        {personaType === 'custom' && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        value={customPersona.name}
                                        onChange={(e) => setCustomPersona({ ...customPersona, name: e.target.value })}
                                        className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Age"
                                        value={customPersona.age}
                                        onChange={(e) => setCustomPersona({ ...customPersona, age: Number(e.target.value) })}
                                        className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                                    />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Occupation"
                                    value={customPersona.occupation}
                                    onChange={(e) => setCustomPersona({ ...customPersona, occupation: e.target.value })}
                                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                                />
                                <input
                                    type="text"
                                    placeholder="Personality trait"
                                    value={customPersona.personality}
                                    onChange={(e) => setCustomPersona({ ...customPersona, personality: e.target.value })}
                                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                                />
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleStart}
                    disabled={isLoading}
                    className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-medium text-sm rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                    {isLoading ? (
                        <span className="block w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            Start Experiment <Play className="w-4 h-4 fill-current" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
