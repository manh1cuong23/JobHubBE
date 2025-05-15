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
import {
  sendMailFailInterview,
  sendMailInviteCandidate,
  sendMailInviteInterview,
  sendMailPassInterview,
  sendMailSuitableCV
} from '~/services/emailServices';

export const createJobController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const {
    name,
    description,
    level,
    education,
    type_work,
    year_experience,
    num_of_employees,
    gender,
    fields,
    skills,
    salary,
    city,
    background,
    deadline
  } = req.body;
  const idUser = req.body.decodeAuthorization.payload.userId
  const employer = await db.accounts.findOne({_id:new ObjectId(idUser)})
   if(!employer?.user_id){
    throw new ErrorWithStatus({
      message: 'Không tồn tại',
      status: httpStatus.FORBIDDEN
    })
  }
  const fieldsFinds = await Promise.all(
    fields.map(async (field: string) => {
      const fieldFind = await db.fields.findOne({ name: field });
      if (!fieldFind) {
        const init = await db.fields.insertOne(new Field({ name: field }));
        return new ObjectId(init.insertedId);
      } else {
        return fieldFind._id;
      }
    })
  );
  const skillsFinds = await Promise.all(
    skills.map(async (skill: string) => {
      const techFind = await db.skills.findOne({ name: skill });
      if (!techFind) {
        fieldsFinds.map(async (fieldId: ObjectId) => {
          const init = await db.skills.insertOne(new Skill({ name: skill, field_id: fieldId }));
          return new ObjectId(init.insertedId);
        });
      } else {
        return new ObjectId(techFind._id);
      }
    })
  );
  const Employer = await db.employer.findOne({_id:employer.user_id})
  if(Employer?.numberOffFree && Employer?.numberOffFree <=0){
    throw new ErrorWithStatus({
      message: 'Nhà tuyển dụng đã hết số lượt đăng tuyển',
      status: httpStatus.FORBIDDEN
    });
  }
  await db.jobs.insertOne(
    new Job({
      employer_id: new ObjectId(req.body.decodeAuthorization.payload.userId),
      name,
      description,
      level,
      education,
      type_work,
      year_experience,
      num_of_employees,
      gender,
      fields: fieldsFinds,
      skills: skillsFinds,
      salary,
      background,
      city,
      deadline: new Date(deadline)
    })
  );
  await db.employer.updateOne(
    { _id: employer.user_id },
    { $inc: { numberOffFree: -1 } }
  );
  res.status(200).json({
    message: 'Tạo công việc thành công'
  });
};

export const updateJobController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id: jobId } = req.params;
  const {
    name,
    description,
    level,
    education,
    type_work,
    year_experience,
    num_of_employees,
    gender,
    fields,
    skills,
    salary,
    background,
    deadline
  } = req.body;
  const fieldsFinds = await Promise.all(
    fields.map(async (field: string) => {
      const fieldFind = await db.fields.findOne({ name: field });
      if (!fieldFind) {
        const init = await db.fields.insertOne(new Field({ name: field }));
        return new ObjectId(init.insertedId);
      } else {
        return fieldFind._id;
      }
    })
  );
  const skillsFinds = await Promise.all(
    skills.map(async (skill: string) => {
      const techFind = await db.skills.findOne({ name: skill });
      if (!techFind) {
        fieldsFinds.map(async (fieldId: ObjectId) => {
          const init = await db.skills.insertOne(new Skill({ name: skill, field_id: fieldId }));
          return new ObjectId(init.insertedId);
        });
      } else {
        return new ObjectId(techFind._id);
      }
    })
  );
  await db.jobs.updateOne(
    { _id: new ObjectId(jobId) },
    {
      $set: {
        name,
        description,
        level,
        education,
        type_work,
        year_experience,
        num_of_employees,
        gender,
        fields: fieldsFinds,
        skills: skillsFinds,
        salary,
        background,
        deadline: new Date(deadline)
      }
    }
  );

  res.status(200).json({
    message: 'Cập nhật công việc thành công'
  });
};

