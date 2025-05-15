import { ObjectId } from 'mongodb';
import { MediaType } from '~/constants/enum';

interface ChatType {
  _id?: ObjectId;
  conversation_id: ObjectId;
  message: string;
  sender_id: ObjectId;
  created_at: Date;
  medias: MediaType[];
}

export class Chat {
  _id: ObjectId;
  conversation_id: ObjectId;
  message: string;
  sender_id: ObjectId;
  created_at: Date;
  medias: MediaType[];

  constructor(chat: ChatType) {
    this._id = chat._id || new ObjectId();
    this.conversation_id = chat.conversation_id || new ObjectId();
    this.message = chat.message || '';
    this.sender_id = chat.sender_id || new ObjectId();
    this.created_at = chat.created_at || new Date();
    this.medias = chat.medias || [];
  }
}
