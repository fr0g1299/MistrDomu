export type ManagementNavAction = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  to: string;
  isActive: boolean;
  badgeCount?: number;
};
