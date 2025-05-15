import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { pick } from 'lodash';
import { ObjectId } from 'mongodb';
import { env } from '~/constants/config';
import { UserRole } from '~/constants/enum';
import bcrypt from 'bcrypt';
import {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ResendVerifyEmailRequest,
  ResetPasswordRequest,
  VerifyEmailRequest
} from '~/models/requests/UserRequests';
import { Field } from '~/models/schemas/FieldSchema';
import { Skill } from '~/models/schemas/SkillSchema';
import db from '~/services/databaseServices';
import userService from '~/services/usersServices';
import { ErrorWithStatus } from '~/models/Errors';
import { httpStatus } from '~/constants/httpStatus';

export const loginController = async (req: Request<ParamsDictionary, any, LoginRequest>, res: Response) => {
  const result = await userService.login(req.body);
  res.status(200).json({
    result,
    message: 'Login suscess'
  });
};

export const loginGoogleController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { code } = req.query;
  const result = await userService.loginGoogle(code as string);
  const urlRedirect = `${env.clientRedirectCallback}?access_token=${result.accessToken}&refresh_token=${result.refreshToken}&newUser=${result.newUser}`;
  res.redirect(urlRedirect);
};

export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequest>, res: Response) => {
  const result = await userService.register(req.body);
  res.status(200).json({
    result,
    message: 'Register suscess'
  });
};

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutRequest>, res: Response) => {
  const result = await userService.logout(req.body);
  res.status(200).json({
    message: 'Logout suscess'
  });
};

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenRequest>,
  res: Response
) => {
  const result = await userService.refreshToken(req.body);
  res.status(200).json({
    result,
    message: 'refresh Token suscess'
  });
};

export const verifyEmailController = async (req: Request<ParamsDictionary, any, VerifyEmailRequest>, res: Response) => {
  const result = await userService.verifyEmail(req.body);
  res.status(200).json({
    result,
    message: 'Verify email suscess'
  });
};

export const resendVerifyEmailController = async (
  req: Request<ParamsDictionary, any, ResendVerifyEmailRequest>,
  res: Response
) => {
  const result = await userService.resendVerifyEmail(req.body);
  res.status(200).json({
    result,
    message: 'Resend verify email suscess'
  });
};

export const getMeController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  let result;
  if (req.body.decodeAuthorization.payload.role === UserRole.Candidate) {
    result = await db.accounts
      .aggregate([
        {
          $match: {
            _id: new ObjectId(req.body.decodeAuthorization.payload.userId)
          }
        },
        {
          $lookup: {
            from: 'Candidates',
            localField: 'user_id',
            foreignField: '_id',
            as: 'candidate_info'
          }
        },
        {
          $unwind: '$candidate_info'
        },
        {
          $lookup: {
            from: 'Skills',
            localField: 'candidate_info.skills',
            foreignField: '_id',
            as: 'skills_info'
          }
        },
        {
          $lookup: {
            from: 'Fields',
            localField: 'candidate_info.fields',
            foreignField: '_id',
            as: 'fields_info'
          }
        }
      ])
      .toArray();
  } else if(req.body.decodeAuthorization.payload.role === UserRole.Employer) {
    result = await db.accounts
      .aggregate([
        {
          $match: {
            _id: new ObjectId(req.body.decodeAuthorization.payload.userId)
          }
        },
        {
          $lookup: {
            from: 'Employers',
            localField: 'user_id',
            foreignField: '_id',
            as: 'employer_info'
          }
        },
        {
          $unwind: '$employer_info'
        },
        {
          $lookup: {
            from: 'Skills',
            localField: 'employer_info.skills',
            foreignField: '_id',
            as: 'skills_info'
          }
        },
        {
          $lookup: {
            from: 'Fields',
            localField: 'employer_info.fields',
            foreignField: '_id',
            as: 'fields_info'
          }
        }
      ])
      .toArray();
  }else{
    result = await db.accounts
      .aggregate([
        {
          $match: {
            _id: new ObjectId(req.body.decodeAuthorization.payload.userId)
          }
        },
      ])
      .toArray();
  }
  res.status(200).json({
    result: result[0],
    message: 'Get me suscess'
  });
};

