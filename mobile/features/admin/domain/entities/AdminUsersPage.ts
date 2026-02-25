import { AdminUser } from './AdminUser';

export interface AdminUsersPage {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}
