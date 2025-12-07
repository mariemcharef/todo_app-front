export interface User {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  confirmed?: boolean;
  created_on?: string;
}

export interface UserCreate {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface UserUpdate {
  first_name: string;
  last_name: string;
  email: string;
  confirmed?: boolean;
}