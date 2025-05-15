import { ObjectId } from 'mongodb';
import { UserRole, UserVerifyStatus } from '~/constants/enum';

interface AccountType {
  _id?: ObjectId;
  user_id: ObjectId | null;
  email: string;
  password: string;
  role: UserRole;
  verify_email_token: string;
  forgot_email_token: string;
  status: UserVerifyStatus;
  active?:boolean
  username?:string
  avatar?:string
}

export class Account {
  _id: ObjectId;
  user_id: ObjectId | null;
  email: string;
  password: string;
  role: UserRole;
  verify_email_token: string;
  forgot_email_token: string;
  status: UserVerifyStatus;
  active?:boolean
  username?:string
  avatar?:string

  constructor(account: AccountType) {
    this._id = account._id || new ObjectId();
    this.user_id = account.user_id || null;
    this.email = account.email;
    this.password = account.password || '';
    this.role = account.role;
    this.verify_email_token = account.verify_email_token || '';
    this.forgot_email_token = account.forgot_email_token || '';
    this.status = account.status || 0;
    this.active=account.active || true
    this.username = account.username || '';
    this.avatar = account.avatar || '';
  }
}