export const getJobController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  const job = await db.jobs
    .aggregate([
      {
        $match: {
          _id: new ObjectId(id)
        }
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


export const deleteJobController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  await db.jobs.deleteOne({ _id: new ObjectId(id) });
  res.status(200).json({
    message: 'Xóa công việc thành công'
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
  const filter: any = {
    employer_id: new ObjectId(req.body.decodeAuthorization.payload.userId)
  };

  if (key) {
    filter.name = { $regex: key as string, $options: 'i' };
  }
  if (Array.isArray(deadline) && deadline.length === 2) {
    const [from, to] = deadline as [string, string];
    const deadlineFilter: any = {};

    if (from) deadlineFilter.$gte = new Date(from);
    if (to) deadlineFilter.$lte = new Date(to);

    if (Object.keys(deadlineFilter).length > 0) {
      filter.deadline = deadlineFilter;
    }
  }

  if (Array.isArray(createdAt) && createdAt.length === 2) {
    const [from, to] = createdAt as [string, string];
    const createdAtFilter: any = {};

    if (from) createdAtFilter.$gte = new Date(from);
    if (to) createdAtFilter.$lte = new Date(to);

    if (Object.keys(createdAtFilter).length > 0) {
      filter.createdAt = createdAtFilter;
    }
  }
  if (level) {
    filter.level = { $in: JSON.parse(level as string).map(Number) };
  }

  if (education) {
    filter.education = Number(education);
  }

  if (type_work) {
    filter.type_work = { $in: JSON.parse(type_work as string).map(Number) };
  }

  if (year_experience) {
    filter.year_experience = { $in: JSON.parse(year_experience as string).map(Number) };
  }

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
  if (city) {
    filter.city = { $in: JSON.parse(city as string).map(Number) };
  }
  let [jobs, totalJobs] = await Promise.all([
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
    db.jobs.countDocuments(filter)
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

export const recruitmentJobController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  await db.jobs.updateOne({ _id: new ObjectId(id) }, { $set: { status: JobStatus.Recuriting } });
  res.status(200).json({
    message: 'Đã đăng tin tuyển dụng công việc thành công'
  });
};

export const getListCandidateApplyJobController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  const page = Number(req.query.page) || 1;
  const status = req.query?.status;
  const limit = Number(req.query.limit) || 10;
  const { name } = req.query || req.params;
  const skip = (page - 1) * limit;
  const filter: any = { job_id: new ObjectId(id) };
  const filterName :any = {};
  if (name) {
    filterName.name = { $regex: name as string, $options: 'i' };
  }
  if (status) {
    if (Array.isArray(status)) {
      filter.status = {
        $in: status.map(s => parseInt(s as string)),
      };
    } else {
      filter.status = parseInt(status as string);
    }
  }
  const candidates = await db.apply
    .aggregate([
      {
        $match: filter
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'Accounts',
          localField: 'candidate_id',
          foreignField: '_id',
          as: 'candidate_account'
        }
      },
      {
        $unwind: '$candidate_account'
      },
      {
        $lookup: {
          from: 'Candidates',
          localField: 'candidate_account.user_id',
          foreignField: '_id',
          as: 'candidate_info'
        }
      },
      {
        $unwind: '$candidate_info'
      },
      {
        $match: {
          'candidate_info.name': { $regex: String(name || ''), $options: 'i' } // nameKeyword là biến bạn truyền vào
        }
      }
    ])
    .toArray();
  const totalCandidates = await db.apply.countDocuments(filter);
  const totalPages = Math.ceil(totalCandidates / limit);
  res.status(200).json({
    result: candidates,
    pagination: {
      page,
      limit,
      total_pages: totalPages,
      total_records: totalCandidates
    }
  });
};

export const approveCandidateController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  const [apply] = await db.apply
    .aggregate([
      {
        $match: { _id: new ObjectId(id) }
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
        $lookup: {
          from: 'Accounts',
          localField: 'candidate_id',
          foreignField: '_id',
          as: 'candidate_account'
        }
      },
      {
        $lookup: {
          from: 'Candidates',
          localField: 'candidate_account.user_id',
          foreignField: '_id',
          as: 'candidate_info'
        }
      },
      {
        $lookup: {
          from: 'Accounts',
          localField: 'job_info.employer_id',
          foreignField: '_id',
          as: 'employer_account'
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
        $addFields: {
          job_info: { $arrayElemAt: ['$job_info', 0] },
          candidate_info: { $arrayElemAt: ['$candidate_info', 0] },
          candidate_account: { $arrayElemAt: ['$candidate_account', 0] },
          employer_info: { $arrayElemAt: ['$employer_info', 0] },
          employer_account: { $arrayElemAt: ['$employer_account', 0] }
        }
      }
    ])
    .toArray();

  await db.apply.updateOne({ _id: new ObjectId(id) }, { $set: { status: ApplyStatus.Approved } });
  sendMailSuitableCV({
    toAddress: apply.candidate_account.email,
    candidateName: apply.candidate_info.name,
    employerName: apply.employer_info.name,
    jobTitle: apply.job_info.name
  });
  res.status(200).json({
    message: 'Phê duyệt ứng viên thành công'
  });
};

export const rejectCandidateController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  await db.apply.updateOne({ _id: new ObjectId(id) }, { $set: { status: ApplyStatus.Rejected } });
  res.status(200).json({
    message: 'Từ chối ứng viên thành công'
  });
};

export const inviteCandidateController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  const { job_id } = req.body;
  const candidate = await db.accounts
    .aggregate([
      {
        $match: {
          _id: new ObjectId(id)
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
        $unwind: '$candidate_info'
      }
    ])
    .toArray();
  const employer = await db.accounts
    .aggregate([
      {
        $match: {
          _id: new ObjectId(req.body.decodeAuthorization.payload.userId)
        }
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
        $unwind: '$employer_info'
      }
    ])
    .toArray();
  const job = await db.jobs.findOne({ _id: new ObjectId(job_id) });
  const existingApply = await db.apply.findOne({
    job_id:new ObjectId(job_id),
    candidate_id: new ObjectId(id),
  });
  if(existingApply){
    throw new ErrorWithStatus({
      message: 'Ứng viên đã được mời',
      status: httpStatus.FORBIDDEN
    });
  }
  await db.apply.insertOne(
    new Apply({
      job_id:new ObjectId(job_id),
      candidate_id: new ObjectId(id),
      status: ApplyStatus.WaitingCandidateAcceptInvite,
      content: '',
      cv: candidate[0]?.candidate_info?.cv,
      email: candidate[0].candidate_info.email,
      phone_number: candidate[0].candidate_info.phone_number
    })
  );

  // sendMailInviteCandidate({
  //   toAddress: candidate[0].candidate_info.email,
  //   candidateName: candidate[0].candidate_info.name,
  //   employerName: employer[0].employer_info.name,
  //   jobTitle: job?.name || '',
  //   jobId: job_id
  // });
  res.status(200).json({
    message: 'Mời phỏng vấn thành công'
  });
};

export const candidateAcceptInvite = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  await db.apply.updateOne({ _id: new ObjectId(id) }, { $set: { status: ApplyStatus.CandidateAcceptInvite } });
  res.status(200).json({
    message: 'Đồng ý lời mời thành công'
  });
};

export const makeInterviewController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  const { date, time, note,address } = req.body;
  await db.apply.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: ApplyStatus.WaitingCandidateAcceptSchedule,
        interview_employee_suggest_schedule: { date, time, note,address }
      }
    }
  );
  res.status(200).json({
    message: 'Mời phỏng vấn thành công'
  });
};

