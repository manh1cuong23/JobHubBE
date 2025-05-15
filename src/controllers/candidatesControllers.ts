import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';
import { provinces } from '~/constants/const';
import { ApplyStatus, JobStatus, UserRole } from '~/constants/enum';
import { ErrorWithStatus } from '~/models/Errors';
import { Apply } from '~/models/schemas/ApplySchema';
import { Evaluation } from '~/models/schemas/EvaluationSchema';
import db from '~/services/databaseServices';
export const applyJobController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const jobId = req.params.id;
  const userId = req.body.decodeAuthorization.payload.userId;
  const { email, phone_number, content, cv } = req.body;
  const job = await db.jobs.findOne({ _id: new ObjectId(jobId) });
  if (!job) {
    throw new ErrorWithStatus({
      message: 'Công việc không tồn tại',
      status: 404
    });
  }
  const applyJob = await db.apply.findOne({ candidate_id: new ObjectId(userId), job_id: new ObjectId(jobId) });
  if (applyJob && applyJob.status !== ApplyStatus.Canceled) {
    throw new ErrorWithStatus({
      message: 'Bạn đã ứng tuyển công việc này',
      status: 400
    });
  }
  await db.apply.insertOne(
    new Apply({
      candidate_id: new ObjectId(userId),
      job_id: new ObjectId(jobId),
      email,
      phone_number,
      content,
      status: ApplyStatus.Pending,
      cv
    })
  );
  res.status(200).json({
    message: 'Ứng tuyển công việc thành công'
  });
};

export const cancelApplyJobController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const applyId = req.params.id;
  const applyJob = await db.apply.findOne({ _id: new ObjectId(applyId) });
  if (!applyJob) {
    throw new ErrorWithStatus({
      message: 'Ứng tuyển công việc không tồn tại',
      status: 404
    });
  }
  await db.apply.updateOne({ _id: applyJob._id }, { $set: { status: ApplyStatus.Canceled } });
  res.status(200).json({
    message: 'Hủy ứng tuyển công việc thành công'
  });
};

export const getListApplyJobController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const userId = req.body.decodeAuthorization.payload.userId;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const rawStatus = req.query.status;
  const jobId = req.query.job_id;
  let statusFilter = {};

  // Xử lý nếu có filter theo status
  if (rawStatus) {
    if (Array.isArray(rawStatus)) {
      statusFilter = { status: { $in: rawStatus.map((item)=>Number(item as string)) } };
    } else if (typeof rawStatus === "string") {
      statusFilter = { status: Number(rawStatus) };
    }
  }
  if(jobId){
    statusFilter = {...statusFilter,job_id: new ObjectId(jobId as string)}
  }
  const applyJobs = await db.apply
    .aggregate([
      {
        $match: {
          candidate_id: new ObjectId(userId),
          ...statusFilter
        }
      },
      {
        $lookup: {
          from: 'Jobs',
          localField: 'job_id',
          foreignField: '_id',
          as: 'job_info'
        }
      },
      {
        $unwind: '$job_info'
      },
      {
        $lookup: {
          from: 'Accounts',
          localField: 'job_info.employer_id',
          foreignField: '_id',
          as: 'job_info.employer_account'
        }
      },
      {
        $unwind: '$job_info.employer_account'
      },
      {
        $lookup: {
          from: 'Employers',
          localField: 'job_info.employer_account.user_id',
          foreignField: '_id',
          as: 'job_info.employer_info'
        }
      },
      {
        $unwind: '$job_info.employer_info'
      },
      {
        $lookup: {
          from: 'Skills',
          localField: 'job_info.skills',
          foreignField: '_id',
          as: 'job_info.skills_info'
        }
      },
      {
        $lookup: {
          from: 'Fields',
          localField: 'job_info.fields',
          foreignField: '_id',
          as: 'job_info.fields_info'
        }
      }
    ])
    .skip(skip)
    .limit(limit)
    .toArray();
  const totalApplyJobs = await db.apply.countDocuments({ candidate_id: new ObjectId(userId) });
  const totalPages = Math.ceil(totalApplyJobs / limit);
  res.status(200).json({
    result: {
      applyJobs,
      pagination: {
        page,
        limit,
        total_pages: totalPages,
        total_records: totalApplyJobs
      }
    },
    message: 'Lấy danh sách ứng tuyển công việc thành công'
  });
};

