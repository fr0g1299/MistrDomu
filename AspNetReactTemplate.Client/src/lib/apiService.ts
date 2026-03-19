export interface Manual {
    id: number;
    title: string;
    imageUrl?: string;
    description: string;
    difficulty: number;
    estimatedTimeMinutes: number;
    requiredTools: string;
}

const API_BASE_URL = '/api';

export const ApiService = {
    async getManuals(): Promise<Manual[]> {
        const response = await fetch(`${API_BASE_URL}/manuals`);
        if (!response.ok) throw new Error('Failed to fetch manuals');
        const manuals = await response.json();
        return manuals;
    },

    async getManual(id: number): Promise<Manual> {
        const response = await fetch(`${API_BASE_URL}/manuals/${id}`);
        if (!response.ok) throw new Error('Failed to fetch manual');
        const manual = await response.json();
        return manual;
    }
};