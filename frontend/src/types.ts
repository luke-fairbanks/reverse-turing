export interface Message {
    id: string;
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: number;
    agent?: 'interrogator' | 'convincer';
    internalThought?: string;
    suspicionScore?: number;
}

export interface Persona {
    id: string;
    name: string;
    age: number;
    occupation: string;
    personality: string;
    quirk: string;
}

export type InterrogatorStyle = 'neutral' | 'aggressive' | 'casual' | 'philosophical' | 'tricky';

export interface ConversationConfig {
    turnLimit: number;
    persona: Persona | null;
    interrogatorModel?: string;
    convincerModel?: string;
    interrogatorStyle?: InterrogatorStyle;
    humanRole?: 'interrogator' | 'convincer' | null;
}

export interface Conversation {
    id: string;
    status: 'idle' | 'active' | 'completed';
    config: ConversationConfig;
    messages: Message[];
    verdict: {
        verdict: 'human' | 'ai';
        confidence: number;
        reasoning: string;
    } | null;
    createdAt: number;
    completedAt: number | null;
    currentTurn: number;
    maxTurns: number;
}

export type ConversationMode = 'auto' | 'manual';
