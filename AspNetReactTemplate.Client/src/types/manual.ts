export interface Step {
    id: number;
    title: string;
    content: string;
    imageUrl?: string;
    manualId: number;
}

export interface Manual {
    id: number;
    title: string;
    imageUrl?: string;
    description: string;
    difficulty: number;
    estimatedTimeMinutes: number;
    requiredTools: string;
    steps: Step[];
    createdAt: string;
}

export enum Difficulty {
    Easy = 0,
    Medium = 1,
    Hard = 2
}