import { ObjectId } from 'mongodb';
import { AddressInfo, PhoneInfo } from '~/constants/enum';

interface EmployerType {
  _id?: ObjectId;
  name: string;
  description?: string;
  avatar?: string;
  cover_photo?: string;
  employer_size?: number;
  date_working?: string;
  time_working?: string;
  isOt?: Boolean;
  skills?: ObjectId[];
  phone_number?: PhoneInfo[];
  address?: AddressInfo[];
  fields?: ObjectId[];
  status?: number;
  city?:number;
  images?:any
  numberOffFree?:number
  orderCode?:number
}

export class Employer {
  _id: ObjectId;
  name: string;
  description: string;
  avatar: string;
  cover_photo: string;
  date_working: string;
  time_working: string;
  isOt: Boolean;
  skills: ObjectId[];
  employer_size: number;
  phone_number: PhoneInfo[];
  address: AddressInfo[];
  fields: ObjectId[];
  status: number;
  city:number;
  images?:any
  numberOffFree?:number
  orderCode?:number

  constructor(employer: EmployerType) {
    this._id = employer._id || new ObjectId();
    this.name = employer.name || '';
    this.description = employer.description || '';
    this.avatar = employer.avatar || '';
    this.cover_photo = employer.cover_photo || '';
    this.date_working = employer.date_working || '';
    this.time_working = employer.time_working || '';
    this.isOt = employer.isOt || false;
    this.skills = employer.skills || [];
    this.employer_size = employer.employer_size || 0;
    this.phone_number = employer.phone_number || [];
    this.address = employer.address || [];
    this.fields = employer.fields || [];
    this.status = employer.status || 1;
    this.city = employer.city || 0;
    this.images = employer.images || {};
    this.numberOffFree = employer.numberOffFree || 2
    this.orderCode = employer.orderCode || 0
  }
}
