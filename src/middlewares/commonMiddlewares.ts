import { Request, Response, NextFunction } from 'express';
import { pick } from 'lodash';
import { ObjectId } from 'mongodb';
import { UserRole } from '~/constants/enum';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import db from '~/services/databaseServices';

type FilterKeys<T> = Array<keyof T>;
export const filterMiddleware =
  <T>(filterKeys: FilterKeys<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys);
    next();
  };

export const isEmployerValidator = (req: Request, res: Response, next: NextFunction) => {
  const { role } = req.body.decodeAuthorization.payload;
  if (role !== UserRole.Employer) {
    return next(
      new ErrorWithStatus({
        message: 'Bạn không phải là nhà tuyển dụng',
        status: httpStatus.FORBIDDEN
      })
    );
  }
  next();
};

export const isAdminJobValidator = async (req: Request, res: Response, next: NextFunction) => {
  const { role } = req.body.decodeAuthorization.payload;
  const { id } = req.params;
  if (role !== UserRole.Employer) {
    return next(
      new ErrorWithStatus({
        message: 'Bạn không phải là nhà tuyển dụng',
        status: httpStatus.FORBIDDEN
      })
    );
  }
  const job = await db.jobs.findOne({ _id: new ObjectId(id) });
  if (!job) {
    return next(
      new ErrorWithStatus({
        message: 'Công việc không tồn tại',
        status: httpStatus.NOT_FOUND
      })
    );
  }
  if (job.employer_id.toString() !== req.body.decodeAuthorization.payload.userId.toString()) {
    return next(
      new ErrorWithStatus({
        message: 'Bạn không phải là nhà tuyển dụng của công việc này',
        status: httpStatus.FORBIDDEN
      })
    );
  }
  req.body.job = job;
  next();
};
