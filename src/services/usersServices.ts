import {
  AddUsersToCircleRequest,
  ChangePasswordRequest,
  DataSearchUser,
  ForgotPasswordRequest,
  GetMeRequest,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ResendVerifyEmailRequest,
  ResetPasswordRequest,
  VerifyEmailRequest
} from '~/models/requests/UserRequests';
import bcrypt from 'bcrypt';
import db from '~/services/databaseServices';
import { signToken, verifyToken } from '~/utils/jwt';
import { SendEmail, TokenType, UserRole, UserVerifyStatus } from '~/constants/enum';
import { ErrorWithStatus } from '~/models/Errors';
import { RefreshToken } from '~/models/schemas/RefreshTokenSchema';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { httpStatus } from '~/constants/httpStatus';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { env } from '~/constants/config';
import { sendVerifyEmail } from './emailServices';
import { omit } from 'lodash';
import { Account } from '~/models/schemas/AccountSchema';
import { Candidate } from '~/models/schemas/CandidateSchema';
import { Employer } from '~/models/schemas/EmployerSchema';

class UsersService {
  constructor() {}
  signAccessToken(userId: string, role: UserRole, verify: UserVerifyStatus,username?: string,) {
    return signToken(
      {
        payload: {
          userId,
          role,
          type: TokenType.AccessToken,
          verify,
          username
        }
      },
      {
        expiresIn: env.accessTokenExpiresIn
      }
    );
  }

  signRefreshToken(userId: string, role: UserRole, verify: UserVerifyStatus, expiresIn?: number) {
    return signToken(
      {
        payload: {
          userId,
          role,
          type: TokenType.RefreshToken,
          verify
        }
      },
      {
        expiresIn: expiresIn || env.refreshTokenExporesIn
      }
    );
  }

  signEmailVerifyToken(userId: string) {
    return signToken({
      payload: {
        userId,
        type: TokenType.VerifyEmailToken
      }
    });
  }

  signForgotPasswordToken(userId: string) {
    return signToken({
      payload: {
        userId,
        type: TokenType.FogotPasswordToken
      }
    });
  }

