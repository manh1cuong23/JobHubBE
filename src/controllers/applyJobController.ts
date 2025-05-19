import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';
import conversationsService from '~/services/conversationsServices';
import db from '~/services/databaseServices';
import { Job } from '~/models/schemas/JobSchema';
import { Field } from '~/models/schemas/FieldSchema';
import { Skill } from '~/models/schemas/SkillSchema';
import { provinces } from '~/constants/const';
import { ApplyStatus, JobStatus, UserRole } from '~/constants/enum';
import { ErrorWithStatus } from '~/models/Errors';
import { httpStatus } from '~/constants/httpStatus';
import { Apply } from '~/models/schemas/ApplySchema';
import { CVType } from '~/models/schemas/CandidateSchema';


export const getinforAppyController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
    const { id } = req.params;
    const job = await db.apply
      .aggregate([
        {
          $match: {
            _id: new ObjectId(id)
          }
        },
      ])
      .toArray();
  
    if (!job[0]) {
      return res.status(404).json({
        message: 'Công việc không tồn tại'
      });
    }
    const cityInfo = provinces.find((city: any) => city._id === job[0].city);
    res.status(200).json({
      result: { ...job[0], city_info: cityInfo },
      message: 'Lấy công việc thành công'
    });
};


export const getinforCandicateAppy = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
    const { id,user_id } = req.params;
    const job = await db.apply
      .aggregate([
        {
          $match: {
            _id: new ObjectId(id)
          }
        },
         {
          $lookup: {
            from: 'Accounts',
            localField: 'candidate_id',
            foreignField: '_id',
            as: 'candicate_account'
          }
        },
        {
          $unwind: '$candicate_account'
        },
         {
          $lookup: {
            from: 'Candidates',
            localField: 'candicate_account.user_id',
            foreignField: '_id',
            as: 'candidates_info'
          }
        },
        {
          $unwind: '$candidates_info'
        },
        {
       $and: [
        user_id
          ? { 'candidates_info._id': new ObjectId(user_id) }
          : {}
      ]
      },
      ])
      .toArray();
  
    if (!job[0]) {
      return res.status(404).json({
        message: 'Công việc không tồn tại'
      });
    }
    const cityInfo = provinces.find((city: any) => city._id === job[0].city);
    res.status(200).json({
      result: { ...job[0], city_info: cityInfo },
      message: 'Lấy công việc thành công'
    });
};
