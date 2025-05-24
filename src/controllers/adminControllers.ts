import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';
import { ICreateUpdateBlog } from '~/models/requests/BlogRequests';
import { Blog } from '~/models/schemas/BlogSchema';
import db from '~/services/databaseServices';

export const getListAccountController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { page, limit, email, key, name, phone_number, status, active, role } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 1000;
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
    status !== null) {
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


export const makeActiveAccount = async (req: Request, res: Response) => {
  const { id } = req?.params;
  const idObject = new ObjectId(id)
  const account = await db.accounts.findOne({ _id: idObject });
  if (!account) {
    throw new Error('Account not found');
  }
  await db.accounts.updateOne({ _id: idObject }, { $set: { active: true } });
  res.status(200).json({
    message: 'active account suscess'
  });
}

export const makeInActiveAccount = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req?.params;
  const idObject = new ObjectId(id)
  const account = await db.accounts.findOne({ _id: idObject });
  if (!account) {
    throw new Error('Account not found');
  }
  await db.accounts.updateOne({ _id: idObject }, { $set: { active: false } });
  res.status(200).json({
    message: 'inactive account suscess'
  });
}


export const makeActiveJob = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req?.params;
  const idObject = new ObjectId(id)
  const account = await db.jobs.findOne({ _id: idObject });
  if (!account) {
    throw new Error('Account not found');
  }
  await db.jobs.updateOne({ _id: idObject }, { $set: { active: true } })
  res.status(200).json({
    message: 'active job suscess'
  });
}

export const makeInActivejob = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req?.params;
  const idObject = new ObjectId(id)
  const job = await db.jobs.findOne({ _id: idObject });
  if (!job) {
    throw new Error('job not found');
  }
  await db.jobs.updateOne({ _id: idObject }, { $set: { active: false } })
  res.status(200).json({
    message: 'inactive job suscess'
  });
}


export const getListEvaluationAdminController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { page, limit, nameEmployer, nameCandicate } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 1000;
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

export const makeActiveEnvalution = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req?.params;
  const idObject = new ObjectId(id)
  const job = await db.evaluations.findOne({ _id: idObject });
  if (!job) {
    throw new Error('Envalution not found');
  }
  await db.evaluations.updateOne({ _id: idObject }, { $set: { status: true } })
  res.status(200).json({
    message: 'inactive job suscess'
  });
}

export const createBlog = async (req: Request, res: Response) => {
  try {
    const { title, content, avatar } = req.body as ICreateUpdateBlog;
    const blog = await db.blogs.findOne({ title });
    if (blog) {
      res.status(200).json({
        message: 'Tiêu đề blog đã tồn tại',
        data: null
      });
    }
    const createdBlog = await db.blogs.insertOne(new Blog({ title, content, avatar }));
    res.status(200).json({
      message: 'Tạo blog thành công',
      data: createdBlog
    });
  } catch (error: any) {
    throw new Error(error.toString());
  }
};

export const updateBlog = async (req: Request, res: Response) => {
  try {
    const { blog_id, title } = req.body as ICreateUpdateBlog;
    console.log("chec req",req.body)
    const checkExist = await db.blogs.findOne({
      _id: new ObjectId(`${blog_id}`)
    })
    if (!checkExist) {
      throw new Error('Blog not found');
    }
    const updatedBlog = await db.blogs.updateOne(
      {
        _id: new ObjectId(`${blog_id}`)
      },
      {
      $set: {
        title:req.body?.title,
        content:req.body?.content,
        avatar:req.body?.avatar,
      }
    }
    );
    res.status(200).json({
      message: 'Chỉnh sửa blog thành công',
      data: updatedBlog
    });
  } catch (error: any) {
    throw new Error(error.toString());
  }
};

export const detailBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const checkExist = await db.blogs.findOne({
      _id: new ObjectId(`${id}`)
    })
   
    res.status(200).json({
      message: 'detail blog',
      data: checkExist
    });
  } catch (error: any) {
    throw new Error(error.toString());
  }
};


export const getListBlog = async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query;
    const {created_at,title,status} = req.query
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 1000;
    const skipNum = (pageNum - 1) * limitNum;
    const filter: any = {};
    if (title) {
  filter.title = { $regex: title, $options: 'i' }; // 'i' để không phân biệt hoa thường
}
if (status !== undefined) {
  // Ép kiểu về boolean vì query string luôn là string
  filter.status = status === 'true';
}

// Tìm kiếm theo created_at (nếu có fromDate và toDate)
console.log("created_at",created_at)
if (Array.isArray(created_at) && created_at.length === 2) {
    const [from, to] = created_at;
    const createdAtFilter: any = {};

    if (from) createdAtFilter.$gte = new Date(from as string);
    if (to) {
  const toDate = new Date(to as string);
  toDate.setDate(toDate.getDate() + 1); // Cộng thêm 1 ngày
  createdAtFilter.$lt = toDate;         // Dùng $lt thay vì $lte
}

    if (Object.keys(createdAtFilter).length > 0) {
      filter.created_at = createdAtFilter;
    }
  }
    const blogs = db.blogs.find(filter).skip(skipNum).limit(limitNum).toArray();
    const totalRecords = db.blogs.countDocuments();
    const result = await Promise.all([blogs, totalRecords])
    res.status(200).json({
      message: 'Lấy danh sách blog thành công',
      result: result[0],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(result[1] / limitNum),
        total_records: result[1]
      }
    });
  } catch (error: any) {
    throw new Error(error.toString());
  }
}

export const getDetailBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('id',id)
    const blog = await db.blogs.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $inc: {
          view: 1
        }
      }
    )
    if (!blog) {
      throw new Error('Blog not found');
    }
    res.status(200).json({
      message: 'Lấy blog thành công',
      result: blog
    });
  } catch (error: any) {
    throw new Error(error.toString());
  }
}

export const deleteBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const blog = db.blogs.findOneAndDelete({ _id: new ObjectId(`${id}`) });
    if (!blog) {
      throw new Error('Blog not found');
    }
    res.status(200).json({
      message: 'Xoá blog thành công',
      result: blog
    });
  } catch (error: any) {
    throw new Error(error.toString());
  }
}

