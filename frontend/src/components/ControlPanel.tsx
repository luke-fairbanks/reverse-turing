import type { ConversationMode } from '../types';
import { FastForward, XCircle, RotateCcw } from 'lucide-react';

interface ControlPanelProps {
    status: 'idle' | 'active' | 'completed';
    mode: ConversationMode;
    isLoading: boolean;
    currentTurn: number;
    maxTurns: number;
    onAdvance: () => void;
    onEnd: () => void;
    onModeChange: (mode: ConversationMode) => void;
    onReset: () => void;
}

export function ControlPanel({
    status,
    mode,
    isLoading,
    onAdvance,
    onEnd,
    onReset,
}: ControlPanelProps) {
    if (status === 'idle') return null;

    return (
        <div className="flex items-center gap-2">
            {status === 'active' && (
                <>
                    {mode === 'manual' && (
                        <button
                            onClick={onAdvance}
                            disabled={isLoading}
                            className="text-sm font-medium text-zinc-600 hover:text-black hover:bg-zinc-100 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                        >
                            Step &rarr;
                        </button>
                    )}

                    <button
                        onClick={onEnd}
                        disabled={isLoading}
                        className="text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                    >
                        End
                    </button>
                </>
            )}

            {status === 'completed' && (
                <button
                    onClick={onReset}
                    className="text-sm font-medium text-zinc-900 bg-zinc-100 px-3 py-1.5 rounded-md hover:bg-zinc-200 transition-colors"
                >
                    Reset
                </button>
            )}
        </div>
    );
}
