export interface Manual {
    id: number;
    title: string;
    imageUrl?: string;
    description: string;
    difficulty: number;
    estimatedTimeMinutes: number;
    requiredTools: string;
    createdAt: string;
}

export enum Difficulty {
    Easy = 0,
    Medium = 1,
    Hard = 2
}