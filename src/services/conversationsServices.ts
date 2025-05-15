import db from '~/services/databaseServices';
import { ObjectId } from 'mongodb';

class ConversationsService {
  constructor() {}

  async getChats(conversation_id: string, limit: number=10, page: number=1) {
    const result = await db.chats
      .aggregate([
        { $match: { conversation_id: new ObjectId(conversation_id) } },
        {
          $lookup: {
            from: 'Accounts',
            localField: 'sender_id',
            foreignField: '_id',
            as: 'account_info'
          }
        },
        { $unwind: '$account_info' },
        {
          $lookup: {
            from: 'Employers',
            localField: 'account_info.user_id',
            foreignField: '_id',
            as: 'employer_info'
          }
        },
        {
          $lookup: {
            from: 'Candidates',
            localField: 'account_info.user_id',
            foreignField: '_id',
            as: 'candidate_info'
          }
        },
        { $sort: { created_at: -1 } },
        { $skip: limit * (page - 1) },
        { $limit: limit }
      ])
      .toArray();
    const total = await db.chats.countDocuments({ conversation_id: new ObjectId(conversation_id) });
    return {
      result,
      pagination: {
        page,
        limit,
        total_pages: Math.ceil(total / limit),
        total_records: total
      }
    };
  }
}

const conversationsService = new ConversationsService();
export default conversationsService;