  async login(payload: LoginRequest) {
    console.log(payload);
    const user = await db.accounts.findOne({ email: payload.email });
    if (!user) {
      throw new ErrorWithStatus({
        status: 401,
        message: 'Email not found'
      });
    } else {
      if (user.status === UserVerifyStatus.Unverified) {
        throw new ErrorWithStatus({
          status: httpStatus.FORBIDDEN,
          message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email để xác nhận.'
        });
      }
      if (user.status === UserVerifyStatus.Banned) {
        throw new ErrorWithStatus({
          status: httpStatus.FORBIDDEN,
          message: 'Tài khoản đã bị khóa. Vui lòng liên hệ với quản trị để xác nhận.'
        });
      }
      const checkPassword = await bcrypt.compareSync(payload.password, user.password);
      if (checkPassword) {
        const [accessToken, refreshToken] = await Promise.all([
          this.signAccessToken(user._id.toString(), user.role, user.status,user?.username),
          this.signRefreshToken(user._id.toString(), user.role, user.status)
        ]);

        await db.refreshTokens.insertOne(
          new RefreshToken({
            token: refreshToken,
            created_at: new Date(),
            user_id: user._id
          })
        );

        return {
          accessToken,
          refreshToken,
          isVerified: user.status === UserVerifyStatus.Verified
        };
      } else {
        throw new ErrorWithStatus({
          status: 401,
          message: 'Password incorrect'
        });
      }
    }
  }

  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: env.googleClientID,
      client_secret: env.googleClientSecret,
      redirect_uri: env.googleRedirectURI,
      grant_type: 'authorization_code'
    };
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return data;
  }

  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    });
    return data;
  }

  async loginGoogle(code: string) {
    const oauthGoogleToken = await this.getOauthGoogleToken(code);
    const googleUserInfo = await this.getGoogleUserInfo(oauthGoogleToken.access_token, oauthGoogleToken.id_token);
    if (!googleUserInfo.verified_email) {
      throw new ErrorWithStatus({
        message: 'Email not verified',
        status: httpStatus.BAD_REQUEST
      });
    }

    const userInDb = await this.checkEmailExists(googleUserInfo.email);

    if (userInDb) {
      const [accessToken, refreshToken] = await Promise.all([
        this.signAccessToken(userInDb._id.toString(), userInDb.role, userInDb.status),
        this.signRefreshToken(userInDb._id.toString(), userInDb.role, userInDb.status)
      ]);
      await db.refreshTokens.insertOne(
        new RefreshToken({
          token: refreshToken,
          created_at: new Date(),
          user_id: userInDb._id
        })
      );
      return {
        accessToken,
        refreshToken,
        newUser: false
      };
    } else {
      const randomPassword = nanoid(10);
      const { accessToken, refreshToken } = await this.register(
        {
          name: googleUserInfo.name,
          email: googleUserInfo.email,
          avatar: googleUserInfo.picture,
          password: randomPassword,
          role: UserRole.Undefined
        },
        false
      );
      return {
        accessToken,
        refreshToken,
        newUser: true
      };
    }
  }

  async register(payload: RegisterRequest, isNotOauth: boolean = true) {
    const saltRounds = 10;
    payload.password = await bcrypt.hashSync(payload.password, saltRounds);
    let user;
    if (payload.role === UserRole.Candidate) {
      user = await db.candidates.insertOne(
        new Candidate({
          name: payload.name,
          avatar: payload.avatar || ''
        })
      );
    } else if (payload.role === UserRole.Employer) {
      user = await db.employer.insertOne(
        new Employer({
          name: payload.name,
          avatar: payload.avatar || ''
        })
      );
    }

    const result = await db.accounts.insertOne(
      new Account({
        ...payload,
        status: isNotOauth ? UserVerifyStatus.Unverified : UserVerifyStatus.Verified,
        user_id: user?.insertedId || null,
        verify_email_token: '',
        forgot_email_token: ''
      })
    );
    const userId = result.insertedId.toString();
    const [accessToken, refreshToken, emailVerifyToken] = await Promise.all([
      this.signAccessToken(userId, payload.role, isNotOauth ? UserVerifyStatus.Unverified : UserVerifyStatus.Verified),
      this.signRefreshToken(userId, payload.role, isNotOauth ? UserVerifyStatus.Unverified : UserVerifyStatus.Verified),
      this.signEmailVerifyToken(userId)
    ]);
    const saveRefreshToken = await db.refreshTokens.insertOne(
      new RefreshToken({
        token: refreshToken,
        created_at: new Date(),
        user_id: result.insertedId
      })
    );

    const saveEmailVerifyToken = await db.accounts.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { verify_email_token: emailVerifyToken } }
    );
    // isNotOauth && sendVerifyEmail(payload.email, emailVerifyToken, SendEmail.VerifyEmail);
    return {
      accessToken,
      refreshToken
    };
  }

  async refreshToken(payload: RefreshTokenRequest) {
    const oldToken = await db.refreshTokens.deleteOne({ token: payload.refreshToken });
    const refreshTokenEXP = (payload.decodeRefreshToken.exp as number) - Math.floor(Date.now() / 1000);
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(
        payload.decodeRefreshToken.payload.userId,
        payload.decodeRefreshToken.payload.role,
        payload.decodeRefreshToken.payload.verify
      ),
      this.signRefreshToken(
        payload.decodeRefreshToken.payload.userId,
        payload.decodeRefreshToken.payload.role,
        payload.decodeRefreshToken.payload.verify,
        refreshTokenEXP
      )
    ]);

    const saveRefreshToken = await db.refreshTokens.insertOne(
      new RefreshToken({
        token: refreshToken,
        created_at: new Date(),
        user_id: new ObjectId(payload.decodeRefreshToken.payload.userId)
      })
    );

    return {
      accessToken,
      refreshToken
    };
  }

  async checkEmailExists(email: string) {
    const user = await db.accounts.findOne({ email });
    if (user) {
      return user;
    } else return false;
  }

  async checkUserIdExists(userId: string) {
    const user = await db.accounts.findOne({ _id: new ObjectId(userId) });
    if (user) {
      return user;
    } else return false;
  }

  async logout(payload: LogoutRequest) {
    const deleteRefresh = await db.refreshTokens.deleteOne({ token: payload.refreshToken });
    return;
  }

  async verifyEmail(payload: VerifyEmailRequest) {
    const userId = payload.decodeEmailVerifyToken.payload.userId;
    const user = await db.accounts.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      throw new ErrorWithStatus({
        status: 400,
        message: 'User not found'
      });
    } else {
      if (user.verify_email_token === '') {
        throw new ErrorWithStatus({
          status: 400,
          message: 'User is verified'
        });
      }
      if (user.verify_email_token !== payload.emailVerifyToken) {
        throw new ErrorWithStatus({
          status: 400,
          message: 'Email verify token is not match'
        });
      }
      await db.accounts.updateOne({ _id: new ObjectId(userId) }, [
        { $set: { status: UserVerifyStatus.Verified, emailVerifyToken: '', updated_at: '$$NOW' } }
      ]);
      return;
    }
  }

  async resendVerifyEmail(payload: ResendVerifyEmailRequest) {
    const userId = payload.decodeAuthorization.payload.userId;
    const user = await db.accounts.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw new ErrorWithStatus({
        status: httpStatus.NOT_FOUND,
        message: 'User not found'
      });
    }
    if (user.status === UserVerifyStatus.Verified) {
      throw new ErrorWithStatus({
        status: httpStatus.OK,
        message: 'Verified'
      });
    }

    const emailVerifyToken = await this.signEmailVerifyToken(userId);
    const save = await db.accounts.updateOne({ _id: new ObjectId(userId) }, [
      {
        $set: { emailVerifyToken, updated_at: '$$NOW' }
      }
    ]);
    await sendVerifyEmail(user.email, emailVerifyToken, SendEmail.VerifyEmail);
    return;
  }

  async forgotPassword(payload: ForgotPasswordRequest) {
    const user = await db.accounts.findOne({ email: payload.email });
    if (!user) {
      throw new ErrorWithStatus({
        status: httpStatus.NOT_FOUND,
        message: 'User not found'
      });
    }
    const forgotPasswordToken = await this.signForgotPasswordToken(user._id.toString());

    await db.accounts.updateOne(
      { _id: user._id },
      {
        $set: { forgotPasswordToken, updated_at: new Date() }
      }
    );

    await sendVerifyEmail(user.email, forgotPasswordToken, SendEmail.ForgotPassword);

    return {
      message: 'Email reset password sent'
    };
  }

  async resetPassword(payload: ResetPasswordRequest) {
    const saltRounds = 10;
    const password = await bcrypt.hashSync(payload.password, saltRounds);
    const save = await db.accounts.updateOne(
      { _id: payload.user._id },
      {
        $set: { password, forgotPasswordToken: '', updated_at: new Date() }
      }
    );
    return;
  }

  async changePassword(payload: ChangePasswordRequest) {
    const userId = payload.decodeAuthorization.payload.userId;
    const oldPassword = payload.oldPassword;
    const newPassword = payload.newPassword;

    const user = await db.accounts.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw new ErrorWithStatus({
        message: 'User not found',
        status: httpStatus.NOT_FOUND
      });
    }
    const checkPassword = await bcrypt.compareSync(oldPassword, user.password);
    if (!checkPassword) {
      throw new ErrorWithStatus({
        message: 'Password incorrect',
        status: httpStatus.UNAUTHORIZED
      });
    } else {
      const saltRounds = 10;
      const password = await bcrypt.hashSync(newPassword, saltRounds);
      await db.accounts.findOneAndUpdate(
        {
          _id: new ObjectId(userId)
        },
        {
          $set: {
            password
          }
        }
      );
      return;
    }
  }
}

const usersService = new UsersService();
export default usersService;
