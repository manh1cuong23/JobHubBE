import { ObjectId } from 'mongodb';
import { ApplyStatus } from '~/constants/enum';

interface InterviewSuggestScheduleType {
  date?: Date;
  time?: number; //Số phút, ví dụ 15h là 900
  address?: string;
  note?: string;
}
interface ApplyType {
  _id?: ObjectId;
  job_id: ObjectId;
  candidate_id: ObjectId;
  email: string;
  phone_number: string;
  content: string;
  cv: string;
  status: ApplyStatus;
  interview_employee_suggest_schedule?: InterviewSuggestScheduleType;
  interview_candidate_suggest_schedule?: InterviewSuggestScheduleType;
  interview_final_schedule?: InterviewSuggestScheduleType;
}
export class Apply {
  _id: ObjectId;
  job_id: ObjectId;
  candidate_id: ObjectId;
  email: string;
  phone_number: string;
  content: string;
  cv: string;
  status: ApplyStatus;
  interview_employee_suggest_schedule: InterviewSuggestScheduleType;
  interview_candidate_suggest_schedule: InterviewSuggestScheduleType;
  interview_final_schedule: InterviewSuggestScheduleType;
  createdAt: Date;

  constructor(apply: ApplyType) {
    this._id = apply._id || new ObjectId();
    this.job_id = apply.job_id || new ObjectId();
    this.candidate_id = apply.candidate_id || new ObjectId();
    this.email = apply.email || '';
    this.phone_number = apply.phone_number || '';
    this.content = apply.content || '';
    this.cv = apply.cv || '';
    this.status = apply.status || ApplyStatus.Pending;
    this.interview_employee_suggest_schedule = apply.interview_employee_suggest_schedule || {};
    this.interview_candidate_suggest_schedule = apply.interview_candidate_suggest_schedule || {};
    this.interview_final_schedule = apply.interview_final_schedule || {};
    this.createdAt = new Date();
  }
}
