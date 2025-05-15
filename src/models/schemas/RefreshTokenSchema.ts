import { ObjectId } from 'mongodb';

interface RefreshTokenType {
  _id?: ObjectId;
  token: string;
  created_at: Date;
  user_id: ObjectId;
}

export class RefreshToken {
  _id: ObjectId;
  token: string;
  created_at: Date;
  user_id: ObjectId;

  constructor(refreshToken: RefreshTokenType) {
    this._id = refreshToken._id || new ObjectId();
    this.token = refreshToken.token || '';
    this.created_at = refreshToken.created_at || new Date();
    this.user_id = refreshToken.user_id || new ObjectId();
  }
}
