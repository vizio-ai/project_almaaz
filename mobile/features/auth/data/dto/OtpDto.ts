export interface SendOtpRequestDto {
  phone: string;
}

export interface VerifyOtpRequestDto {
  phone: string;
  token: string;
}

export interface OtpSessionDto {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id: string;
  phone: string;
  is_onboarded: boolean;
}
