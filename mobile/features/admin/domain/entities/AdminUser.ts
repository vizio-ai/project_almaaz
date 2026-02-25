export interface AdminUser {
  id: string;
  displayId: string;  // '#XXXXXX'
  name: string;
  joined: string;     // formatted 'DD.MM.YYYY'
  isActive: boolean;
}
