import { createInterrogator, interrogatorRespond, interrogatorVerdict, InterrogatorState } from './agents/interrogator';
import { createConvincer, convincerRespond, ConvincerState, Persona, PRESET_PERSONAS } from './agents/convincer';
import fs from 'fs';
import path from 'path';

export interface Message {
    id: string;
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: number;
    agent?: 'interrogator' | 'convincer';
    internalThought?: string;
    suspicionScore?: number;
    analysis?: string;
}

export interface ConversationConfig {
    turnLimit: number;
    persona: Persona | null;
    interrogatorModel?: string;
    convincerModel?: string;
}

export interface Conversation {
    id: string;
    status: 'idle' | 'active' | 'completed';
    config: ConversationConfig;
    messages: Message[];
    interrogatorState: InterrogatorState;
    convincerState: ConvincerState;
    verdict: {
        verdict: 'human' | 'ai';
        confidence: number;
        reasoning: string;
    } | null;
    createdAt: number;
    completedAt: number | null;
}

// In-memory storage for active conversations
export const conversations = new Map<string, Conversation>();

// Data persistence directory
const DATA_DIR = path.join(__dirname, '..', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'conversation-history.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadHistory(): Conversation[] {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
    return [];
}

function saveToHistory(conversation: Conversation): void {
    try {
        const history = loadHistory();
        // Remove any existing entry for this conversation
        const filteredHistory = history.filter(c => c.id !== conversation.id);
        filteredHistory.push(conversation);
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(filteredHistory, null, 2));
    } catch (error) {
        console.error('Error saving to history:', error);
    }
}

export function generateId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getPersonaById(id: string): Persona | null {
    return PRESET_PERSONAS.find(p => p.id === id) || null;
}

export function createConversation(config: ConversationConfig): Conversation {
    const id = generateId();
    const conversation: Conversation = {
        id,
        status: 'idle',
        config,
        messages: [],
        interrogatorState: createInterrogator(config.interrogatorModel),
        convincerState: createConvincer(config.persona, config.convincerModel),
        verdict: null,
        createdAt: Date.now(),
        completedAt: null,
    };

    conversations.set(id, conversation);
    return conversation;
}

export function getConversation(id: string): Conversation | undefined {
    return conversations.get(id);
}

export async function startConversation(id: string): Promise<Conversation> {
    const conversation = conversations.get(id);
    if (!conversation) {
        throw new Error('Conversation not found');
    }

    conversation.status = 'active';

    // Interrogator goes first
    const { response, state } = await interrogatorRespond(conversation.interrogatorState);

    conversation.interrogatorState = state;
    conversation.messages.push({
        id: generateId(),
        role: 'assistant',
        agent: 'interrogator',
        content: response,
        timestamp: Date.now(),
    });

    return conversation;
}

export async function advanceConversation(id: string): Promise<Conversation> {
    const conversation = conversations.get(id);
    if (!conversation) {
        throw new Error('Conversation not found');
    }

    if (conversation.status !== 'active') {
        throw new Error('Conversation is not active');
    }

    const totalTurns = Math.floor(conversation.messages.length / 2);

    // Check if we've hit the turn limit
    if (totalTurns >= conversation.config.turnLimit) {
        return await endConversation(id);
    }

    // Get the last message
    const lastMessage = conversation.messages[conversation.messages.length - 1];

    if (lastMessage.agent === 'interrogator') {
        // Convincer responds
        const { response, state } = await convincerRespond(
            conversation.convincerState,
            lastMessage.content
        );

        conversation.convincerState = state;
        conversation.messages.push({
            id: generateId(),
            role: 'assistant',
            agent: 'convincer',
            content: response,
            timestamp: Date.now(),
        });
    } else {
        // Interrogator responds
        const { response, state, analysis } = await interrogatorRespond(
            conversation.interrogatorState,
            lastMessage.content
        );

        conversation.interrogatorState = state;
        conversation.messages.push({
            id: generateId(),
            role: 'assistant',
            agent: 'interrogator',
            content: response,
            timestamp: Date.now(),
            internalThought: analysis?.thought,
            suspicionScore: analysis?.suspicion,
        });
    }

    return conversation;
}

export async function endConversation(id: string): Promise<Conversation> {
    const conversation = conversations.get(id);
    if (!conversation) {
        throw new Error('Conversation not found');
    }

    // Check if there's a final message the Interrogator hasn't seen yet
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (lastMessage && lastMessage.agent === 'convincer') {
        // Inject the final Convincer message into the Interrogator's message history
        // so it's considered in the verdict
        conversation.interrogatorState.messages.push({
            role: 'user',
            content: lastMessage.content,
        });
    }

    // Get the interrogator's verdict
    const verdict = await interrogatorVerdict(conversation.interrogatorState);

    conversation.verdict = verdict;
    conversation.status = 'completed';
    conversation.completedAt = Date.now();

    // Save to history
    saveToHistory(conversation);

    return conversation;
}

export function getHistory(): Conversation[] {
    return loadHistory().sort((a, b) => b.createdAt - a.createdAt);
}

export function deleteConversation(id: string): boolean {
    return conversations.delete(id);
}

export { PRESET_PERSONAS };
