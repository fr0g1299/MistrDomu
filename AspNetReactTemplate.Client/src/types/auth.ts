export enum Role {
  User = "User",
  Admin = "Admin",
}

export interface User {
  isAuthenticated: boolean;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles?: Role[];
}
