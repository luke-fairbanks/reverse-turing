import { useState, useEffect } from 'react';
import type { Persona, ConversationMode } from '../types';
import { ChevronDown, Play } from 'lucide-react';

interface SetupPanelProps {
    personas: Persona[];
    onStart: (config: {
        turnLimit: number;
        personaId?: string;
        customPersona?: Persona;
        mode: ConversationMode;
        interrogatorModel: string;
        convincerModel: string;
    }) => void;
    isLoading: boolean;
}

const AVAILABLE_MODELS = [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Default)' },
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (OpenRouter)' },
    { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B (OpenRouter)' },
];

export function SetupPanel({ personas, onStart, isLoading }: SetupPanelProps) {
    const [turnLimit, setTurnLimit] = useState(10);
    const [personaType, setPersonaType] = useState<'preset' | 'custom' | 'none'>('preset');
    const [selectedPersonaId, setSelectedPersonaId] = useState('');
    const [mode, setMode] = useState<ConversationMode>('auto');
    const [interrogatorModel, setInterrogatorModel] = useState('gpt-4o-mini');
    const [convincerModel, setConvincerModel] = useState('gpt-4o-mini');
    const [customPersona, setCustomPersona] = useState({
        name: '',
        age: 30,
        occupation: '',
        personality: '',
        quirk: '',
    });

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
        <div className="space-y-10">

            {/* Settings Group */}
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-8">
                    {/* Turn Limit */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-900 block">Conversation Length</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="3"
                                max="20"
                                value={turnLimit}
                                onChange={(e) => setTurnLimit(Number(e.target.value))}
                                className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-black"
                            />
                            <span className="text-sm font-mono text-zinc-500 w-8 text-right">{turnLimit}</span>
                        </div>
                    </div>

                    {/* Mode */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-900 block">Mode</label>
                        <div className="flex bg-zinc-100 p-1 rounded-md">
                            <button
                                onClick={() => setMode('auto')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-sm transition-all ${mode === 'auto'
                                    ? 'bg-white text-zinc-900 shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-700'
                                    }`}
                            >
                                Auto
                            </button>
                            <button
                                onClick={() => setMode('manual')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-sm transition-all ${mode === 'manual'
                                    ? 'bg-white text-zinc-900 shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-700'
                                    }`}
                            >
                                Manual
                            </button>
                        </div>
                    </div>
                </div>

                {/* Model Selectors */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-900 block">Interrogator Model</label>
                        <div className="relative">
                            <select
                                value={interrogatorModel}
                                onChange={(e) => setInterrogatorModel(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 appearance-none"
                            >
                                {AVAILABLE_MODELS.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-900 block">Convincer Model</label>
                        <div className="relative">
                            <select
                                value={convincerModel}
                                onChange={(e) => setConvincerModel(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 appearance-none"
                            >
                                {AVAILABLE_MODELS.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Persona */}
                <div className="space-y-3 pt-4 border-t border-zinc-100">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-zinc-900">Convincer Persona</label>
                        <div className="flex gap-4 text-sm">
                            {(['preset', 'custom', 'none'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setPersonaType(type)}
                                    className={`pb-1 transition-colors capitalize ${personaType === type
                                        ? 'text-zinc-900 border-b-2 border-black'
                                        : 'text-zinc-400 hover:text-zinc-600 border-b-2 border-transparent'
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
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 appearance-none"
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
                                        className="bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-zinc-400"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Age"
                                        value={customPersona.age}
                                        onChange={(e) => setCustomPersona({ ...customPersona, age: Number(e.target.value) })}
                                        className="bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-zinc-400"
                                    />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Occupation"
                                    value={customPersona.occupation}
                                    onChange={(e) => setCustomPersona({ ...customPersona, occupation: e.target.value })}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-zinc-400"
                                />
                                <input
                                    type="text"
                                    placeholder="Personality trait"
                                    value={customPersona.personality}
                                    onChange={(e) => setCustomPersona({ ...customPersona, personality: e.target.value })}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-zinc-400"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <button
                onClick={handleStart}
                disabled={isLoading}
                className="w-full py-3 bg-black text-white font-medium text-sm rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
                {isLoading ? (
                    <span className="block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <>
                        Start Experiment <Play className="w-4 h-4 fill-current" />
                    </>
                )}
            </button>
        </div>
    );
}
