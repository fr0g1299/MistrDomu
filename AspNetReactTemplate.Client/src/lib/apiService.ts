import { Manual } from '../types/manual';

const API_BASE_URL = '/api';

async function requestJson<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            Accept: 'application/json'
        }
    });

    if (!response.ok) {
        let message = `Request failed (${response.status})`;

        try {
            const contentType = response.headers.get('content-type') ?? '';
            if (contentType.includes('application/json')) {
                const body = await response.json();
                if (body?.message && typeof body.message === 'string') {
                    message = body.message;
                }
            } else {
                const text = await response.text();
                if (text) {
                    message = text;
                }
            }
        } catch {
            // Keep fallback message when error body cannot be parsed.
        }

        throw new Error(message);
    }

    return response.json() as Promise<T>;
}

export const apiService = {
    async getAllManuals(): Promise<Manual[]> {
        return requestJson<Manual[]>('/manuals');
    },

    async getManual(id: number): Promise<Manual> {
        return requestJson<Manual>(`/manuals/${id}`);
    },

    async searchManuals(keyword: string): Promise<Manual[]> {
        const trimmed = keyword.trim();
        if (!trimmed) {
            return [];
        }

        return requestJson<Manual[]>(`/manuals/search/${encodeURIComponent(trimmed)}`);
    }
};