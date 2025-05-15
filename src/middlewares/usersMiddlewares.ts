import { Request, Response, NextFunction } from 'express';
import { body, checkSchema } from 'express-validator';
import { request } from 'http';
import { JwtPayload } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { TokenType, UserRole, UserVerifyStatus } from '~/constants/enum';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import db from '~/services/databaseServices';
import usersService from '~/services/usersServices';
import { accessTokenValidate } from '~/utils/common';
import { verifyToken } from '~/utils/jwt';
import { validate } from '~/utils/validation';

export const accessTokenValidator = validate(
  checkSchema(
    {
      authorization: {
        notEmpty: {
          errorMessage: 'authorization is required'
        },
        custom: {
          options: async (value: string, { req }) => {
            const accessToken = value.split(' ')[1];
            await accessTokenValidate(accessToken, req as Request);
            return true;
          }
        }
      }
    },
    ['headers']
  )
);

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refreshToken: {
        notEmpty: {
          errorMessage: 'refreshToken is required'
        },
        custom: {
          options: async (value: string, { req }) => {
            const refreshToken = req.body.refreshToken;
            try {
              const [decodeRefreshToken, checkInDB] = await Promise.all([
                verifyToken(refreshToken),
                db.refreshTokens.findOne({ token: refreshToken })
              ]);
              if (!checkInDB) {
                throw new ErrorWithStatus({
                  message: 'Refresh token is not exist',
                  status: httpStatus.UNAUTHORIZED
                });
              }
              req.body.decodeRefreshToken = decodeRefreshToken;
              if (decodeRefreshToken.payload.type !== TokenType.RefreshToken) {
                throw new ErrorWithStatus({
                  message: 'Type of token is not valid',
                  status: 401
                });
              }
            } catch (e: any) {
              throw new ErrorWithStatus({
                message: e.message,
                status: httpStatus.UNAUTHORIZED
              });
            }
            return true;
          }
        }
      }
    },
    ['body']
  )
);

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: {
          errorMessage: 'This is not a valid email'
        },
        trim: true,
        notEmpty: {
          errorMessage: 'Missing required email'
        }
      },
      password: {
        trim: true,
        notEmpty: {
          errorMessage: 'Missing required password'
        }
      }
    },
    ['body']
  )
);

export const registerValidator = validate(
  checkSchema(
    {
      name: {
        isLength: {
          options: { min: 1, max: 100 },
          errorMessage: 'Length of name must be between 1 and 100'
        },
        isString: true,
        notEmpty: {
          errorMessage: 'Missing required name'
        },
        trim: true
      },
      email: {
        notEmpty: {
          errorMessage: 'Missing required email'
        },
        isEmail: {
          errorMessage: 'This is not a valid email'
        },
        trim: true,
        custom: {
          options: async (value: string) => {
            const result = await usersService.checkEmailExists(value);
            if (result) {
              throw new Error('Email already exists');
            }
            return true;
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: 'Missing required password'
        },
        trim: true,
        isLength: {
          options: { min: 6, max: 50 },
          errorMessage: 'Length of password must be from 6 to 50'
        }
      },
      confirmPassword: {
        notEmpty: {
          errorMessage: 'Missing required confirm password'
        },
        trim: true,
        isLength: {
          options: { min: 6, max: 50 },
          errorMessage: 'Length of confirm password must be from 6 to 50'
        },
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error('Passwords do not match');
            }
            return true;
          }
        }
      }
    },
    ['body']
  )
);

export const verifyEmailValidator = validate(
  checkSchema({
    emailVerifyToken: {
      custom: {
        options: async (value: string, { req }) => {
          const emailVerifyToken = req.body.emailVerifyToken;
          if (!emailVerifyToken) {
            throw new ErrorWithStatus({
              message: 'Email verify token is required',
              status: 401
            });
          }

          const decodeEmailVerifyToken = await verifyToken(emailVerifyToken);
          req.body.decodeEmailVerifyToken = decodeEmailVerifyToken;
          if (decodeEmailVerifyToken.payload.type !== TokenType.VerifyEmailToken) {
            throw new ErrorWithStatus({
              message: 'Type of token is not valid',
              status: 401
            });
          }

          return true;
        }
      }
    }
  })
);

export const forgotPasswordValidator = validate(
  checkSchema({
    email: {
      isEmail: { errorMessage: 'Must be a valid email' },
      trim: true,
      notEmpty: { errorMessage: 'Missing required email' },
      custom: {
        options: async (value, { req }) => {
          const user = await usersService.checkEmailExists(value);
          if (!user) {
            throw new ErrorWithStatus({
              status: httpStatus.NOT_FOUND,
              message: 'User not found'
            });
          }
          req.body.user = user;
          return true;
        }
      }
    }
  })
);

export const verifyForgotPasswordValidator = validate(
  checkSchema(
    {
      forgotPasswordToken: {
        notEmpty: {
          errorMessage: 'forgotPasswordToken is required'
        },
        custom: {
          options: async (value: string, { req }) => {
            const forgotPasswordToken = req.body.forgotPasswordToken;
            const decodeForgotPasswordToken = await verifyToken(forgotPasswordToken);
            if (decodeForgotPasswordToken.payload.type !== TokenType.FogotPasswordToken) {
              throw new ErrorWithStatus({
                message: 'Type of token is not valid',
                status: 401
              });
            }

            const user = await db.accounts.findOne({ _id: new ObjectId(decodeForgotPasswordToken.payload.userId) });
            if (!user) {
              throw new ErrorWithStatus({
                status: httpStatus.UNAUTHORIZED,
                message: 'User not found'
              });
            }
            if (value !== user.forgot_email_token) {
              throw new ErrorWithStatus({
                status: httpStatus.UNAUTHORIZED,
                message: 'forgotPasswordToken do not match'
              });
            }
            req.body.user = user;
            return true;
          }
        }
      }
    },
    ['body']
  )
);