export const searchJobController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const {
    page,
    limit,
    key,
    level,
    education,
    type_work,
    year_experience,
    gender,
    fields,
    skills,
    salary_min,
    salary_max,
    status,
    city
  } = req.query;
  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;
  const skip = (pageNumber - 1) * limitNumber;
  const filter: any = {};
  const roleUser = req.body.decodeAuthorization.payload.role;
  if(Number(roleUser as string) == UserRole.Candidate){
    filter.status = { $ne: JobStatus.Created }; 
  }
  if (key) {
    filter.name = { $regex: key as string, $options: 'i' };
  }

  if (education) {
    filter.education = Number(education);
  }
  
 
  if (city) {
    filter.city = { $in:JSON.parse(city as string).map(Number) };
  }
  if (level) {
    filter.level = { $in:JSON.parse(level as string).map(Number) };
  }
  if (year_experience) {
    filter.year_experience = { $in:JSON.parse(year_experience as string).map(Number) };
  }
  if (type_work) {
    filter.type_work = { $in:JSON.parse(type_work as string).map(Number) };
  }
  // if (level) {
  //   filter.level = Number(level);
  // }

  //   if (year_experience) {
  //     filter.year_experience = Number(year_experience);
  //   }

  // if (type_work) {
  //   filter.type_work = Number(type_work);
  // }

  if (gender) {
    filter.gender = Number(gender);
  }

  if (fields) {
    filter.fields = { $in: JSON.parse(fields as string).map((field: string) => new ObjectId(field)) };
  }

  if (skills) {
    filter.skills = { $in: JSON.parse(skills as string).map((skill: string) => new ObjectId(skill)) };
  }

  if (salary_min || salary_max) {
    const min = Number(salary_min);
    const max = Number(salary_max);
    if (!isNaN(min) && !isNaN(max)) {
      filter.$or = [
        { salary: { $gte: min, $lte: max } },
        { $and: [{ 'salary.0': { $lte: min } }, { 'salary.1': { $gte: max } }] }
      ];
    } else if (!isNaN(min)) {
      filter.$or = [{ salary: { $gte: min } }, { 'salary.0': { $lte: min } }];
    } else if (!isNaN(max)) {
      filter.$or = [{ salary: { $lte: max } }, { 'salary.1': { $gte: max } }];
    }
  }
  if (status) {
    filter.status = Number(status);
  }

  let [jobs, totalJobs,employers] = await Promise.all([
    db.jobs
      .aggregate([
        {
          $match: filter
        },
        {
          $skip: skip
        },
        {
          $limit: limitNumber
        },
        {
          $lookup: {
            from: 'Accounts',
            localField: 'employer_id',
            foreignField: '_id',
            as: 'employer_account'
          }
        },
        {
          $unwind: '$employer_account'
        },
        {
          $lookup: {
            from: 'Employers',
            localField: 'employer_account.user_id',
            foreignField: '_id',
            as: 'employer_info'
          }
        },
        {
          $unwind: '$employer_info'
        },
        {
          $lookup: {
            from: 'Skills',
            localField: 'skills',
            foreignField: '_id',
            as: 'skills_info'
          }
        },
        {
          $lookup: {
            from: 'Fields',
            localField: 'fields',
            foreignField: '_id',
            as: 'fields_info'
          }
        },
        {
          $lookup: {
            from: 'Applies',
            let: { jobId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$job_id', '$$jobId']
                  }
                }
              },
              {
                $count: 'total'
              }
            ],
            as: 'applications_count'
          }
        },
        {
          $addFields: {
            total_applications: {
              $ifNull: [{ $arrayElemAt: ['$applications_count.total', 0] }, 0]
            }
          }
        },
        {
          $lookup: {
            from: 'Evaluations',
            localField: 'employer_id',
            foreignField: 'employer_id',
            as: 'employer_evaluations'
          }
        },
        {
          $addFields: {
            employer_rating: {
              average_rate: {
                $cond: [{ $eq: [{ $size: '$employer_evaluations' }, 0] }, 0, { $avg: '$employer_evaluations.rate' }]
              },
              total_evaluations: { $size: '$employer_evaluations' }
            }
          }
        },
        {
          $project: {
            applications_count: 0,
            employer_evaluations: 0
          }
        }
      ])
      .toArray(),
    db.jobs.countDocuments(filter),
    db.employer
    .aggregate([
      {
        $match: filter
      },
      {
        $skip: skip
      },
      {
        $limit: limitNumber
      },
      {
        $lookup: {
          from: 'Fields',
          localField: 'fields',
          foreignField: '_id',
          as: 'fields_info'
        }
      },
    ])
    .toArray(),
  ]);
  totalJobs = totalJobs + 0;
  jobs = jobs.map((job: any) => {
    job.city_info = provinces.find((city: any) => city._id === job.city);
    return job;
  });
  const totalPages = Math.ceil(totalJobs / limitNumber);

  const result = {
    jobs,
    employers,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total_pages: totalPages,
      total_records: totalJobs
    }
  };
  res.status(200).json({
    result,
    message: 'Lấy danh sách công việc thành công'
  });
};