export const updateMeController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const userId = new ObjectId(req.body.decodeAuthorization.payload.userId);
  const { candidate_body, employer_body } = req.body;
  if(candidate_body?.avatar || employer_body?.avatar){
    await db.accounts.findOneAndUpdate({_id:userId},{$set:{avatar:candidate_body?.avatar || employer_body?.avatar}})
  }
  const account = await db.accounts.findOne({ _id: userId });
  if (!account) {
    throw new Error('Account not found');
  }
  let fieldsFinds: any;
  let skillsFinds;
  if (candidate_body?.fields) {
    fieldsFinds = await Promise.all(
      candidate_body.fields.map(async (field: string) => {
        const fieldFind = await db.fields.findOne({ name: field });
        if (!fieldFind) {
          const init = await db.fields.insertOne(new Field({ name: field }));
          return new ObjectId(init.insertedId);
        } else {
          return fieldFind._id;
        }
      })
    );
  }
  if (candidate_body?.skills) {
    skillsFinds = await Promise.all(
      candidate_body?.skills.map(async (skill: string) => {
        const techFind = await db.skills.findOne({ name: skill });
        if (!techFind) {
          fieldsFinds.map(async (fieldId: ObjectId) => {
            const init = await db.skills.insertOne(new Skill({ name: skill, field_id: fieldId }));
            return new ObjectId(init.insertedId);
          });
        } else {
          return new ObjectId(techFind._id);
        }
      })
    );
  }
  if (employer_body?.fields) {
    fieldsFinds = await Promise.all(
      employer_body.fields.map(async (field: string) => {
        const fieldFind = await db.fields.findOne({ name: field });
        if (!fieldFind) {
          const init = await db.fields.insertOne(new Field({ name: field }));
          return new ObjectId(init.insertedId);
        } else {
          return fieldFind._id;
        }
      })
    );
  }
  if (employer_body?.skills) {
    skillsFinds = await Promise.all(
      employer_body?.skills.map(async (skill: string) => {
        const techFind = await db.skills.findOne({ name: skill });
        if (!techFind) {
          fieldsFinds.map(async (fieldId: ObjectId) => {
            const init = await db.skills.insertOne(new Skill({ name: skill, field_id: fieldId }));
            return new ObjectId(init.insertedId);
          });
        } else {
          return new ObjectId(techFind._id);
        }
      })
    );
  }
  if (account.role === UserRole.Candidate && account.user_id) {
    await db.candidates.updateOne(
      { _id: account.user_id },
      {
        $set: {
          name: candidate_body.name,
          address: candidate_body.address,
          avatar: candidate_body.avatar,
          cover_photo: candidate_body.cover_photo,
          current_job_position: candidate_body.current_job_position,
          cv: candidate_body.cv,
          date_of_birth: new Date(candidate_body.date_of_birth),
          description: candidate_body.description,
          education: candidate_body.education,
          experience_years: candidate_body.experience_years,
          fields: fieldsFinds,
          gender: candidate_body.gender,
          language_level: candidate_body.language_level,
          level: candidate_body.level,
          phone_number: candidate_body.phone_number,
          salary_expected: candidate_body.salary_expected,
          skills: skillsFinds,
          feature_job_position: candidate_body.feature_job_position
        }
      }
    );
  }
  if (account.role === UserRole.Employer && account.user_id) {
    await db.employer.updateOne(
      { _id: account.user_id },
      {
        $set: {
          address: employer_body?.address,
          avatar: employer_body?.avatar,
          cover_photo: employer_body?.cover_photo,
          description: employer_body?.description,
          employer_size: employer_body?.employer_size,
          fields: fieldsFinds,
          name: employer_body?.name,
          phone_number: employer_body?.phone_number,
          skills:skillsFinds,
          isOt:employer_body?.isOt,
          date_working:employer_body?.date_working,
          time_working:employer_body?.time_working,
          city:employer_body?.city,
          images:employer_body?.images
        }
      }
    );
  }

  res.status(200).json({
    message: 'Update me suscess'
  });
};

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordRequest>,
  res: Response
) => {
  const result = await userService.forgotPassword(req.body);
  res.status(200).json({
    result,
    message: 'Forgot password sucess'
  });
};

export const verifyForgotPasswordController = async (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Verify forgot password success'
  });
};

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordRequest>,
  res: Response
) => {
  try {
    const result = await userService.resetPassword(req.body);
    return res.status(200).json({
      result,
      message: 'Reset password success'
    });
  } catch (error: any) {
    return res.status(error.status || 500).json({
      message: error.message || 'An error occurred while resetting password'
    });
  }
};

export const getProfileController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { _id, name, email, date_of_birth, avatar } = req.body.user;
  res.status(200).json({
    result: { _id, name, email, date_of_birth, avatar },
    message: 'Get profile sucess'
  });
};

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordRequest>,
  res: Response
) => {
  const result = await userService.changePassword(req.body);
  res.status(200).json({
    result,
    message: 'Change Password sucess'
  });
};


export const updateAccountController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const userId = new ObjectId(req.body.decodeAuthorization.payload.userId);
  const {username,avatar} = req.body;

  const account = await db.accounts.findOne({ _id: userId });
  if (!account) {
    throw new Error('Account not found');
  }
  await db.accounts.updateOne({_id:userId},{
    $set:{
      username
    }
  })

  res.status(200).json({
    message: 'Update account suscess'
  });
};
