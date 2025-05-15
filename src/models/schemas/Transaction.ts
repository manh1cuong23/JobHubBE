import { ObjectId } from 'mongodb';
import { MediaType } from '~/constants/enum';

interface TransactionType {
  _id?: ObjectId;
  employer_id: ObjectId;
  package_id: ObjectId;
  createdAt?:Date
  description?:string
  status?:boolean | null
}

export class Transaction {
    _id?: ObjectId;
    employer_id: ObjectId;
    description?:string
  package_id: ObjectId;
    createdAt?:Date
    status?:boolean | null

  constructor(chat: TransactionType) {
    this._id = chat._id || new ObjectId();
    this.description = chat.description || '';
    this.employer_id = chat.employer_id || '';
    this.package_id = chat.package_id || '';
    this.createdAt =  new Date();
    this.status = chat.status || null;
  }
}
