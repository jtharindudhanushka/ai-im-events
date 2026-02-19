import Groq from 'groq-sdk';

// Initialize Groq client
// Note: Requires GROQ_API_KEY in environment variables
export const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'dummy_key_for_build',
    dangerouslyAllowBrowser: false, // Server-side only
});

export const MODEL_ID = 'llama3-70b-8192';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

// Helper to sanitize history for Groq (it expects 'assistant' not 'model')
export function sanitizeHistory(history: any[]): ChatMessage[] {
    return history.map((msg) => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.parts?.[0]?.text || msg.content || '',
    }));
}
