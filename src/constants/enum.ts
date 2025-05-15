export enum UserVerifyStatus {
  Unverified,
  Verified,
  Banned
}

export enum UserRole {
  Undefined,
  Candidate,
  Employer,
  Admin
}

export enum GenderType {
  Male,
  Female,
  Other
}

export enum LevelType {
  Intern,
  Fresher,
  Junior,
  Middle,
  Senior,
  Lead
}

export enum YearExperienceType {
  LessThan1Year,
  From1To3Years,
  From3To5Years,
  From5To10Years,
  MoreThan10Years
}

export enum EducationType {
  HighSchool,
  College,
  University,
  Master,
  Doctor
}

export enum TypeWorkType {
  FullTime,
  PartTime,
  Remote,
  Hybrid
}

export enum JobStatus {
  Created,
  Recuriting,
  Stopped
}

export enum ApplyStatus {
  Pending,
  Approved,
  Interview,
  Rejected,
  Canceled,
  Passed,
  Failed,
  CandidateRejectInvite,
  CandidateAcceptInvite,
  WaitingCandidateAcceptSchedule,
  WaitingEmployerAcceptSchedule,
  WaitingCandidateAcceptInvite,
}

export interface PhoneInfo {
  name: string;
  phone_number: string;
}

export interface AddressInfo {
  name: string;
  address: string;
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  FogotPasswordToken,
  VerifyEmailToken
}

export interface Media {
  url: string;
  type: MediaType; // video, image
}
export enum MediaType {
  Image,
  Video,
  PDF
}

export enum SendEmail {
  VerifyEmail,
  ForgotPassword
}
