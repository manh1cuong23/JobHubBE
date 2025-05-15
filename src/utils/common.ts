import { ObjectId } from 'mongodb';
import { Request } from 'express';
import { ErrorWithStatus } from '~/models/Errors';
import { TokenType } from '~/constants/enum';
import { verifyToken } from './jwt';

export const numberEnumtoArray = (enumObject: { [key: string]: string | number }) => {
  return Object.values(enumObject).filter((value) => typeof value === 'number') as number[];
};

export const stringArrayToObjectIdArray = (stringArray: string[]) => {
  return stringArray.map((id) => {
    return new ObjectId(id);
  });
};

export const accessTokenValidate = async (accessToken: string, req?: Request) => {
  if (accessToken === '') {
    throw new ErrorWithStatus({
      message: 'Access token is required',
      status: 401
    });
  } else {
    const decodeAuthorization = await verifyToken(accessToken);

    if (decodeAuthorization.payload.type !== TokenType.AccessToken) {
      throw new ErrorWithStatus({
        message: 'Type of token is not valid',
        status: 401
      });
    }
    if (req) {
      req.body.decodeAuthorization = decodeAuthorization;
    }

    return decodeAuthorization;
  }
};
