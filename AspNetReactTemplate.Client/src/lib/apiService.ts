import { Tool } from "@/types/tool";
import { Manual, GuideStep } from "../types/manual";
import type { AdminUsersPage, AdminUsersQuery } from "@/types/adminUser";
import type { Role } from "@/types/auth";
import type {
  AdminRoleRequestItem,
  AdminRoleRequestsPage,
  AdminRoleRequestsQuery,
  CreateRoleRequestPayload,
  RoleRequestFilter,
  RoleRequestSummary,
  UserRoleRequestDetail,
  UserRoleRequestsPage,
} from "@/types/roleRequest";
import type {
  NotificationListQuery,
  NotificationPage,
} from "@/types/notification";

export type ExpertForManualRead = {
  expertId: number;
  expertName: string;
};

export type ManualForExpertRead = {
  manualId: number;
  manualTitle: string;
};

export type AvailableExpertRead = {
  expertId: number;
  expertName: string;
};

export type StartedManualCallRead = {
  roomUrl: string;
  roomName: string;
  expertId: number;
  expertName: string;
};

export type PendingManualCallRead = {
  roomUrl: string;
  roomName: string;
  manualId: number;
  manualTitle: string;
  callerUserId: number;
  callerDisplayName?: string | null;
};

export type ManualCallLogCreate = {
  manualId: number;
  counterpartyUserId: number;
  roomName: string;
  durationSeconds: number;
};

export type ExpertWaitingStatusRead = {
  isWaiting: boolean;
  waitingSinceUtc?: string | null;
  sessionToken?: string | null;
};

export type ExpertWaitingSessionRead = {
  sessionToken: string;
};

export type CallSessionStartRequest = {
  manualId: number;
  counterpartyUserId: number;
  roomName: string;
};

export type CallSessionStartResponse = {
  sessionToken: string;
  expiresAtUtc: string;
};

export type CallSessionStopRequest = {
  sessionToken: string;
  roomName: string;
};

export type ExpertManualCallRecordRead = {
  roomName: string;
  durationSeconds: number;
  loggedAtUtc: string;
  counterpartyUserId: number;
};

export type ExpertManualCallDetailRead = {
  manualId: number;
  manualTitle: string;
  callsCount: number;
  calls: ExpertManualCallRecordRead[];
};

export type ExpertWithdrawalRead = {
  id: number;
  amountCzk: number;
  balanceBeforeCzk: number;
  balanceAfterCzk: number;
  withdrawnAtUtc: string;
};

const API_BASE_URL = "/api";
const WAITING_SESSION_TOKEN_STORAGE_KEY = "expert-waiting-session-token";
const WAITING_SESSION_TOKEN_HEADER = "X-Waiting-Session-Token";

const getWaitingSessionToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage.getItem(WAITING_SESSION_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

const attachWaitingSessionTokenHeader = (headers: Headers) => {
  const sessionToken = getWaitingSessionToken();
  if (sessionToken) {
    headers.set(WAITING_SESSION_TOKEN_HEADER, sessionToken);
  }
};

const dispatchHeaderRefresh = () => {
  window.dispatchEvent(new CustomEvent("header:refresh"));
};

function normalizePendingRoleRequestsResponse(
  raw: AdminRoleRequestsPage | AdminRoleRequestItem[] | Record<string, unknown>,
  requestedPage?: number,
  requestedPageSize?: number,
): AdminRoleRequestsPage {
  if (Array.isArray(raw)) {
    const page = requestedPage ?? 1;
    const pageSize = requestedPageSize ?? 10;

    return {
      items: raw,
      currentPage: page,
      pageSize,
      totalItems: raw.length,
      totalPages: raw.length === 0 ? 1 : Math.ceil(raw.length / pageSize),
    };
  }

  const source = raw as Record<string, unknown>;
  const items = (source.items ?? source.Items) as
    | AdminRoleRequestItem[]
    | undefined;
  const currentPage = (source.currentPage ?? source.CurrentPage) as
    | number
    | undefined;
  const pageSize = (source.pageSize ?? source.PageSize) as number | undefined;
  const totalItems = (source.totalItems ?? source.TotalItems) as
    | number
    | undefined;
  const totalPages = (source.totalPages ?? source.TotalPages) as
    | number
    | undefined;

  if (!Array.isArray(items)) {
    return {
      items: [],
      currentPage: requestedPage ?? 1,
      pageSize: requestedPageSize ?? 10,
      totalItems: 0,
      totalPages: 1,
    };
  }

  return {
    items,
    currentPage:
      typeof currentPage === "number" ? currentPage : (requestedPage ?? 1),
    pageSize:
      typeof pageSize === "number" ? pageSize : (requestedPageSize ?? 10),
    totalItems: typeof totalItems === "number" ? totalItems : items.length,
    totalPages:
      typeof totalPages === "number"
        ? totalPages
        : items.length === 0
          ? 1
          : Math.ceil(items.length / (requestedPageSize ?? 10)),
  };
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  attachWaitingSessionTokenHeader(headers);

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
          const fromArray = errors.filter(
            (item): item is string => typeof item === "string",
          );
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
    return requestJson<AdminUsersPage>(
      `/SelectUser${suffix ? `?${suffix}` : ""}`,
    );
  },

  async setUserRole(userId: number, role: Role): Promise<{ message: string }> {
    const result = await requestJson<{ message: string }>(
      `/EditUser/${userId}/role`,
      {
        method: "PUT",
        body: JSON.stringify({ role }),
      },
    );

    dispatchHeaderRefresh();
    return result;
  },

  async createExpertRoleRequest(): Promise<RoleRequestSummary> {
    const result = await requestJson<RoleRequestSummary>(
      "/RoleRequest/expert",
      {
        method: "POST",
      },
    );

    dispatchHeaderRefresh();
    return result;
  },

  async createRoleRequest(
    payload: CreateRoleRequestPayload,
  ): Promise<RoleRequestSummary> {
    const result = await requestJson<RoleRequestSummary>("/RoleRequest", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    dispatchHeaderRefresh();
    return result;
  },

  async getMyRoleRequests(
    query: {
      page?: number;
      pageSize?: number;
      status?: RoleRequestFilter;
    } = {},
  ): Promise<UserRoleRequestsPage> {
    const params = new URLSearchParams();
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    if (query.status) params.set("status", query.status);

    const suffix = params.toString();
    return requestJson<UserRoleRequestsPage>(
      `/RoleRequest/my${suffix ? `?${suffix}` : ""}`,
    );
  },

  async getMyRoleRequestDetail(
    requestId: number,
  ): Promise<UserRoleRequestDetail> {
    return requestJson<UserRoleRequestDetail>(`/RoleRequest/my/${requestId}`);
  },

  async getMyExpertRoleRequest(): Promise<RoleRequestSummary | null> {
    const headers = new Headers({
      Accept: "application/json",
    });
    attachWaitingSessionTokenHeader(headers);

    const response = await fetch(`${API_BASE_URL}/RoleRequest/my-expert`, {
      credentials: "include",
      headers,
    });

    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    return (await response.json()) as RoleRequestSummary;
  },

  async getPendingExpertRoleRequests(
    query: AdminRoleRequestsQuery = {},
  ): Promise<AdminRoleRequestsPage> {
    const params = new URLSearchParams();
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    if (query.status) params.set("status", query.status);

    const suffix = params.toString();
    const data = await requestJson<
      AdminRoleRequestsPage | AdminRoleRequestItem[] | Record<string, unknown>
    >(`/RoleRequestAdmin/expert/pending${suffix ? `?${suffix}` : ""}`);

    return normalizePendingRoleRequestsResponse(
      data,
      query.page,
      query.pageSize,
    );
  },

  async getPendingExpertRoleRequestsCount(): Promise<number> {
    return requestJson<number>("/RoleRequestAdmin/expert/pending/count");
  },

  async approveExpertRoleRequest(
    requestId: number,
    note?: string,
  ): Promise<void> {
    await requestJson<{ message: string }>(
      `/RoleRequestAdmin/expert/${requestId}/approve`,
      {
        method: "POST",
        body: JSON.stringify({ note }),
      },
    );

    dispatchHeaderRefresh();
  },

  async rejectExpertRoleRequest(
    requestId: number,
    note?: string,
  ): Promise<void> {
    await requestJson<{ message: string }>(
      `/RoleRequestAdmin/expert/${requestId}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ note }),
      },
    );

    dispatchHeaderRefresh();
  },

  async updateExpertRoleRequestNote(
    requestId: number,
    note?: string,
  ): Promise<void> {
    await requestJson<{ message: string }>(
      `/RoleRequestAdmin/expert/${requestId}/note`,
      {
        method: "PUT",
        body: JSON.stringify({ note }),
      },
    );

    dispatchHeaderRefresh();
  },

  async getMyNotifications(
    query: NotificationListQuery = {},
  ): Promise<NotificationPage> {
    const params = new URLSearchParams();
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    if (query.unreadOnly) params.set("unreadOnly", "true");

    const suffix = params.toString();
    return requestJson<NotificationPage>(
      `/Notification/my${suffix ? `?${suffix}` : ""}`,
    );
  },

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await requestJson<{ message: string }>(
      `/Notification/${notificationId}/read`,
      {
        method: "PUT",
      },
    );

    dispatchHeaderRefresh();
  },

  async deleteNotification(notificationId: number): Promise<void> {
    await requestJson<{ message: string }>(`/Notification/${notificationId}`, {
      method: "DELETE",
    });

    dispatchHeaderRefresh();
  },

  async deleteAllNotifications(): Promise<void> {
    await requestJson<{ message: string }>("/Notification/my", {
      method: "DELETE",
    });

    dispatchHeaderRefresh();
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

  async getPaidManualIds(): Promise<number[]> {
    return requestJson<number[]>(`/payment/check/manual-ids`);
  },

  async checkExpertConsultationPayment(
    manualId: number,
  ): Promise<{ hasPaid: boolean }> {
    return requestJson<{ hasPaid: boolean }>(
      `/payment/check/expert-consultation/${manualId}`,
    );
  },

  async checkoutExpertConsultation(
    manualId: number,
  ): Promise<{ url?: string; alreadyPaid?: boolean }> {
    return requestJson<{ url?: string; alreadyPaid?: boolean }>(
      "/payment/checkout",
      {
        method: "POST",
        body: JSON.stringify({ manualId, paymentType: "ExpertConsultation" }),
      },
    );
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
    const response = await fetch(
      `${API_BASE_URL}/steps/${manualId}/completed/${stepId}`,
      {
        method: "POST",
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    dispatchHeaderRefresh();
  },

  async resetCompletedSteps(manualId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/steps/${manualId}/completed`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    dispatchHeaderRefresh();
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

    dispatchHeaderRefresh();
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

    dispatchHeaderRefresh();
  },

  async getAvailableExpertsForManual(
    manualId: number,
  ): Promise<AvailableExpertRead[]> {
    return requestJson<AvailableExpertRead[]>(
      `/calls/manual/${manualId}/available-experts`,
    );
  },

  async startManualCall(manualId: number): Promise<StartedManualCallRead> {
    const response = await fetch(
      `${API_BASE_URL}/calls/manual/${manualId}/start`,
      {
        method: "POST",
        credentials: "include",
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed (${response.status})`);
    }

    return response.json() as Promise<StartedManualCallRead>;
  },

  async setExpertWaiting(
    isWaiting: boolean,
    sessionToken?: string,
  ): Promise<ExpertWaitingSessionRead | void> {
    const suffix = isWaiting ? "start" : "stop";
    const headers = new Headers({
      "Content-Type": "application/json",
    });
    attachWaitingSessionTokenHeader(headers);

    const response = await fetch(`${API_BASE_URL}/calls/waiting/${suffix}`, {
      method: "POST",
      credentials: "include",
      headers,
      body: isWaiting ? undefined : JSON.stringify({ sessionToken }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed (${response.status})`);
    }

    if (isWaiting) {
      return response.json() as Promise<ExpertWaitingSessionRead>;
    }
  },

  sendExpertWaitingStopBeacon(sessionToken: string): boolean {
    if (typeof window === "undefined" || !sessionToken) {
      return false;
    }

    if (!navigator.onLine || typeof navigator.sendBeacon !== "function") {
      return false;
    }

    const payload = new Blob([JSON.stringify({ sessionToken })], {
      type: "application/json",
    });

    return navigator.sendBeacon(`${API_BASE_URL}/calls/waiting/stop`, payload);
  },

  async sendExpertWaitingHeartbeat(sessionToken: string): Promise<void> {
    const headers = new Headers({
      "Content-Type": "application/json",
    });
    attachWaitingSessionTokenHeader(headers);

    const response = await fetch(`${API_BASE_URL}/calls/waiting/heartbeat`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ sessionToken }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${text || "Request failed"} (${response.status})`);
    }
  },

  async getNextWaitingCall(): Promise<PendingManualCallRead | null> {
    const headers = new Headers();
    attachWaitingSessionTokenHeader(headers);

    const response = await fetch(`${API_BASE_URL}/calls/waiting/next`, {
      method: "GET",
      credentials: "include",
      headers,
    });

    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed (${response.status})`);
    }

    return response.json() as Promise<PendingManualCallRead>;
  },

  async getExpertWaitingStatus(): Promise<ExpertWaitingStatusRead> {
    return requestJson<ExpertWaitingStatusRead>("/calls/waiting/status");
  },

  async logManualCallDuration(payload: ManualCallLogCreate): Promise<void> {
    const headers = new Headers({
      "Content-Type": "application/json",
    });
    attachWaitingSessionTokenHeader(headers);

    const response = await fetch(`${API_BASE_URL}/calls/log`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed (${response.status})`);
    }
  },

  async startCallSession(
    payload: CallSessionStartRequest,
  ): Promise<CallSessionStartResponse> {
    return requestJson<CallSessionStartResponse>("/calls/session/start", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async stopCallSession(payload: CallSessionStopRequest): Promise<void> {
    const headers = new Headers({
      "Content-Type": "application/json",
    });

    const response = await fetch(`${API_BASE_URL}/calls/session/stop`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed (${response.status})`);
    }
  },

  async getTotalCallsByExpert(expertId: number): Promise<number> {
    return requestJson<number>(`/calls/report/expert/${expertId}/calls`);
  },

  async getTotalEarningsCzkByExpert(expertId: number): Promise<number> {
    return requestJson<number>(`/calls/report/expert/${expertId}/earnings-czk`);
  },

  async withdrawExpertBalance(amountCzk?: number): Promise<{
    newBalanceCzk: number;
    withdrawal: ExpertWithdrawalRead;
  }> {
    return requestJson<{
      newBalanceCzk: number;
      withdrawal: ExpertWithdrawalRead;
    }>("/payment/expert/withdraw", {
      method: "POST",
      body: JSON.stringify({ amountCzk }),
    });
  },

  async getExpertWithdrawalHistory(): Promise<ExpertWithdrawalRead[]> {
    return requestJson<ExpertWithdrawalRead[]>("/payment/expert/withdrawals");
  },

  async getTotalCallsByExpertForManual(
    expertId: number,
    manualId: number,
  ): Promise<number> {
    return requestJson<number>(
      `/calls/report/expert/${expertId}/manual/${manualId}/calls`,
    );
  },

  async getTotalOnlineSecondsByExpert(expertId: number): Promise<number> {
    return requestJson<number>(
      `/calls/report/expert/${expertId}/online-seconds`,
    );
  },

  async getManualCallDetailsByExpert(
    expertId: number,
  ): Promise<ExpertManualCallDetailRead[]> {
    return requestJson<ExpertManualCallDetailRead[]>(
      `/calls/report/expert/${expertId}/manual-call-details`,
    );
  },
};
