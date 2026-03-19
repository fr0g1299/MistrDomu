import { Manual } from '../types/manual';

const API_BASE_URL = '/api';

export const apiService = {
    async getAllManuals(): Promise<Manual[]> {
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