export interface Tool {
  id: number;
  name: string;
  url?: string;
  note?: string;
}

export interface ToolWithManuals extends Tool {
  manuals?: string[];
}