export const resetPasswordValidator = validate(
  checkSchema({
    password: {
      notEmpty: {
        errorMessage: 'Missing required password'
      },
      trim: true,
      isLength: {
        options: { min: 6, max: 50 },
        errorMessage: 'Length of password must be from 6 to 50'
      }
    },
    confirmPassword: {
      notEmpty: {
        errorMessage: 'Missing required confirm password'
      },
      trim: true,
      isLength: {
        options: { min: 6, max: 50 },
        errorMessage: 'Length of confirm password must be from 6 to 50'
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('Passwords do not match');
          }
          return true;
        }
      }
    }
  })
);

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.body.decodeAuthorization.payload;
  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorWithStatus({
        message: 'User not Verified',
        status: httpStatus.FORBIDDEN
      })
    );
  }
  next();
};

export const isAdminValidator = (req: Request, res: Response, next: NextFunction) => {
  const { role } = req.body.decodeAuthorization.payload;
  if (role !== UserRole.Admin) {
    return next(
      new ErrorWithStatus({
        message: 'User is not admin',
        status: httpStatus.FORBIDDEN
      })
    );
  }
  next();
};

export const updateMeValidator = validate(
  checkSchema({
    name: {
      optional: true,
      isLength: {
        options: { min: 1, max: 100 },
        errorMessage: 'Length of name must be between 1 and 100'
      },
      isString: true,
      notEmpty: {
        errorMessage: 'Missing required name'
      },
      trim: true
    },
    date_of_birth: {
      optional: true,
      isISO8601: { options: { strict: true, strictSeparator: true } }
    },

    avatar: {
      optional: true,
      isURL: { errorMessage: 'Avatar must be a URL' },
      trim: true
    }
  })
);

export const getProfileValidator = validate(
  checkSchema({
    id: {
      isString: { errorMessage: 'Id must be a string' },
      custom: {
        options: async (value: string, { req }) => {
          if (!ObjectId.isValid(value)) {
            throw new ErrorWithStatus({
              message: 'Invalid id',
              status: httpStatus.BAD_REQUEST
            });
          }
          const user = await db.accounts.findOne({ _id: new ObjectId(value) });
          req.body.user = user;
          return true;
        }
      }
    }
  })
);

export const changePasswordValidator = validate(
  checkSchema({
    oldPassword: {
      notEmpty: {
        errorMessage: 'Missing required password'
      },
      trim: true
    },
    newPassword: {
      notEmpty: {
        errorMessage: 'Missing required new password'
      },
      trim: true,
      isLength: {
        options: { min: 6, max: 50 },
        errorMessage: 'Length of password must be from 6 to 50'
      }
    },
    confirmPassword: {
      notEmpty: {
        errorMessage: 'Missing required confirm password'
      },
      trim: true,
      isLength: {
        options: { min: 6, max: 50 },
        errorMessage: 'Length of confirm password must be from 6 to 50'
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.newPassword) {
            throw new Error('Passwords do not match');
          }
          return true;
        }
      }
    }
  })
);

export const setUserCirclesValidator = validate(
  checkSchema({
    userIds: {
      isArray: {
        errorMessage: 'userIds must be an array'
      },
      custom: {
        options: async (value: string[], { req }) => {
          await Promise.all(
            value.map(async (userId: string) => {
              if (!ObjectId.isValid(userId)) {
                throw new ErrorWithStatus({
                  status: httpStatus.UNPROCESSABLE_ENTITY,
                  message: 'User id is not valid'
                });
              }
              const user = await usersService.checkUserIdExists(userId);
              if (!user) {
                throw new ErrorWithStatus({
                  status: httpStatus.NOT_FOUND,
                  message: 'Some users not found'
                });
              }
            })
          );
          return true;
        }
      }
    }
  })
);

export const isLoginValidator = (middleware: (req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      return middleware(req, res, next);
    }
    next();
  };
};

export const getConversationsValidator = validate(
  checkSchema({
    receiverUserId: {
      notEmpty: {
        errorMessage: 'receiverUserId must not be empty'
      },
      custom: {
        options: async (value, { req }) => {
          if (!ObjectId.isValid(value)) {
            throw new Error('receiverUserId is not valid');
          }
          const user = await usersService.checkUserIdExists(value);
          if (!user) {
            throw new ErrorWithStatus({
              status: httpStatus.NOT_FOUND,
              message: 'User not found'
            });
          }
          return true;
        }
      }
    },
    limit: {
      isNumeric: { errorMessage: 'Limit is a number' },
      custom: {
        options: (value: number) => {
          const num = Number(value);
          if (num > 50 || num < 1) {
            throw new Error('Limit must be between 1 and 50');
          }
          return true;
        }
      }
    },
    page: {
      isNumeric: { errorMessage: 'Page must is a number' },
      custom: {
        options: (value: number) => {
          const num = Number(value);
          if (num < 1) {
            throw new Error('Page cannot be less than 1');
          }
          return true;
        }
      }
    }
  })
);
