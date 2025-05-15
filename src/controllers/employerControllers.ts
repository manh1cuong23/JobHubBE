import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';
import { UserRole } from '~/constants/enum';

import { VerifyEmployer } from '~/models/schemas/VerifySchema';
import db from '~/services/databaseServices';

export const verifyEmployerController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { business_document } = req.body;
  const employerId = new ObjectId(req.body.decodeAuthorization.payload.userId);

  const existingVerification = await db.verifyEmployers.findOne({ employer_id: employerId });

  if (!existingVerification) {
    await db.verifyEmployers.insertOne(
      new VerifyEmployer({
        employer_id: employerId,
        business_document,
        status: 'PENDING'
      })
    );
    return res.status(200).json({
      message: 'Gửi đơn xác thực thành công'
    });
  } else {
    if (existingVerification.status === 'REJECT' || existingVerification.status === 'PENDING') {
      await db.verifyEmployers.updateOne(
        { employer_id: employerId },
        { $set: { business_document, status: 'PENDING' } }
      );
      return res.status(200).json({
        message: 'Cập nhật đơn xác thực thành công'
      });
    } else if (existingVerification.status === 'APPROVE') {
      return res.status(400).json({
        message: 'Lỗi: Tài khoản này đã được xác thực'
      });
    }
  }

  return res.status(200).json({
    message: 'Đơn xác thực đang được xử lý'
  });
};

