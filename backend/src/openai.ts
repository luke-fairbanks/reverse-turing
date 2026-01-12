import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// OpenAI client for GPT models
const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.openai.com/v1',
});

// OpenRouter client for other models
const openrouterClient = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'Reverse Turing Experiment',
    },
});

export const getModel = () => process.env.OPENAI_MODEL || 'gpt-4o-mini';

console.log('🔑 OpenAI configured');
console.log('🔗 OpenRouter configured');
console.log('🤖 Default Model:', getModel());

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

// Determine which client to use based on model name
function getClientForModel(model: string): OpenAI {
    // GPT models go to OpenAI directly
    if (model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3')) {
        return openaiClient;
    }
    // Everything else goes to OpenRouter
    return openrouterClient;
}

export async function generateResponse(
    messages: ChatMessage[],
    temperature: number = 0.7,
    model?: string
): Promise<string> {
    const selectedModel = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const client = getClientForModel(selectedModel);

    try {
        const response = await client.chat.completions.create({
            model: selectedModel,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content
            })),
            temperature,
        });

        return response.choices[0].message.content || '';
    } catch (error) {
        console.error(`API Error (${selectedModel}):`, error);
        throw new Error(`Failed to generate response from ${selectedModel}`);
    }
}

// Fetch available models from OpenRouter
export async function fetchOpenRouterModels(): Promise<{ id: string; name: string; provider: string }[]> {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            },
        });

        if (!response.ok) {
            console.warn('Failed to fetch OpenRouter models');
            return [];
        }

        const data = await response.json() as { data: Array<{ id: string; name?: string }> };
        return data.data.map((m) => ({
            id: m.id,
            name: m.name || m.id,
            provider: m.id.split('/')[0] || 'unknown',
        }));
    } catch (error) {
        console.error('Error fetching OpenRouter models:', error);
        return [];
    }
}

// Default OpenAI models (always available)
export const OPENAI_MODELS = [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
    { id: 'o1', name: 'o1', provider: 'openai' },
    { id: 'o1-mini', name: 'o1 Mini', provider: 'openai' },
    { id: 'gpt-5.2', name: 'GPT-5.2', provider: 'openai' },
];

export default openaiClient;
