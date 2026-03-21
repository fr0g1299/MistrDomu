// TODO: In future maybe combine these with manual.ts
export type GuideStep = {
  id: number;
  title: string;
  description: string;
  image?: string;
  initiallyCompleted?: boolean;
};

export type TableOfContentsItem = {
  id: string;
  number: string;
  label: string;
};
