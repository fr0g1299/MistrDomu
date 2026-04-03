import { Tool } from "@/types/tool";
import { Manual, GuideStep } from "../types/manual";

export type ExpertForManualRead = {
  expertId: number;
  expertName: string;
};

export type ManualForExpertRead = {
  manualId: number;
  manualTitle: string;
};

const API_BASE_URL = "/api";

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const body = await response.json();
        if (body?.message && typeof body.message === "string") {
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
  // Manuals
  async getAllManuals(includeSteps = false): Promise<Manual[]> {
    return requestJson<Manual[]>(`/manuals?includeSteps=${includeSteps}`);
  },

  async getManual(id: number, includeSteps = false): Promise<Manual> {
    return requestJson<Manual>(`/manuals/${id}?includeSteps=${includeSteps}`);
  },

  async searchManuals(
    keyword: string,
    includeSteps = false,
  ): Promise<Manual[]> {
    const trimmed = keyword.trim();
    if (!trimmed) {
      return [];
    }

    return requestJson<Manual[]>(
      `/manuals/search/${encodeURIComponent(trimmed)}?includeSteps=${includeSteps}`,
    );
  },

  async getManualSteps(manualId: number): Promise<GuideStep[]> {
    return requestJson<GuideStep[]>(`/manuals/${manualId}/steps`);
  },

  // Tools
  async getTools(): Promise<Tool[]> {
    return requestJson<Tool[]>(`/tools`);
  },

  async getTool(id: number): Promise<Tool> {
    return requestJson<Tool>(`/tools/${id}`);
  },

  async getManualTools(manualId: number): Promise<Tool[]> {
    return requestJson<Tool[]>(`/manuals/${manualId}/tools`);
  },

  // Completed steps
  async getCompletedSteps(manualId: number): Promise<number[]> {
    return requestJson<number[]>(`/steps/${manualId}/completed`);
  },

  async toggleCompletedStep(manualId: number, stepId: number): Promise<void> {
    await fetch(`${API_BASE_URL}/steps/${manualId}/completed/${stepId}`, {
      method: "POST",
      credentials: "include",
    });
  },

  async resetCompletedSteps(manualId: number): Promise<void> {
    await fetch(`${API_BASE_URL}/steps/${manualId}/completed`, {
      method: "DELETE",
      credentials: "include",
    });
  },

  async registerAsManualHelper(
    manualId: number,
    expertId: number,
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/ExpertManualHelp`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ manualId, expertId }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Request failed (${response.status})`);
    }
  },

  async getExpertsForManual(manualId: number): Promise<ExpertForManualRead[]> {
    return requestJson<ExpertForManualRead[]>(
      `/ExpertManualHelp/manual/${manualId}/experts`,
    );
  },

  async getManualsForExpert(expertId: number): Promise<ManualForExpertRead[]> {
    return requestJson<ManualForExpertRead[]>(
      `/ExpertManualHelp/expert/${expertId}/manuals`,
    );
  },

  async addManualToExpert(manualId: number, expertId: number): Promise<void> {
    return apiService.registerAsManualHelper(manualId, expertId);
  },

  async removeManualFromExpert(
    manualId: number,
    expertId: number,
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/ExpertManualHelp/manual/${manualId}/expert/${expertId}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Request failed (${response.status})`);
    }
  },
};
