import { ObjectId } from 'mongodb';

interface VerifyEmployerType {
  _id?: ObjectId;
  employer_id?: ObjectId;
  business_document?: string;
  status?: 'PENDING' | 'APPROVE' | 'REJECT';
}

export class VerifyEmployer {
  _id: ObjectId;
  employer_id: ObjectId;
  business_document: string;
  status: 'PENDING' | 'APPROVE' | 'REJECT';

  constructor(verifyEmployer: VerifyEmployerType) {
    this._id = verifyEmployer._id || new ObjectId();
    this.employer_id = verifyEmployer.employer_id || new ObjectId();
    this.business_document = verifyEmployer.business_document || '';
    this.status = verifyEmployer.status || 'PENDING';
  }
}
