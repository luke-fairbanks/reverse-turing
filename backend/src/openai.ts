import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

export const getModel = () => process.env.OPENAI_MODEL || 'gpt-4o-mini';

console.log('🔑 API Base:', process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1');
console.log('🤖 Model:', getModel());

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export async function generateResponse(
    messages: ChatMessage[],
    temperature: number = 0.7,
    model?: string
): Promise<string> {
    const selectedModel = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';

    try {
        const response = await openai.chat.completions.create({
            model: selectedModel,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content
            })),
            temperature,
        });

        return response.choices[0].message.content || '';
    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw new Error('Failed to generate response from AI');
    }
}

export default openai;
