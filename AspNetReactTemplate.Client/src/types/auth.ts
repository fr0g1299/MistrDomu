export enum Role {
  User = "User",
  Admin = "Admin",
  Expert = "Expert",
}

export interface User {
  id?: number;
  isAuthenticated: boolean;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles?: Role[];
}
