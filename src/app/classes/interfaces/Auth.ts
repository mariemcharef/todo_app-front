export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token?: string;
  token_type?: string;
  message?: string;
  status: number;
}

export interface ForgotPassword {
  email: string;
}

export interface ResetPassword {
  reset_password_token: string;
  new_password: string;
  confirm_new_password: string;
}

export interface ConfirmAccount {
  code: string;
}
