import { Request, Response } from "express";
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from "mongodb";
import { Package } from "~/models/schemas/Package";
import db from "~/services/databaseServices";
export const getListTransactionController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { name, createdAt } = req.query || req.params;
const rawName = String(name)?.replace(/^"|"$/g, ''); 
  const limit = Number(req.query.limit as string);
  const pageInput = Number(req.query.page as string);
  const idUser = req.body.decodeAuthorization.payload.userId;
  const role = req.body.decodeAuthorization.payload.role;

  let filter: any = {
    status: { $in: [true, false] }
  };

  // Xử lý lọc theo thời gian tạo
  let createdAtF ;
  if (typeof createdAt === 'string') {
      createdAtF = JSON.parse(createdAt); // parse từ chuỗi JSON thành mảng
  }
  
  if (Array.isArray(createdAtF) && createdAtF.length === 2) {
    const [from, to]:any = createdAtF;
    const createdAtFilter: any = {};
    if (from) createdAtFilter.$gte = new Date(String(from).replace(/^"|"$/g, ''));
    if (to) createdAtFilter.$lte = new Date(String(to).replace(/^"|"$/g, ''));
    filter.createdAt = createdAtFilter;
  }
  // Nếu là employer (role = 2), lọc theo employer_id
  if (role == 2) {
    const dataEm: any = await db.accounts.aggregate([
      { $match: { _id: new ObjectId(idUser) } },
      {
        $lookup: {
          from: 'Employers',
          localField: 'user_id',
          foreignField: '_id',
          as: 'employer_info'
        }
      },
      { $unwind: '$employer_info' }
    ]).toArray();

    if (dataEm[0]?.employer_info?._id) {
      filter.employer_id = new ObjectId(dataEm[0].employer_info._id);
    }
  }
  // Ghép pipeline
  const result = await db.transactions.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: 'Employers',
        localField: 'employer_id',
        foreignField: '_id',
        as: 'employer_info'
      }
    },
    { $unwind: '$employer_info' },
    {
      $lookup: {
        from: 'Packages',
        localField: 'package_id',
        foreignField: '_id',
        as: 'package_info'
      }
    },
    { $unwind: '$package_info' },
    // Nếu có name, mới áp dụng tìm kiếm
    ...(name ? [{
      $match: {
        'package_info.name': { $regex: String(rawName), $options: 'i' }
      }
    }] : [])
  ]).toArray();

  res.status(200).json({
    result,
    message: 'Get transaction success'
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
        new Package({name,price,count}));
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
      if (price) updateFields.price = price;
      if (count) updateFields.count = count;
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

  
export const getRevenueAndSuccessController = async (req: Request, res: Response) => {
    const idUser = req.body.decodeAuthorization.payload.userId;
    const role = req.body.decodeAuthorization.payload.role;

    let filter: any = { status: true }; // Chỉ lấy các giao dịch thành công

    // Nếu là employer (role = 2), lọc theo employer_id

    // Aggregate để tính tổng price và đếm số giao dịch thành công
    const result = await db.transactions
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'Packages',
            localField: 'package_id',
            foreignField: '_id',
            as: 'package_info',
          },
        },
        { $unwind: '$package_info' },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$package_info.price' }, // Tổng price từ package_info
            successfulTransactions: { $sum: 1 }, // Đếm số giao dịch
          },
        },
      ])
      .toArray();

    // Chuẩn hóa kết quả
    const totalRevenue = result[0]?.totalRevenue || 0;
    const successfulTransactions = result[0]?.successfulTransactions || 0;

    res.status(200).json({
      result: {
        totalRevenue,
        successfulTransactions,
      },
      message: 'Get revenue and successful transactions success',
    });
 
  }