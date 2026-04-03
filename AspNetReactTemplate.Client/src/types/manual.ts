export interface GuideStep {
  id: number;
  /** Original DB step ID — preserved before the local-sequence remapper overwrites id. */
  dbId?: number;
  title: string;
  content: string;
  imageUrl?: string;
  manualId: number;
  initiallyCompleted?: boolean;
}

export interface Manual {
  id: number;
  title: string;
  imageUrl?: string;
  description: string;
  tags?: string[];
  difficulty: number;
  estimatedTimeMinutes: number;
  steps?: GuideStep[];
  createdAt: string;
}

export enum Difficulty {
  Easy = 0,
  Medium = 1,
  Hard = 2,
}

export function getDifficultyLabel(difficulty?: number): string {
  if (difficulty === Difficulty.Easy) return "Začátečník";
  if (difficulty === Difficulty.Medium) return "Středně pokročilý";
  if (difficulty === Difficulty.Hard) return "Pokročilý";
  return "Neznámá";
}

export type TableOfContentsItem = {
  id: string;
  number: string;
  label: string;
};
