import { JwtPayload } from 'jsonwebtoken';
import { UserRole, UserVerifyStatus } from '~/constants/enum';
import { Account } from '../schemas/AccountSchema';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface RefreshTokenRequest {
  decodeRefreshToken: JwtPayload;
  refreshToken: string;
}

export interface VerifyEmailRequest {
  emailVerifyToken: string;
  decodeEmailVerifyToken: JwtPayload;
}

export interface ResendVerifyEmailRequest {
  decodeAuthorization: JwtPayload;
}

export interface DataSearchUser {
  name?: string;
  email?: string;
  role?: UserRole;
}

export interface ForgotPasswordRequest {
  email: string;
  user: Account;
}

export interface ResetPasswordRequest {
  password: string;
  confirmPassword: string;
  user: Account;
  //forgotPasswordToken: string;
}

export interface GetMeRequest {
  decodeAuthorization: JwtPayload;
}

export interface UpdateMeRequest {
  decodeAuthorization: JwtPayload;
  name?: string;
  date_of_birth?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  decodeAuthorization: JwtPayload;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AddUsersToCircleRequest {
  decodeAuthorization: JwtPayload;
  userIds: string[];
}
