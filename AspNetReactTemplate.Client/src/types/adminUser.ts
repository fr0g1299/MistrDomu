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

export const editableRoles = [Role.User, Role.Admin, Role.Expert] as const;

