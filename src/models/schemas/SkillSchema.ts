import { ObjectId } from 'mongodb';

interface SkillType {
  _id?: ObjectId;
  field_id: ObjectId;
  name: string;
}

export class Skill {
  _id: ObjectId;
  field_id: ObjectId;
  name: string;

  constructor(skill: SkillType) {
    this._id = skill._id || new ObjectId();
    this.field_id = skill.field_id || new ObjectId();
    this.name = skill.name || '';
  }
}