export const candidateChangeInterviewSchedule = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  const { date, time, note,address } = req.body;
  await db.apply.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: ApplyStatus.WaitingEmployerAcceptSchedule,
        interview_candidate_suggest_schedule: { date, time, note,address }
      }
    }
  );
  res.status(200).json({
    message: 'Đổi lại phỏng vấn thành công'
  });
};

export const acceptScheduleController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  const { role } = req.body.decodeAuthorization.payload;
  const apply = await db.apply.findOne({ _id: new ObjectId(id) });

  if (!apply) {
    throw new ErrorWithStatus({
      message: 'Không tìm tháy ứng tuyển này',
      status: httpStatus.NOT_FOUND
    });
  }
  if (role === UserRole.Candidate) {
    await db.apply.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: ApplyStatus.Interview, interview_final_schedule: apply.interview_employee_suggest_schedule } }
    );
  } else {
    await db.apply.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: ApplyStatus.Interview, interview_final_schedule: apply.interview_candidate_suggest_schedule } }
    );
  }
  res.status(200).json({
    message: 'Đồng ý phỏng vấn thành công'
  });
};

export const makePassController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  const apply = await db.apply.findOne({ _id: new ObjectId(id) });
  const candidate = await db.accounts
    .aggregate([
      {
        $match: {
          _id: new ObjectId(apply?.candidate_id)
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
        $unwind: '$candidate_info'
      }
    ])
    .toArray();
  const employer = await db.accounts
    .aggregate([
      {
        $match: {
          _id: new ObjectId(req.body.decodeAuthorization.payload.userId)
        }
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
        $unwind: '$employer_info'
      }
    ])
    .toArray();
  const job = await db.jobs.findOne({ _id: new ObjectId(apply?.job_id) });
  await db.apply.updateOne({ _id: new ObjectId(id) }, { $set: { status: ApplyStatus.Passed } });
  sendMailPassInterview({
    toAddress: candidate[0].candidate_info.email,
    candidateName: candidate[0].candidate_info.name,
    employerName: employer[0].employer_info.name,
    jobTitle: job?.name || ''
  });
  res.status(200).json({
    message: 'Phỏng vấn Passed ứng viên thành công'
  });
};

