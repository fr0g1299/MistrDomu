export type RoleRequestStatus = "Pending" | "Approved" | "Rejected";
export type RoleRequestFilter = "all" | "pending" | "approved" | "rejected";
export type RoleRequestType = "Expert";

export interface CreateRoleRequestPayload {
  requestType: RoleRequestType;
  description?: string;
}

export interface RoleRequestSummary {
  id: number;
  requestedRole: string;
  status: RoleRequestStatus;
  requestedAtUtc: string;
  reviewedAtUtc?: string | null;
  userNote?: string | null;
  adminNote?: string | null;
}

export interface UserRoleRequestItem {
  id: number;
  requestType: string;
  status: RoleRequestStatus;
  requestedAtUtc: string;
  reviewedAtUtc?: string | null;
}

export interface UserRoleRequestsPage {
  items: UserRoleRequestItem[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface UserRoleRequestDetail {
  id: number;
  requestType: string;
  status: RoleRequestStatus;
  requestedAtUtc: string;
  reviewedAtUtc?: string | null;
  description?: string | null;
  adminNote?: string | null;
}

export interface AdminRoleRequestItem {
  id: number;
  userId: number;
  userName: string;
  email?: string | null;
  userNote?: string | null;
  requestedAtUtc: string;
  status: RoleRequestStatus;
  reviewedAtUtc?: string | null;
  adminNote?: string | null;
}

export interface AdminRoleRequestsQuery {
  page?: number;
  pageSize?: number;
  status?: RoleRequestFilter;
}

export interface AdminRoleRequestsPage {
  items: AdminRoleRequestItem[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface AdminNotificationPayload {
  requestId: number;
  userId?: number;
  userName?: string;
  status?: RoleRequestStatus;
  pendingCount: number;
  requestedAtUtc?: string;
}

export interface UserRoleRequestNotificationPayload {
  requestId: number;
  status: RoleRequestStatus;
  adminNote?: string | null;
  reviewedAtUtc?: string | null;
}

export interface UserRoleRequestInboxItem {
  id: string;
  requestId: number;
  status: RoleRequestStatus;
  adminNote?: string | null;
  reviewedAtUtc?: string | null;
  message: string;
  receivedAtUtc: string;
  isRead: boolean;
}

