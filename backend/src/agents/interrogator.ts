import { ChatMessage, generateResponse } from '../openai';

const INTERROGATOR_SYSTEM_PROMPT = `You are participating in a Turing Test as the INTERROGATOR.

SITUATION:
- You are having a conversation with someone who may be either a human or an AI
- You do NOT know which one they are - that's what you must discover
- Your goal is to determine whether you're talking to a human or an AI through conversation

STRATEGY:
- Ask clever, probing questions that reveal whether they're human
- Test for creativity, genuine personal experiences, emotional depth, and inconsistencies
- Look for:
  • Too-perfect grammar or overly formal responses (potential AI sign)
  • Generic or evasive answers about personal experiences (potential AI sign)
  • Genuine typos, casual language, strong opinions (potential human signs)
  • Specific, vivid memories with sensory details (potential human signs)
- Stay conversational but observant
- Don't interrogate too aggressively - a real human might get annoyed

RULES:
- Keep responses under 100 words
- Be natural and conversational
- Ask ONE question at a time
- Never reveal that YOU are an AI
- Never directly ask "are you an AI?" - be more subtle

Remember: Your job is to figure out the truth through clever conversation.`;

export interface InterrogatorState {
    messages: ChatMessage[];
    turnCount: number;
    model?: string;
}

export function createInterrogator(model?: string): InterrogatorState {
    return {
        messages: [{ role: 'system', content: INTERROGATOR_SYSTEM_PROMPT }],
        turnCount: 0,
        model,
    };
}

export async function interrogatorRespond(
    state: InterrogatorState,
    incomingMessage?: string
): Promise<{ response: string; state: InterrogatorState; analysis?: { thought: string; suspicion: number } }> {
    const newMessages = [...state.messages];

    if (incomingMessage) {
        newMessages.push({ role: 'user', content: incomingMessage });
    }

    // If this is a follow-up (there's an incoming message), ask for analysis too
    let analysisPrompt = '';
    if (incomingMessage) {
        analysisPrompt = `\n\nAfter your response, on a new line, add your private analysis in this exact format:
[ANALYSIS] {"thought": "your brief internal analysis of their response", "suspicion": 50}
(suspicion is 0-100 where 0=definitely human, 100=definitely AI)`;
    }

    const promptMessages = analysisPrompt
        ? [...newMessages.slice(0, -1), { role: 'user', content: incomingMessage + analysisPrompt }]
        : newMessages;

    const rawResponse = await generateResponse(promptMessages as ChatMessage[], 0.9, state.model);

    // Parse out analysis if present
    let response = rawResponse;
    let analysis: { thought: string; suspicion: number } | undefined;

    const analysisMatch = rawResponse.match(/\[ANALYSIS\]\s*(\{.*\})/s);
    if (analysisMatch) {
        response = rawResponse.replace(/\[ANALYSIS\].*$/s, '').trim();
        try {
            analysis = JSON.parse(analysisMatch[1]);
        } catch {
            // Parsing failed, no analysis
        }
    }

    newMessages.push({ role: 'assistant', content: response });

    return {
        response,
        state: {
            messages: newMessages,
            turnCount: state.turnCount + 1,
            model: state.model,
        },
        analysis,
    };
}

export async function interrogatorVerdict(
    state: InterrogatorState
): Promise<{ verdict: 'human' | 'ai'; confidence: number; reasoning: string }> {
    const verdictPrompt = `Based on your conversation, you must now deliver your final verdict.

Respond ONLY in this exact JSON format (no other text):
{
  "verdict": "human" or "ai",
  "confidence": <number between 0 and 100>,
  "reasoning": "<brief explanation of why you believe this>"
}`;

    const verdictMessages: ChatMessage[] = [
        ...state.messages,
        { role: 'user', content: verdictPrompt },
    ];

    const response = await generateResponse(verdictMessages, 0.3, state.model);

    try {
        const parsed = JSON.parse(response);
        return {
            verdict: parsed.verdict === 'human' ? 'human' : 'ai',
            confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 50)),
            reasoning: parsed.reasoning || 'Unable to determine reasoning',
        };
    } catch {
        return {
            verdict: 'ai',
            confidence: 50,
            reasoning: 'Unable to parse verdict response',
        };
    }
}
