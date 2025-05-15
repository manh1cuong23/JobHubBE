import { Request, Response, NextFunction } from 'express';
import { omit } from 'lodash';
import { httpStatus } from '~/constants/httpStatus';

export const defaultsErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err);
  res.status(err.status || httpStatus.INTERNAL_SERVER_ERROR).json(omit(err, 'status'));
};