export const makeFailController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  const apply = await db.apply.findOne({ _id: new ObjectId(id) });
  const candidate = await db.accounts
    .aggregate([
      {
        $match: {
          _id: new ObjectId(apply?.candidate_id)
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
        $unwind: '$candidate_info'
      }
    ])
    .toArray();
  const employer = await db.accounts
    .aggregate([
      {
        $match: {
          _id: new ObjectId(req.body.decodeAuthorization.payload.userId)
        }
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
        $unwind: '$employer_info'
      }
    ])
    .toArray();
  const job = await db.jobs.findOne({ _id: new ObjectId(apply?.job_id) });
  await db.apply.updateOne({ _id: new ObjectId(id) }, { $set: { status: ApplyStatus.Failed } });

  sendMailFailInterview({
    toAddress: candidate[0].candidate_info.email,
    candidateName: candidate[0].candidate_info.name,
    employerName: employer[0].employer_info.name,
    jobTitle: job?.name || ''
  });
  res.status(200).json({
    message: 'Phỏng vấn Failed ứng viên thành công'
  });
};

export const getListCountCandidateController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  const page = Number(req.query.page) || 1;
  const status = req.query?.status;
  const limit = Number(req.query.limit) || 10;
  const { name } = req.query;
  const skip = (page - 1) * limit;
  const filter: any = { job_id: new ObjectId(id) };
 
  const candidatesByStatus = await db.apply
  .aggregate([
    {
      $match: filter // Áp dụng bộ lọc nếu có
    },
    {
      $group: {
        _id: "$status", // Nhóm theo trường status
        count: { $sum: 1 } // Tính số lượng cho mỗi trạng thái
      }
    },
    {
      $project: {
        _id: 0, // Loại bỏ trường _id mặc định
        status: "$_id", // Chuyển _id thành status
        count: 1 // Giữ trường count
      }
    },
    {
      $sort: {
        status: 1 // Sắp xếp theo status (tùy chọn, có thể bỏ)
      }
    }
  ])
  .toArray();

// Ánh xạ kết quả sang tên trạng thái từ ApplyStatus

  res.status(200).json({
    result: candidatesByStatus,
    pagination: {
      page,
      limit,
    }
  });
};


export const changeStatusJob = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  const {status} = req.query
  await db.jobs.updateOne({ _id: new ObjectId(id) }, { $set: { status: Number(status) as any } });
  res.status(200).json({
    message: 'Chuyển trạng thái công việc thahf công'
  });
};