export const getListCandicateController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { page, limit, email, name, phone_number, status, fields, skills, user_id } = req.query;
  const userIdStr = user_id as string;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 10;
  const skipNum = (pageNum - 1) * limitNum;

  const matchConditions: any = {};

  if (email) {
    matchConditions.email = { $regex: email, $options: 'i' };
  }
  if (user_id) {
    matchConditions.user_id = new ObjectId(userIdStr);
  }
  matchConditions.role = 1;
  if (status) {
    matchConditions.status = parseInt(status as string);
  }
  // if (fields) {
  //   matchConditions.fields = { $in: (fields as string[]).map((field: string) => new ObjectId(field)) };
  // }
  // if (skills) {
  //   matchConditions.skills = { $in: (skills as string[]).map((skill: string) => new ObjectId(skill)) };
  // }

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
              : {},
              skills
              ? {
                  $or: [
                    { 'candidate_info.skills': { $in: (skills as string[]).map((skill: string) => new ObjectId(skill))} }
                  ]
                }
              : {},
              fields
              ? {
                  $or: [
                    { 'candidate_info.fields': { $in: (fields as string[]).map((skill: string) => new ObjectId(skill))} }
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
                    { 'candidate_info.name': { $regex: name, $options: 'i' } },
                    { 'candidate_info.feature_job_position': { $regex: name, $options: 'i' } }
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
              : {},
              skills
              ? {
                  $or: [
                    { 'candidate_info.skills': { $in: (skills as string[]).map((skill: string) => new ObjectId(skill))} }
                  ]
                }
              : {},
              fields
              ? {
                  $or: [
                    { 'candidate_info.fields': { $in: (fields as string[]).map((skill: string) => new ObjectId(skill))} }
                  ]
                }
              : {}
          ]
        }
      },
      {
        $project: {
          _id: 1,
          email: 1,
          candidate_info: 1,
          skills_info: 1,
          fields_info: 1
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

export const getListEvaluationController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { page, limit } = req.query;
  const userId = req.body.decodeAuthorization.payload.userId;
  const { id } = req.params;
  const employerId = new ObjectId(userId);

  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 10;
  const skipNum = (pageNum - 1) * limitNum;
  
    const totalRecords = await db.evaluations.countDocuments({ employer_id: employerId });
    const total_pages = Math.ceil(totalRecords / limitNum);
    const filter: any = {};
    const roleUser = req.body.decodeAuthorization.payload.role;
    
    if (Number(roleUser as string) === UserRole.Candidate) {
      filter.status = true; 
    }
    
    filter.employer_id = new ObjectId(id); // thêm employer_id vào filter
  const evaluations = await db.evaluations
    .aggregate([
      {
        $match: filter
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
          from: 'Candidates',
          localField: 'account_info.user_id',
          foreignField: '_id',
          as: 'candidate_info'
        }
      },
      {
        $unwind: '$candidate_info'
      },
      { $skip: skipNum },
      { $limit: limitNum }
    ])
    .toArray();

  // Tính thống kê rate và phần trăm isEncouragedToWorkHere
  const rateStats = await db.evaluations
    .aggregate([
      {
        $match: filter
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          rate1: { $sum: { $cond: [{ $eq: ['$rate', 1] }, 1, 0] } },
          rate2: { $sum: { $cond: [{ $eq: ['$rate', 2] }, 1, 0] } },
          rate3: { $sum: { $cond: [{ $eq: ['$rate', 3] }, 1, 0] } },
          rate4: { $sum: { $cond: [{ $eq: ['$rate', 4] }, 1, 0] } },
          rate5: { $sum: { $cond: [{ $eq: ['$rate', 5] }, 1, 0] } },
          encouragedCount: { $sum: { $cond: [{ $eq: ['$isEncouragedToWorkHere', true] }, 1, 0] } },
          avgRate: { $avg: '$rate' }
        }
      },
      {
        $project: {
          avgRate: { $round: ['$avgRate', 2] },
          rateCounts: {
            rate1: '$rate1',
            rate2: '$rate2',
            rate3: '$rate3',
            rate4: '$rate4',
            rate5: '$rate5'
          },
          rateDistribution: {
            rate1: { $multiply: [{ $divide: ['$rate1', '$total'] }, 100] },
            rate2: { $multiply: [{ $divide: ['$rate2', '$total'] }, 100] },
            rate3: { $multiply: [{ $divide: ['$rate3', '$total'] }, 100] },
            rate4: { $multiply: [{ $divide: ['$rate4', '$total'] }, 100] },
            rate5: { $multiply: [{ $divide: ['$rate5', '$total'] }, 100] }
          },
          encouragedPercentage: { $multiply: [{ $divide: ['$encouragedCount', '$total'] }, 100] }
        }
      }
    ])
    .toArray();

  const rateSummary = rateStats[0] || {
    avgRate: 0,
    rateCounts: { rate1: 0, rate2: 0, rate3: 0, rate4: 0, rate5: 0 },
    rateDistribution: { rate1: 0, rate2: 0, rate3: 0, rate4: 0, rate5: 0 },
    encouragedPercentage: 0
  };

  res.status(200).json({
    message: 'Lấy danh sách đánh giá thành công',
    result: evaluations,
    rateSummary: {
      averageRate: rateSummary.avgRate,
      rateCounts: {
        rate1: rateSummary.rateCounts.rate1,
        rate2: rateSummary.rateCounts.rate2,
        rate3: rateSummary.rateCounts.rate3,
        rate4: rateSummary.rateCounts.rate4,
        rate5: rateSummary.rateCounts.rate5
      },
      rateDistribution: {
        rate1: Number(rateSummary.rateDistribution.rate1.toFixed(2)),
        rate2: Number(rateSummary.rateDistribution.rate2.toFixed(2)),
        rate3: Number(rateSummary.rateDistribution.rate3.toFixed(2)),
        rate4: Number(rateSummary.rateDistribution.rate4.toFixed(2)),
        rate5: Number(rateSummary.rateDistribution.rate5.toFixed(2))
      },
      encouragedPercentage: Number(rateSummary.encouragedPercentage.toFixed(2))
    },
    pagination: {
      page: pageNum,
      limit: limitNum,
      total_pages,
      total_records: totalRecords
    }
  });
};

export const getListEmployer= async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { page, limit, email,name } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 10;
  const skipNum = (pageNum - 1) * limitNum;

  const matchConditions: any = {};

  if (email) {
    matchConditions.email = { $regex: email, $options: 'i' };
  }
  if (name) {
    matchConditions.name = { $regex: name, $options: 'i' };
  }
  

  const evaluations = await db.employer
    .aggregate([
      {
        $match: matchConditions
      },
      {
        $lookup: {
          from: 'Accounts',
          localField: '_id',
          foreignField: 'user_id',
          as: 'account_info'
        }
      },
      {
        $unwind: '$account_info'
      },
      {
        $lookup: {
          from: 'Fields',
          localField: 'fields',
          foreignField: '_id',
          as: 'fields_info'
        }
      },
      { $skip: skipNum },
      { $limit: limitNum }
    ])
    .toArray();

  // Tính thống kê rate và phần trăm isEncouragedToWorkHere
  res.status(200).json({
    message: 'Lấy danh sách nhà tuyển dụng thành công',
    result: evaluations,
  });
};
