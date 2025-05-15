import { ObjectId } from 'mongodb';

interface ConversationType {
  _id?: ObjectId;
  employer_id: ObjectId;
  candidate_id: ObjectId;
  last_message?: ObjectId;
}

export class Conversation {
  _id: ObjectId;
  employer_id: ObjectId;
  candidate_id: ObjectId;
  last_message: ObjectId;

  constructor(conversation: ConversationType) {
    this._id = conversation._id || new ObjectId();
    this.employer_id = conversation.employer_id || new ObjectId();
    this.candidate_id = conversation.candidate_id || new ObjectId();
    this.last_message = conversation.last_message || new ObjectId();
  }
}