export const evaluateEmployerController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  const { rate, content,title,isEncouragedToWorkHere } = req.body;
  const candidateId = req.body.decodeAuthorization.payload.userId;
  const employerId = new ObjectId(id);
  const evaluation = new Evaluation({
    employer_id: employerId,
    candidate_id: new ObjectId(candidateId),
    rate,
    content,
    title,
    isEncouragedToWorkHere
  });
  await db.evaluations.insertOne(evaluation);
  res.status(200).json({
    message: 'Đánh giá thành công'
  });
};


export const getListInvitedJobController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const userId = req.body.decodeAuthorization.payload.userId;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const rawStatus = req.query.status;
  let statusFilter = {};

  // Xử lý nếu có filter theo status
  if (rawStatus) {
    if (Array.isArray(rawStatus)) {
      statusFilter = { status: { $in: rawStatus.map((item)=>Number(item as string)) } };
    } else if (typeof rawStatus === "string") {
      statusFilter = { status: Number(rawStatus) };
    }
  }
 

  const applyJobs = await db.apply
    .aggregate([
      {
        $match: {
          candidate_id: new ObjectId(userId),
          ...statusFilter
        }
      },
      {
        $lookup: {
          from: 'Jobs',
          localField: 'job_id',
          foreignField: '_id',
          as: 'job_info'
        }
      },
      {
        $unwind: '$job_info'
      },
      {
        $lookup: {
          from: 'Accounts',
          localField: 'job_info.employer_id',
          foreignField: '_id',
          as: 'job_info.employer_account'
        }
      },
      {
        $unwind: '$job_info.employer_account'
      },
      {
        $lookup: {
          from: 'Employers',
          localField: 'job_info.employer_account.user_id',
          foreignField: '_id',
          as: 'job_info.employer_info'
        }
      },
      {
        $unwind: '$job_info.employer_info'
      },
      {
        $lookup: {
          from: 'Skills',
          localField: 'job_info.skills',
          foreignField: '_id',
          as: 'job_info.skills_info'
        }
      },
      {
        $lookup: {
          from: 'Fields',
          localField: 'job_info.fields',
          foreignField: '_id',
          as: 'job_info.fields_info'
        }
      }
    ])
    .skip(skip)
    .limit(limit)
    .toArray();
  const totalApplyJobs = await db.apply.countDocuments({ candidate_id: new ObjectId(userId) });
  const totalPages = Math.ceil(totalApplyJobs / limit);
  res.status(200).json({
    result: {
      applyJobs,
      pagination: {
        page,
        limit,
        total_pages: totalPages,
        total_records: totalApplyJobs
      }
    },
    message: 'Lấy danh sách ứng tuyển công việc thành công'
  });
};

