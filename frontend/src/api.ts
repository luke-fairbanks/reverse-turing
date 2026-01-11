const API_BASE = '/api';

export interface ModelInfo {
    id: string;
    name: string;
    provider: string;
}

export async function fetchPersonas() {
    const res = await fetch(`${API_BASE}/personas`);
    if (!res.ok) throw new Error('Failed to fetch personas');
    return res.json();
}

export async function fetchModels(): Promise<ModelInfo[]> {
    const res = await fetch(`${API_BASE}/models`);
    if (!res.ok) throw new Error('Failed to fetch models');
    return res.json();
}

export async function createConversation(params: {
    turnLimit: number;
    personaId?: string;
    customPersona?: {
        name: string;
        age: number;
        occupation: string;
        personality: string;
        quirk: string;
    };
    interrogatorModel?: string;
    convincerModel?: string;
    interrogatorStyle?: 'neutral' | 'aggressive' | 'casual' | 'philosophical' | 'tricky';
}) {
    const res = await fetch(`${API_BASE}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
}

export async function startConversation(id: string) {
    const res = await fetch(`${API_BASE}/conversations/${id}/start`, {
        method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to start conversation');
    return res.json();
}

export async function advanceConversation(id: string) {
    const res = await fetch(`${API_BASE}/conversations/${id}/advance`, {
        method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to advance conversation');
    return res.json();
}

export async function endConversation(id: string) {
    const res = await fetch(`${API_BASE}/conversations/${id}/end`, {
        method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to end conversation');
    return res.json();
}

export async function getConversation(id: string) {
    const res = await fetch(`${API_BASE}/conversations/${id}`);
    if (!res.ok) throw new Error('Failed to get conversation');
    return res.json();
}

export async function getHistory() {
    const res = await fetch(`${API_BASE}/history`);
    if (!res.ok) throw new Error('Failed to get history');
    return res.json();
}
