import { ObjectId } from 'mongodb';

export interface ICreateUpdateBlog {
  blog_id: ObjectId;
  title: string;
  content: string;
  avatar: string;
};