import { ObjectId } from 'mongodb';
import { EducationType, GenderType, LevelType } from '~/constants/enum';

interface CandidateType {
  _id?: ObjectId;
  name: string;
  description?: string;
  avatar?: string;
  cover_photo?: string;
  phone_number?: string;
  address?: string;
  date_of_birth?: Date;
  gender?: GenderType;
  experience_years?: number;
  education?: EducationType | null;
  level?: LevelType | null;
  fields?: ObjectId[] | null;
  current_job_position?: string;
  salary_expected?: number;
  language_level?: string;
  pre_apply_info?: {
    email?: string;
    phone_number?: string;
    content?: string;
    cv?: string;
  };
  cv?:string;
  skills?: ObjectId[];
  feature_job_position?: string;
}

export interface CVType {
  is_public: boolean;
  cv: string;
}

export class Candidate {
  _id: ObjectId;
  name: string;
  description: string;
  avatar: string;
  cover_photo: string;
  phone_number: string;
  address: string;
  date_of_birth: Date;
  gender: GenderType;
  experience_years: number;
  education: EducationType | null;
  level: LevelType | null;
  skills: ObjectId[];
  fields: ObjectId[] | null;
  current_job_position: string;
  feature_job_position: string;
  salary_expected: number;
  language_level: string;
  pre_apply_info: {
    email?: string;
    phone_number?: string;
    content?: string;
    cv?: string;
  };
  cv: string

  constructor(candidate: CandidateType) {
    this._id = candidate._id || new ObjectId();
    this.name = candidate.name || '';
    this.description = candidate.description || '';
    this.avatar = candidate.avatar || '';
    this.cover_photo = candidate.cover_photo || '';
    this.phone_number = candidate.phone_number || '';
    this.address = candidate.address || '';
    this.date_of_birth = candidate.date_of_birth || new Date();
    this.gender = candidate.gender || GenderType.Male;
    this.experience_years = candidate.experience_years || 0;
    this.education = candidate.education || null;
    this.level = candidate.level || null;
    this.fields = candidate.fields || [];
    this.current_job_position = candidate.current_job_position || '';
    this.salary_expected = candidate.salary_expected || 0;
    this.language_level = candidate.language_level || '';
    this.pre_apply_info = candidate.pre_apply_info || {
      email: '',
      phone_number: '',
      content: '',
      cv: ''
    };
    this.cv = candidate.cv || '';
    this.skills = candidate.skills || [];
    this.feature_job_position = candidate.feature_job_position || '';
  }
}
