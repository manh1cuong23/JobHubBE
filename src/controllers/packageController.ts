import { Request, Response } from "express";
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from "mongodb";
import { Package } from "~/models/schemas/Package";
import db from "~/services/databaseServices";
export const getPackageController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
    const limit = Number(req.query.limit as string);
    const pageInput = Number(req.query.page as string);
    const result = await db.packages.find({}).toArray();
    res.status(200).json({
      result,
      message: 'Get package suscess'
    });
  };
  export const getDetailController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
    const limit = Number(req.query.limit as string);
    const pageInput = Number(req.query.page as string);
    const {id} = req.params || req.query
    const result = await db.packages.findOne({_id:new ObjectId(id)});
    res.status(200).json({
      result,
      message: 'Get package suscess'
    });
  };
  export const createPackageController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
    const {name,price,count,} = req.body
    const result = await db.packages.insertOne(
        new Package({name,price:Number(price),count:Number(count)}));
    res.status(200).json({
      result,
      message: 'create package suscess'
    });
  };

  export const updatePackageController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
    try {
      const { id } = req.params || req.query;
      const { name, price, count, status } = req.body;
  
      // Kiểm tra nếu tất cả các trường có trong req.body
      if (!name && !price && !count && !status) {
        return res.status(400).json({ message: 'Không có dữ liệu nào để cập nhật' });
      }
  
      // Tạo đối tượng chứa các trường cần cập nhật
      const updateFields: any = {};
  
      if (name) updateFields.name = name;
      if (price) updateFields.price = Number(price);
      if (count) updateFields.count = Number(count);
      if (status) updateFields.status = status;
  
      // Tiến hành cập nhật
      const result = await db.packages.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateFields }
      );
  
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Package không tồn tại' });
      }
  
      res.status(200).json({
        result,
        message: 'Cập nhật package thành công',
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật package:', error);
      res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật package' });
    }
  };
  export const deletePackageController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
    const {id} = req.params || req.query
    const {name,price,count,} = req.body
    const result = await db.packages.deleteOne({_id:new ObjectId(id)})
    res.status(200).json({
      result,
      message: 'delete package suscess'
    });
  };