import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import { Chat } from '~/models/schemas/ChatSchema';
import { Conversation } from '~/models/schemas/ConversationSchema';
import conversationsService from '~/services/conversationsServices';
import db from '~/services/databaseServices';

export const getChatsController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const conversation_id = req.params.id;
  const limit = Number(req.query.limit as string);
  const pageInput = Number(req.query.page as string);
  const result = await conversationsService.getChats(conversation_id, limit, pageInput);
  res.status(200).json({
    result,
    message: 'Get conversation suscess'
  });
};

export const sendMessageController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { conversatin_id, content, medias } = req.body;
  const sender_id = req.body.decodeAuthorization.payload.userId;
  const chat = new Chat({
    sender_id: new ObjectId(sender_id),
    conversation_id: new ObjectId(conversatin_id),
    message: content,
    medias: medias,
    created_at: new Date()
  });
  const chatInsert = await db.chats.insertOne(chat);
  await db.conversations.findOneAndUpdate(
    { _id: new ObjectId(conversatin_id) },
    { $set: { last_message: chatInsert.insertedId } }
  );
  res.status(200).json({
    message: 'Send message suscess'
  });
};

export const getConversationsController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const user_id = req.body.decodeAuthorization.payload.userId;
  const limit = Number(req.query.limit as string) || 10; // Default limit
  const pageInput = Number(req.query.page as string) || 1; // Default page
  const skip = (pageInput - 1) * limit;

  const conversations = await db.conversations
    .aggregate([
      // Lọc các cuộc hội thoại liên quan đến user_id
      {
        $match: {
          $or: [
            { employer_id: new ObjectId(user_id) },
            { candidate_id: new ObjectId(user_id) },
          ],
        },
      },
      // Nối với Accounts để lấy thông tin employer
      {
        $lookup: {
          from: 'Accounts',
          localField: 'employer_id',
          foreignField: '_id',
          as: 'account_employer_info',
        },
      },
      {
        $unwind: {
          path: '$account_employer_info',
          preserveNullAndEmptyArrays: true, // Giữ lại nếu không có dữ liệu
        },
      },
      // Chuyển user_id thành ObjectId và nối với Employers
      {
        $lookup: {
          from: 'Employers',
          let: { user_id: { $toObjectId: '$account_employer_info.user_id' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$user_id'] } } },
          ],
          as: 'employer_info',
        },
      },
      {
        $unwind: {
          path: '$employer_info',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Nối với Accounts để lấy thông tin candidate
      {
        $lookup: {
          from: 'Accounts',
          localField: 'candidate_id',
          foreignField: '_id',
          as: 'account_candidate_info',
        },
      },
      {
        $unwind: {
          path: '$account_candidate_info',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Chuyển user_id thành ObjectId và nối với Candidates
      {
        $lookup: {
          from: 'Candidates',
          let: { user_id: { $toObjectId: '$account_candidate_info.user_id' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$user_id'] } } },
          ],
          as: 'candidate_info',
        },
      },
      {
        $unwind: {
          path: '$candidate_info',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Nối với Chats để lấy thông tin last_message
      {
        $lookup: {
          from: 'Chats',
          localField: 'last_message',
          foreignField: '_id',
          as: 'last_message_info',
        },
      },
      {
        $unwind: {
          path: '$last_message_info',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Sắp xếp theo thời gian tạo của last_message
      {
        $sort: {
          'last_message_info.created_at': -1,
        },
      },
      // Phân trang
      { $skip: skip },
      { $limit: limit },
    ])
    .toArray();

  // Đếm tổng số cuộc hội thoại
  const totalConversations = await db.conversations.countDocuments({
    $or: [
      { employer_id: new ObjectId(user_id) },
      { candidate_id: new ObjectId(user_id) },
    ],
  });
  const totalPages = Math.ceil(totalConversations / limit);

  // Trả về kết quả
  res.status(200).json({
    conversations,
    message: 'Get conversations success',
    pagination: {
      page: pageInput,
      limit,
      total_pages: totalPages,
      total_records: totalConversations,
    },
  });
};

export const makeConversationController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { employer_id, candidate_id } = req.body;
  const checkConversation = await db.conversations.findOne({
    $or: [
      { employer_id: new ObjectId(employer_id), candidate_id: new ObjectId(candidate_id) },
      { employer_id: new ObjectId(candidate_id), candidate_id: new ObjectId(employer_id) }
    ]
  });
  if (checkConversation) {
  return  res.status(200).json({
      message: 'Conversation exits',
      result:checkConversation
    });
  }

  const conversation = new Conversation({
    employer_id: new ObjectId(employer_id),
    candidate_id: new ObjectId(candidate_id)
  });
  const conversationInsert = await db.conversations.insertOne(conversation);
  res.status(200).json({
    message: 'Make conversation suscess',
    result:{_id:conversationInsert?.insertedId}
    
  });
};
export const getConversationsDetailController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const {id} = req.params || req.query
  const limit = Number(req.query.limit as string) || 10; // Default limit
  const pageInput = Number(req.query.page as string) || 1; // Default page
  const skip = (pageInput - 1) * limit;

  const conversations = await db.conversations
    .aggregate([
      // Lọc các cuộc hội thoại liên quan đến user_id
      {
        $match: {
         _id : new ObjectId(id)
        },
      },
      // Nối với Accounts để lấy thông tin employer
      {
        $lookup: {
          from: 'Accounts',
          localField: 'employer_id',
          foreignField: '_id',
          as: 'account_employer_info',
        },
      },
      {
        $unwind: {
          path: '$account_employer_info',
          preserveNullAndEmptyArrays: true, // Giữ lại nếu không có dữ liệu
        },
      },
      // Chuyển user_id thành ObjectId và nối với Employers
      {
        $lookup: {
          from: 'Employers',
          let: { user_id: { $toObjectId: '$account_employer_info.user_id' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$user_id'] } } },
          ],
          as: 'employer_info',
        },
      },
      {
        $unwind: {
          path: '$employer_info',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Nối với Accounts để lấy thông tin candidate
      {
        $lookup: {
          from: 'Accounts',
          localField: 'candidate_id',
          foreignField: '_id',
          as: 'account_candidate_info',
        },
      },
      {
        $unwind: {
          path: '$account_candidate_info',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Chuyển user_id thành ObjectId và nối với Candidates
      {
        $lookup: {
          from: 'Candidates',
          let: { user_id: { $toObjectId: '$account_candidate_info.user_id' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$user_id'] } } },
          ],
          as: 'candidate_info',
        },
      },
      {
        $unwind: {
          path: '$candidate_info',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Nối với Chats để lấy thông tin last_message
      {
        $lookup: {
          from: 'Chats',
          localField: 'last_message',
          foreignField: '_id',
          as: 'last_message_info',
        },
      },
      {
        $unwind: {
          path: '$last_message_info',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Sắp xếp theo thời gian tạo của last_message
      {
        $sort: {
          'last_message_info.created_at': -1,
        },
      },
      // Phân trang
      { $skip: skip },
      { $limit: limit },
    ])
    .toArray();

  // Đếm tổng số cuộc hội thoại

  // Trả về kết quả
  res.status(200).json({
    conversations,
    message: 'Get conversations success',
  });
};