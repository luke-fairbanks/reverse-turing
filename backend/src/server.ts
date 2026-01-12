import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
    createConversation,
    getConversation,
    startConversation,
    advanceConversation,
    submitHumanMessage,
    endConversation,
    getHistory,
    getPersonaById,
    PRESET_PERSONAS,
    Conversation,
} from './conversation';
import { Persona } from './agents/convincer';
import { fetchOpenRouterModels, OPENAI_MODELS } from './openai';
import { aggregatePatternAnalysis, DETECTION_PATTERNS } from './patternAnalysis';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Get available models (OpenAI + OpenRouter)
app.get('/api/models', async (req, res) => {
    try {
        const openrouterModels = await fetchOpenRouterModels();

        // Combine and dedupe (OpenAI models first)
        const allModels = [
            ...OPENAI_MODELS,
            ...openrouterModels.filter(m => !m.id.startsWith('openai/')),
        ];

        res.json(allModels);
    } catch (error) {
        console.error('Error fetching models:', error);
        res.json(OPENAI_MODELS); // Fallback to just OpenAI models
    }
});

// Get available personas
app.get('/api/personas', (req, res) => {
    res.json(PRESET_PERSONAS);
});

// Create a new conversation
app.post('/api/conversations', (req, res) => {
    try {
        const { turnLimit = 10, personaId, customPersona, interrogatorModel, convincerModel, interrogatorStyle, humanRole } = req.body;

        let persona: Persona | null = null;

        if (customPersona) {
            persona = {
                id: 'custom',
                name: customPersona.name || 'Anonymous',
                age: customPersona.age || 30,
                occupation: customPersona.occupation || 'Unknown',
                personality: customPersona.personality || 'Friendly and casual',
                quirk: customPersona.quirk || 'Types casually',
            };
        } else if (personaId && personaId !== 'none') {
            persona = getPersonaById(personaId);
        }

        const conversation = createConversation({
            turnLimit: Math.min(30, Math.max(3, turnLimit)),
            persona,
            interrogatorModel,
            convincerModel,
            interrogatorStyle,
            humanRole: humanRole || null,
        });

        res.json(sanitizeConversation(conversation));
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
});

// Start a conversation (first message from interrogator)
app.post('/api/conversations/:id/start', async (req, res) => {
    try {
        const conversation = await startConversation(req.params.id);
        res.json(sanitizeConversation(conversation));
    } catch (error) {
        console.error('Error starting conversation:', error);
        res.status(500).json({ error: 'Failed to start conversation' });
    }
});

// Advance the conversation by one turn
app.post('/api/conversations/:id/advance', async (req, res) => {
    try {
        const conversation = await advanceConversation(req.params.id);
        res.json(sanitizeConversation(conversation));
    } catch (error) {
        console.error('Error advancing conversation:', error);
        res.status(500).json({ error: 'Failed to advance conversation' });
    }
});

// Submit a human player's message
app.post('/api/conversations/:id/message', async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || typeof content !== 'string') {
            return res.status(400).json({ error: 'Message content is required' });
        }
        const conversation = await submitHumanMessage(req.params.id, content.trim());
        res.json(sanitizeConversation(conversation));
    } catch (error) {
        console.error('Error submitting message:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to submit message' });
    }
});

// End conversation and get verdict
app.post('/api/conversations/:id/end', async (req, res) => {
    try {
        const conversation = await endConversation(req.params.id);
        res.json(sanitizeConversation(conversation));
    } catch (error) {
        console.error('Error ending conversation:', error);
        res.status(500).json({ error: 'Failed to end conversation' });
    }
});

// Get a specific conversation
app.get('/api/conversations/:id', (req, res) => {
    const conversation = getConversation(req.params.id);
    if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json(sanitizeConversation(conversation));
});

// Get conversation history
app.get('/api/history', (req, res) => {
    const history = getHistory();
    res.json(history.map(sanitizeConversation));
});

// Get pattern analysis across all conversations
app.get('/api/patterns', (req, res) => {
    try {
        const history = getHistory();
        const analysis = aggregatePatternAnalysis(history);

        // Add pattern definitions for frontend display
        const patternsWithMeta = analysis.topPatterns.map(p => {
            const definition = DETECTION_PATTERNS.find(d => d.id === p.patternId);
            return {
                ...p,
                description: definition?.description || '',
                category: definition?.category || 'unknown',
            };
        });

        res.json({
            ...analysis,
            topPatterns: patternsWithMeta,
            totalConversations: history.length,
        });
    } catch (error) {
        console.error('Error analyzing patterns:', error);
        res.status(500).json({ error: 'Failed to analyze patterns' });
    }
});

// Remove internal state from response
function sanitizeConversation(conv: Conversation) {
    return {
        id: conv.id,
        status: conv.status,
        config: conv.config,
        messages: conv.messages,
        verdict: conv.verdict,
        createdAt: conv.createdAt,
        completedAt: conv.completedAt,
        currentTurn: Math.floor(conv.messages.length / 2),
        maxTurns: conv.config.turnLimit,
    };
}

app.listen(PORT, () => {
    console.log(`🎭 Reverse Turing Test server running on http://localhost:${PORT}`);
    console.log(`📝 Using model: ${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`);
});
