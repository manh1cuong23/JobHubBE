import { ObjectId } from 'mongodb';

interface BlogType {
  _id?: ObjectId;
  avatar: string;
  title: string;
  content: string;
  view?: number;
}

export class Blog {
  _id?: ObjectId;
  avatar: string;
  title: string;
  content: string;
  view?: number;

  constructor(blog: BlogType) {
    this._id = blog._id || new ObjectId();
    this.avatar = blog.avatar;
    this.title = blog.title;
    this.content = blog.content;
    this.view = blog.view || 0;
  }
}