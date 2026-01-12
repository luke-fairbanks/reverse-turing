import { ChatMessage, generateResponse } from '../openai';

export type InterrogatorStyle = 'neutral' | 'aggressive' | 'casual' | 'philosophical' | 'tricky';

const BASE_SYSTEM_PROMPT = `You are participating in a Turing Test as the INTERROGATOR.

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

RULES:
- Keep responses under 100 words
- Be natural and conversational
- Ask ONE question at a time
- Never reveal that YOU are an AI
- Never directly ask "are you an AI?" - be more subtle

Remember: Your job is to figure out the truth through clever conversation.`;

const STYLE_PROMPTS: Record<InterrogatorStyle, string> = {
    neutral: '',
    aggressive: `\n\nSTYLE: AGGRESSIVE
- Be direct and confrontational in your questioning
- Press hard on inconsistencies and vague answers
- Don't let them deflect - demand specifics
- Show skepticism and challenge their claims
- Use short, punchy questions that demand immediate answers`,
    casual: `\n\nSTYLE: CASUAL
- Be friendly and laid-back in your approach
- Use informal language, slang, and casual phrasing
- Make it feel like a chill conversation between friends
- Slip in probing questions naturally without seeming suspicious
- React with humor and keep the vibe relaxed`,
    philosophical: `\n\nSTYLE: PHILOSOPHICAL
- Ask deep, abstract questions about consciousness and existence
- Probe their understanding of subjective experience
- Discuss hypotheticals and moral dilemmas
- Test for genuine introspection and self-awareness
- Ask about the nature of thoughts, feelings, and identity`,
    tricky: `\n\nSTYLE: TRICKY
- Use misdirection and unexpected topic switches
- Set up conversational traps to catch contradictions
- Ask questions with hidden tests embedded in them
- Reference earlier statements to check consistency
- Use ambiguous phrasing to see how they interpret it`,
};

export interface InterrogatorState {
    messages: ChatMessage[];
    turnCount: number;
    model?: string;
    style?: InterrogatorStyle;
}

export interface LearnedPattern {
    name: string;
    count: number;
    description: string;
}

function buildPatternPrompt(patterns: LearnedPattern[]): string {
    if (patterns.length === 0) return '';

    const patternLines = patterns.slice(0, 8).map(
        (p, i) => `${i + 1}. ${p.name} (detected ${p.count}x) - ${p.description}`
    ).join('\n');

    return `\n\nPATTERNS TO WATCH FOR (learned from past experiments):
${patternLines}

If you detect these patterns, probe deeper, challenge them, or ask follow-up questions to expose inconsistencies.`;
}

export function createInterrogator(
    model?: string,
    style: InterrogatorStyle = 'neutral',
    learnedPatterns: LearnedPattern[] = []
): InterrogatorState {
    const systemPrompt = BASE_SYSTEM_PROMPT + STYLE_PROMPTS[style] + buildPatternPrompt(learnedPatterns);
    return {
        messages: [{ role: 'system', content: systemPrompt }],
        turnCount: 0,
        model,
        style,
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
