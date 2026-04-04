import { Tool } from "@/types/tool";
import { Manual, GuideStep } from "../types/manual";
import type { AdminUsersPage, AdminUsersQuery } from "@/types/adminUser";
import type { Role } from "@/types/auth";

export type ExpertForManualRead = {
  expertId: number;
  expertName: string;
};

export type ManualForExpertRead = {
  manualId: number;
  manualTitle: string;
};

const API_BASE_URL = "/api";

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const body = await response.json();
        const errors = body?.errors ?? body?.Errors;

        if (typeof body?.message === "string") {
          message = body.message;
        } else if (typeof body?.Message === "string") {
          message = body.Message;
        } else if (Array.isArray(errors) && errors.length > 0) {
          const fromArray = errors.filter((item): item is string => typeof item === "string");
          if (fromArray.length > 0) {
            message = fromArray.join("\n");
          }
        } else if (errors && typeof errors === "object") {
          const flattened = Object.values(errors as Record<string, string[]>)
            .flat()
            .filter(Boolean);
          if (flattened.length > 0) {
            message = flattened.join("\n");
          }
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
  // Admin users
  async getUsers(query: AdminUsersQuery = {}): Promise<AdminUsersPage> {
    const params = new URLSearchParams();

    if (query.search?.trim()) params.set("search", query.search.trim());
    if (query.role?.trim()) params.set("role", query.role.trim());
    if (query.sortDirection) params.set("sortDirection", query.sortDirection);
    if (query.sortBy) params.set("sortBy", query.sortBy);
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));

    const suffix = params.toString();
    return requestJson<AdminUsersPage>(`/SelectUser${suffix ? `?${suffix}` : ""}`);
  },

  async setUserRole(userId: number, role: Role): Promise<{ message: string }> {
    return requestJson<{ message: string }>(`/EditUser/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  },

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