export const getDetailProfileEmployerController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const employerId = req.params.id;
  const applyJobs = await db.employer
    .aggregate([
      {
        $match: {
          _id: new ObjectId(employerId as string),
        }
      },
      {
        $lookup: {
          from: 'Skills',
          localField: 'skills',
          foreignField: '_id',
          as: 'skills_info'
        }
      },
      {
        $lookup: {
          from: 'Fields',
          localField: 'fields',
          foreignField: '_id',
          as: 'fields_info'
        }
      }
    ])
    .skip(skip)
    .limit(limit)
    .toArray();
  res.status(200).json({
    result: {
      applyJobs,
    },
    message: 'Lấy danh sách ứng tuyển công việc thành công'
  });
};

export const getListJobController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const {
    page,
    limit,
    key,
    level,
    education,
    type_work,
    year_experience,
    gender,
    fields,
    skills,
    salary_min,
    salary_max,
    status,
    deadline,
    createdAt,
    city
  } = req.query;
  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;
  const skip = (pageNumber - 1) * limitNumber;
  const  employer_id = new ObjectId(req.params?.id)

 
 
  let [jobs, totalJobs] = await Promise.all([
    db.jobs
      .aggregate([
        {
          $skip: skip
        },
        {
          $limit: limitNumber
        },
        {
          $lookup: {
            from: 'Accounts',
            localField: 'employer_id',
            foreignField: '_id',
            as: 'employer_account'
          }
        },
        {
          $unwind: '$employer_account'
        },
        {
          $match: {
            'employer_account.user_id':employer_id // userId là tham số truyền vào
          }
        },
        {
          $lookup: {
            from: 'Employers',
            localField: 'employer_account.user_id',
            foreignField: '_id',
            as: 'employer_info'
          }
        },
        {
          $unwind: '$employer_info'
        },
        {
          $lookup: {
            from: 'Skills',
            localField: 'skills',
            foreignField: '_id',
            as: 'skills_info'
          }
        },
        {
          $lookup: {
            from: 'Fields',
            localField: 'fields',
            foreignField: '_id',
            as: 'fields_info'
          }
        },
        {
          $lookup: {
            from: 'Applies',
            let: { jobId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$job_id', '$$jobId']
                  }
                }
              },
              {
                $count: 'total'
              }
            ],
            as: 'applications_count'
          }
        },
        {
          $addFields: {
            total_applications: {
              $ifNull: [{ $arrayElemAt: ['$applications_count.total', 0] }, 0]
            }
          }
        },
        {
          $lookup: {
            from: 'Evaluations',
            localField: 'employer_id',
            foreignField: 'employer_id',
            as: 'employer_evaluations'
          }
        },
        {
          $addFields: {
            employer_rating: {
              average_rate: {
                $cond: [{ $eq: [{ $size: '$employer_evaluations' }, 0] }, 0, { $avg: '$employer_evaluations.rate' }]
              },
              total_evaluations: { $size: '$employer_evaluations' }
            }
          }
        },
        {
          $project: {
            applications_count: 0,
            employer_evaluations: 0
          }
        }
      ])
      .toArray(),
    db.jobs.countDocuments()
  ]);
  totalJobs = totalJobs + 0;
  jobs = jobs.map((job: any) => {
    job.city_info = provinces.find((city: any) => city._id === job.city);
    return job;
  });
  const totalPages = Math.ceil(totalJobs / limitNumber);

  const result = {
    jobs,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total_pages: totalPages,
      total_records: totalJobs
    }
  };
  res.status(200).json({
    result,
    message: 'Lấy danh sách công việc thành công'
  });
};

