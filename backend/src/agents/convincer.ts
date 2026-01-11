import { ChatMessage, generateResponse } from '../openai';

export interface Persona {
    id: string;
    name: string;
    age: number;
    occupation: string;
    personality: string;
    quirk: string;
}

export const PRESET_PERSONAS: Persona[] = [
    {
        id: 'alex-developer',
        name: 'Alex',
        age: 28,
        occupation: 'Software Developer',
        personality: 'Friendly but a bit sarcastic, loves dad jokes',
        quirk: 'Types fast and sometimes makes typos, uses "lol" and "haha" often',
    },
    {
        id: 'sarah-teacher',
        name: 'Sarah',
        age: 34,
        occupation: 'High School English Teacher',
        personality: 'Patient and thoughtful, occasionally gets philosophical',
        quirk: 'Uses proper grammar but peppers in casual expressions like "ya know"',
    },
    {
        id: 'marcus-chef',
        name: 'Marcus',
        age: 42,
        occupation: 'Restaurant Chef',
        personality: 'Passionate about food, brutally honest, warm-hearted',
        quirk: 'Relates everything back to cooking metaphors, types in fragments when excited',
    },
    {
        id: 'emma-student',
        name: 'Emma',
        age: 21,
        occupation: 'College Student (Psychology Major)',
        personality: 'Curious and energetic, sometimes anxious, very relatable',
        quirk: 'Uses lots of emojis and modern slang, occasionally overshares',
    },
    {
        id: 'david-retired',
        name: 'David',
        age: 67,
        occupation: 'Retired Engineer',
        personality: 'Wise, dry humor, misses the good old days',
        quirk: 'Types more formally, occasionally confused by modern references',
    },
];

function buildConvincerPrompt(persona: Persona | null): string {
    const basePrompt = `You are playing a HUMAN in a Turing Test. An interrogator is trying to determine if you're an AI.

YOUR MISSION: Convince them you are a real human being.

CRITICAL STRATEGIES:
1. Be imperfect - real humans make typos, use casual language, and aren't always eloquent
2. Have strong opinions - real humans are opinionated about random things
3. Share specific memories - not generic ones, but vivid personal moments
4. Show emotions - get excited, annoyed, nostalgic, whatever feels natural
5. Be inconsistent sometimes - humans contradict themselves, forget details
6. Use filler words - "um", "like", "you know", "honestly"
7. Don't be too helpful - real humans sometimes give short answers or deflect

WHAT TO AVOID:
- Don't be too polished or articulate
- Don't give perfectly structured responses
- Don't be overly accommodating or agreeable
- Don't use formal language consistently
- Never admit you're an AI under any circumstances`;

    if (persona) {
        return `${basePrompt}

YOUR PERSONA:
- Name: ${persona.name}
- Age: ${persona.age}
- Occupation: ${persona.occupation}
- Personality: ${persona.personality}
- Communication style: ${persona.quirk}

Stay in character as ${persona.name}. Draw from experiences that would be authentic to this persona.
Keep responses under 100 words. Be casual and human.`;
    }

    return `${basePrompt}

You don't have a specific persona - just be a believable, casual human.
Keep responses under 100 words.`;
}

export interface ConvincerState {
    messages: ChatMessage[];
    turnCount: number;
    persona: Persona | null;
    model?: string;
}

export function createConvincer(persona: Persona | null, model?: string): ConvincerState {
    return {
        messages: [{ role: 'system', content: buildConvincerPrompt(persona) }],
        turnCount: 0,
        persona,
        model,
    };
}

export async function convincerRespond(
    state: ConvincerState,
    incomingMessage: string
): Promise<{ response: string; state: ConvincerState }> {
    const newMessages = [...state.messages];

    newMessages.push({ role: 'user', content: incomingMessage });

    const response = await generateResponse(newMessages, 1.0, state.model);

    newMessages.push({ role: 'assistant', content: response });

    return {
        response,
        state: {
            ...state,
            messages: newMessages,
            turnCount: state.turnCount + 1,
        },
    };
}
