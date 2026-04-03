import { Role } from "./auth";

export interface AdminUserRow {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  roles: string;
}

export interface AdminUsersQuery {
  search?: string;
  role?: string;
  sortDirection?: "asc" | "desc";
  sortBy?:  "lastName" | "role";
  page?: number;
  pageSize?: number;
}

export interface AdminUsersPage {
  items: AdminUserRow[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export const editableRoles = [Role.User, Role.Admin, Role.Expert] as const;

