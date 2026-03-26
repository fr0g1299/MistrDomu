export interface Tool {
  id: number;
  name: string;
  url?: string;
}

export interface ToolWithManuals extends Tool {
  manuals?: string[];
}
