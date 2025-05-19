import { ObjectId } from 'mongodb';

interface BlogType {
  _id?: ObjectId;
  avatar: string;
  title: string;
  content: string;
  view?: number;
  created_at?:Date
  status?:boolean
}

export class Blog {
  _id?: ObjectId;
  avatar: string;
  title: string;
  content: string;
  view?: number;
  created_at?:Date
  status?:boolean

  constructor(blog: BlogType) {
    this._id = blog._id || new ObjectId();
    this.avatar = blog.avatar;
    this.title = blog.title;
    this.content = blog.content;
    this.view = blog.view || 0;
    this.created_at=blog.created_at || new Date()
    this.status=blog.status  || true

  }
}