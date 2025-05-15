import { ObjectId } from 'mongodb';

interface FieldType {
  _id?: ObjectId;
  name: string;
}

export class Field {
  _id: ObjectId;
  name: string;

  constructor(field: FieldType) {
    this._id = field._id || new ObjectId();
    this.name = field.name || '';
  }
}
