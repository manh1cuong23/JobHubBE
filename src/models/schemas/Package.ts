import { ObjectId } from 'mongodb';
import { MediaType } from '~/constants/enum';

interface PackageType {
  _id?: ObjectId;
  name: string;
  price: number;
  count:number
  status?:boolean
}

export class Package {
  _id?: ObjectId;
  name: string;
  price: number;
  count:number
  status?:boolean

  constructor(chat: PackageType) {
    this._id = chat._id || new ObjectId();
    this.name = chat.name || '';
    this.price = chat.price || 0;
    this.count = chat.count || 0;
    this.status = chat.status || true;
  }
}
