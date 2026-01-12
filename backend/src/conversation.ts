import { createInterrogator, interrogatorRespond, interrogatorVerdict, InterrogatorState, InterrogatorStyle, LearnedPattern } from './agents/interrogator';
import { createConvincer, convincerRespond, ConvincerState, Persona, PRESET_PERSONAS } from './agents/convincer';
import { aggregatePatternAnalysis, DETECTION_PATTERNS } from './patternAnalysis';
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
    interrogatorStyle?: InterrogatorStyle;
    humanRole?: 'interrogator' | 'convincer' | null;
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

export const conversations = new Map<string, Conversation>();

const DATA_DIR = path.join(__dirname, '..', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'conversation-history.json');

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

    // Get learned patterns from history to make interrogator smarter
    const learnedPatterns = getLearnedPatterns();

    const conversation: Conversation = {
        id,
        status: 'idle',
        config,
        messages: [],
        interrogatorState: createInterrogator(config.interrogatorModel, config.interrogatorStyle, learnedPatterns),
        convincerState: createConvincer(config.persona, config.convincerModel),
        verdict: null,
        createdAt: Date.now(),
        completedAt: null,
    };

    conversations.set(id, conversation);
    return conversation;
}

/**
 * Get learned patterns from conversation history
 */
function getLearnedPatterns(): LearnedPattern[] {
    const history = getHistory();
    if (history.length === 0) return [];

    const analysis = aggregatePatternAnalysis(history);

    return analysis.topPatterns.map(p => {
        const definition = DETECTION_PATTERNS.find(d => d.id === p.patternId);
        return {
            name: p.patternName,
            count: p.count,
            description: definition?.description || '',
        };
    });
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

    // If human is playing interrogator, wait for their first message
    if (conversation.config.humanRole === 'interrogator') {
        return conversation;
    }

    // Otherwise, AI interrogator makes the first move
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

    if (totalTurns >= conversation.config.turnLimit) {
        return await endConversation(id);
    }

    const lastMessage = conversation.messages[conversation.messages.length - 1];

    // Determine whose turn it is and if they're human
    const nextAgent: 'interrogator' | 'convincer' = lastMessage.agent === 'interrogator' ? 'convincer' : 'interrogator';
    const isHumanTurn = conversation.config.humanRole === nextAgent;

    // If it's a human's turn, don't auto-advance
    if (isHumanTurn) {
        return conversation;
    }

    // AI's turn
    if (nextAgent === 'convincer') {
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

/**
 * Submit a human player's message
 */
export async function submitHumanMessage(id: string, content: string): Promise<Conversation> {
    const conversation = conversations.get(id);
    if (!conversation) {
        throw new Error('Conversation not found');
    }

    if (conversation.status !== 'active') {
        throw new Error('Conversation is not active');
    }

    if (!conversation.config.humanRole) {
        throw new Error('No human role configured for this conversation');
    }

    // Determine whose turn it is
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const expectedAgent: 'interrogator' | 'convincer' = conversation.messages.length === 0
        ? 'interrogator'
        : lastMessage.agent === 'interrogator' ? 'convincer' : 'interrogator';

    if (conversation.config.humanRole !== expectedAgent) {
        throw new Error('It is not your turn');
    }

    // Add human's message
    conversation.messages.push({
        id: generateId(),
        role: 'assistant',
        agent: expectedAgent,
        content,
        timestamp: Date.now(),
    });

    // Update agent state
    if (expectedAgent === 'interrogator') {
        conversation.interrogatorState.messages.push({ role: 'assistant', content });
        conversation.interrogatorState.turnCount++;
    } else {
        conversation.convincerState.messages.push({ role: 'assistant', content });
        conversation.convincerState.turnCount++;
    }

    // Check if turn limit reached
    const totalTurns = Math.floor(conversation.messages.length / 2);
    if (totalTurns >= conversation.config.turnLimit) {
        return await endConversation(id);
    }

    // Trigger AI response from the other agent
    return await advanceConversation(id);
}

export async function endConversation(id: string): Promise<Conversation> {
    const conversation = conversations.get(id);
    if (!conversation) {
        throw new Error('Conversation not found');
    }

    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (lastMessage && lastMessage.agent === 'convincer') {
        conversation.interrogatorState.messages.push({
            role: 'user',
            content: lastMessage.content,
        });
    }

    const verdict = await interrogatorVerdict(conversation.interrogatorState);

    conversation.verdict = verdict;
    conversation.status = 'completed';
    conversation.completedAt = Date.now();

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
