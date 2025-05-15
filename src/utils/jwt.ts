import jwt, { SignOptions } from 'jsonwebtoken';
import { resolve } from 'path';
import { env } from '~/constants/config';

export const signToken = (payload: any, jwtOptions?: SignOptions) => {
  return new Promise<string>((resolve, reject) => {
    const privateKey = env.JWTSecretKey as string;
    const options = jwtOptions ? jwtOptions : ({ algorithm: 'HS256' } as SignOptions);
    jwt.sign(payload, privateKey, options, (err, token) => {
      if (err) {
        reject(err);
      } else {
        resolve(token as string);
      }
    });
  });
};

export const verifyToken = (token: string) => {
  return new Promise<jwt.JwtPayload>((resolve, reject) => {
    const privateKey = env.JWTSecretKey as string;
    jwt.verify(token, privateKey, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded as jwt.JwtPayload);
      }
    });
  });
};
