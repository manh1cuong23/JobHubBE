import { Collection, Db, MongoClient, ServerApiVersion } from 'mongodb';
import { RefreshToken } from '~/models/schemas/RefreshTokenSchema';

import { env } from '~/constants/config';
import { Account } from '~/models/schemas/AccountSchema';
import { Employer } from '~/models/schemas/EmployerSchema';
import { Candidate } from '~/models/schemas/CandidateSchema';
import { Conversation } from '~/models/schemas/ConversationSchema';
import { Chat } from '~/models/schemas/ChatSchema';
import { Skill } from './../models/schemas/SkillSchema';
import { Field } from '~/models/schemas/FieldSchema';
import { Job } from '~/models/schemas/JobSchema';
import { Package } from '~/models/schemas/Package';
import { Transaction } from '~/models/schemas/Transaction';
import { Apply } from '~/models/schemas/ApplySchema';
import { VerifyEmployer } from '~/models/schemas/VerifySchema';
import { Evaluation } from '~/models/schemas/EvaluationSchema';

const uri = env.mongodbURI;

class DatabaseServices {
  private client: MongoClient;
  private db: Db;
  constructor() {
    console.log('uri:', uri);
    this.client = new MongoClient(uri!);
    this.db = this.client.db(env.dbName);
  }

  async connect() {
    try {
      await this.client.connect();
      await this.db.command({ ping: 1 });
      console.log('Successfully connected to MongoDB!');
    } catch (e) {
      console.log(e);
    }
  }

  get accounts(): Collection<Account> {
    return this.db.collection('Accounts');
  }
  get employer(): Collection<Employer> {
    return this.db.collection('Employers');
  }
  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection('RefreshTokens');
  }
  get candidates(): Collection<Candidate> {
    return this.db.collection('Candidates');
  }
  get jobs(): Collection<Job> {
    return this.db.collection('Jobs');
  }
  get apply(): Collection<Apply> {
    return this.db.collection('Applies');
  }
  get verifyEmployers(): Collection<VerifyEmployer> {
    return this.db.collection('VerifyEmployers');
  }
  get evaluations(): Collection<Evaluation> {
    return this.db.collection('Evaluations');
  }
  get conversations(): Collection<Conversation> {
    return this.db.collection('Conversations');
  }
  get chats(): Collection<Chat> {
    return this.db.collection('Chats');
  }
  get skills(): Collection<Skill> {
    return this.db.collection('Skills');
  }
  get fields(): Collection<Field> {
    return this.db.collection('Fields');
  }
  get packages(): Collection<Package> {
    return this.db.collection('Packages');
  }
  get transactions(): Collection<Transaction> {
    return this.db.collection('Transactions');
  }
}

const db = new DatabaseServices();
export default db;
