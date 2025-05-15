import { config } from 'dotenv';

const environment = process.env.NODE_ENV;

export const isProduction = Boolean(environment === 'production');
config({
  path: environment && environment !== 'development' ? `.env.${environment}` : '.env'
});

export const env = {
  port: process.env.PORT as string,
  host: process.env.HOST as string,
  clientUrl: process.env.CLIENT_URL as string,

  mongodbURI: process.env.MONGODB_URI as string,
  dbName: process.env.DB_NAME as string,

  JWTSecretKey: process.env.JWT_SECRET_KEY as string,
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as string,
  refreshTokenExporesIn: process.env.REFRESH_TOKEN_EXPIRES_IN as string,

  googleClientID: process.env.GOOGLE_CLIENT_ID as string,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  googleRedirectURI: process.env.GOOGLE_REDIRECT_URI as string,
  clientRedirectCallback: process.env.CLIENT_REDIRECT_CALLBACK as string,

  emailAppPassword: process.env.EMAIL_APP_PASSWORD as string,
  emailApp: process.env.EMAIL_APP as string,

  AWSAccessKeyID: process.env.AWS_ACCESS_KEY_ID as string,
  AWSSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  AWSRegion: process.env.AWS_REGION as string,
  SESFromAddress: process.env.SES_FROM_ADDRESS as string,
  S3Name: process.env.S3_NAME as string,

  AgoraAppId: process.env.APP_ID as string,
  AgoraAppCertificate: process.env.APP_CERTIFICATE as string,

  subjectEmailVerifyEmail: process.env.SUBJECT_EMAIL_VERIFY_EMAIL as string,
  contentEmailVerifyEmail: process.env.CONTENT_EMAIL_VERIFY_EMAIL as string,
  titleEmailVerifyEmail: process.env.TITLE_EMAIL_VERIFY_EMAIL as string,
  subjectEmailForgotPassword: process.env.SUBJECT_EMAIL_FORGOT_PASSWORD as string,
  titleEmailForgotPassword: process.env.TITLE_EMAIL_FORGOT_PASSWORD as string,
  contentEmailForgotPassword: process.env.CONTENT_EMAIL_FORGOT_PASSWORD as string
};
