import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';
import { provinces } from '~/constants/const';
import db from '~/services/databaseServices';
export const getCitiesController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const cityVietNam = provinces;
  res.status(200).json({
    result: cityVietNam,
    message: 'Lấy danh sách tỉnh thành thành công'
  });
};

export const getFieldsController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const fields = await db.fields.find({}).toArray();
  res.status(200).json({
    result: fields,
    message: 'Lấy danh sách lĩnh vực thành công'
  });
};

export const getSkillsController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const fieldId = req.params.fieldId;
  let skills = [];
  if (!fieldId) {
    skills = await db.skills.find({}).toArray();
  } else {
    skills = await db.skills.find({ field_id: new ObjectId(fieldId) }).toArray();
  }
  res.status(200).json({
    result: skills,
    message: 'Lấy danh sách kỹ năng thành công'
  });
};
