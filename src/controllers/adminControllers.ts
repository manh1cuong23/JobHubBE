import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';
import db from '~/services/databaseServices';

export const getListAccountController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { page, limit, email,key,name, phone_number, status,active, role } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 10;
  const skipNum = (pageNum - 1) * limitNum;

  const matchConditions: any = {};

  if (key) {
    matchConditions.email = { $regex: key, $options: 'i' };
    
  }
  if (email) {
    matchConditions.email = { $regex: email, $options: 'i' };
  }
  if (role) {
    matchConditions.role = parseInt(role as string);
  }
  if (  
    status !== undefined &&
    status !== null)  {
    matchConditions.status = parseInt(status as string);
  }
  if (  
    active !== undefined &&   
    active !== null) {
    matchConditions.active = active == '1' ? true : false;
  }

  const totalRecords = await db.accounts
    .aggregate([
      {
        $match: matchConditions
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
        $lookup: {
          from: 'Candidates',
          localField: 'user_id',
          foreignField: '_id',
          as: 'candidate_info'
        }
      },
      {
        $unwind: {
          path: '$employer_info',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$candidate_info',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          $and: [
            name
              ? {
                  $or: [
                    { 'employer_info.name': { $regex: name, $options: 'i' } },
                    { 'candidate_info.name': { $regex: name, $options: 'i' } }
                  ]
                }
              : {},
            phone_number
              ? {
                  $or: [
                    { 'employer_info.phone_number': { $regex: phone_number } },
                    { 'candidate_info.phone_number': { $regex: phone_number } }
                  ]
                }
              : {}
          ]
        }
      },
      {
        $count: 'total'
      }
    ])
    .toArray();
  const total_records = totalRecords.length > 0 ? totalRecords[0].total : 0;
  const total_pages = Math.ceil(total_records / limitNum);
  const accounts = await db.accounts
    .aggregate([
      {
        $match: matchConditions
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
        $lookup: {
          from: 'Candidates',
          localField: 'user_id',
          foreignField: '_id',
          as: 'candidate_info'
        }
      },
      {
        $unwind: {
          path: '$employer_info',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$candidate_info',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          $and: [
            name
              ? {
                  $or: [
                    { 'employer_info.name': { $regex: name, $options: 'i' } },
                    { 'candidate_info.name': { $regex: name, $options: 'i' } }
                  ]
                }
              : {},
            phone_number
              ? {
                  $or: [
                    { 'employer_info.phone_number': { $regex: phone_number } },
                    { 'candidate_info.phone_number': { $regex: phone_number } }
                  ]
                }
              : {}
          ]
        }
      },
      { $skip: skipNum },
      { $limit: limitNum }
    ])
    .toArray();

  res.status(200).json({
    result: accounts,
    message: 'Lấy danh sách tài khoản thành công',
    pagination: {
      page: pageNum,
      limit: limitNum,
      total_pages,
      total_records
    }
  });
};


export const makeActiveAccount = async (req: Request<ParamsDictionary, any, any>, res: Response)=>{
  const {id} = req?.params;
  const idObject = new ObjectId(id)
  const account = await db.accounts.findOne({ _id:  idObject});
  if (!account) {
    throw new Error('Account not found');
  }
  await db.accounts.updateOne({ _id: idObject }, { $set: { active: true } });
  res.status(200).json({
    message: 'active account suscess'
  });
}

export const makeInActiveAccount = async (req: Request<ParamsDictionary, any, any>, res: Response)=>{
  const {id} = req?.params;
  const idObject = new ObjectId(id)
  const account = await db.accounts.findOne({ _id:  idObject});
  if (!account) {
    throw new Error('Account not found');
  }
  await db.accounts.updateOne({ _id: idObject }, { $set: { active: false } });
  res.status(200).json({
    message: 'inactive account suscess'
  });
}


export const makeActiveJob = async (req: Request<ParamsDictionary, any, any>, res: Response)=>{
  const {id} = req?.params;
  const idObject = new ObjectId(id)
  const account = await db.jobs.findOne({ _id:  idObject});
  if (!account) {
    throw new Error('Account not found');
  }
  await db.jobs.updateOne({_id:idObject}, { $set: { active: true } })
  res.status(200).json({
    message: 'active job suscess'
  });
}

export const makeInActivejob = async (req: Request<ParamsDictionary, any, any>, res: Response)=>{
  const {id} = req?.params;
  const idObject = new ObjectId(id)
  const job = await db.jobs.findOne({ _id:  idObject});
  if (!job) {
    throw new Error('job not found');
  }
  await db.jobs.updateOne({_id:idObject}, { $set: { active: false } })
  res.status(200).json({
    message: 'inactive job suscess'
  });
}


export const getListEvaluationAdminController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { page, limit,nameEmployer,nameCandicate } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 10;
  const skipNum = (pageNum - 1) * limitNum;

  const totalRecords = await db.evaluations.countDocuments();
  const total_pages = Math.ceil(totalRecords / limitNum);

  const evaluations = await db.evaluations
    .aggregate([
      {
        $match: { status: false } // Lọc các evaluations có status = false
      },
      {
        $lookup: {
          from: 'Accounts',
          localField: 'candidate_id',
          foreignField: '_id',
          as: 'account_info'
        }
      },
      {
        $unwind: '$account_info'
      },
      {
        $lookup: {
          from: 'Employers',
          localField: 'employer_id',
          foreignField: '_id',
          as: 'employer_info'
        }
      },
      {
        $unwind: '$employer_info'
      },
      ...(nameEmployer
        ? [
            {
              $match: {
                'employer_info.name': {
                  $regex: nameEmployer as string,
                  $options: 'i' // Không phân biệt hoa thường
                }
              }
            }
          ]
        : []),
      {
        $lookup: {
          from: 'Candidates',
          localField: 'account_info.user_id',
          foreignField: '_id',
          as: 'candidate_info'
        }
      },
      {
        $unwind: '$candidate_info'
      },
      ...(nameCandicate
        ? [
            {
              $match: {
                'candidate_info.name': {
                  $regex: nameCandicate as string,
                  $options: 'i' // Không phân biệt hoa thường
                }
              }
            }
          ]
        : []),
      { $skip: skipNum },
      { $limit: limitNum }
    ])
    .toArray();

  // Tính thống kê rate và phần trăm isEncouragedToWorkHere
 
 

  res.status(200).json({
    message: 'Lấy danh sách đánh giá thành công',
    result: evaluations,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total_pages,
      total_records: totalRecords
    }
  });
};

export const makeActiveEnvalution = async (req: Request<ParamsDictionary, any, any>, res: Response)=>{
  const {id} = req?.params;
  const idObject = new ObjectId(id)
  const job = await db.evaluations.findOne({ _id:  idObject});
  if (!job) {
    throw new Error('Envalution not found');
  }
  await db.evaluations.updateOne({_id:idObject}, { $set: { status: true } })
  res.status(200).json({
    message: 'inactive job suscess'
  });
}
