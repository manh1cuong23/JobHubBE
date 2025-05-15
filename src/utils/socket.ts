import { Server } from 'socket.io';
import { Server as ServerHttp } from 'http';
import { accessTokenValidate } from './common';
import { UserVerifyStatus } from '~/constants/enum';
import { ErrorWithStatus } from '~/models/Errors';
import { httpStatus } from '~/constants/httpStatus';
import db from '~/services/databaseServices';
// import Conversation from '~/models/schemas/ConversationSchema';
import { ObjectId } from 'mongodb';

const initializeSocket = (httpServer: ServerHttp) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*'
    }
  });

  io.use(async (socket, next) => {
    try {
      const decodeAuthorization = await accessTokenValidate(socket.handshake.auth.access_token);
      const { verify } = decodeAuthorization.payload;
      if (verify !== UserVerifyStatus.Verified) {
        throw new ErrorWithStatus({
          message: 'User not Verified',
          status: httpStatus.FORBIDDEN
        });
      }
      socket.handshake.auth.decodeAuthorization = decodeAuthorization.payload;
      next();
    } catch (error) {
      next({
        message: (error as ErrorWithStatus).message,
        name: 'AuthorizationError',
        data: error
      });
    }
  });

  const users: {
    [key: string]: {
      socketId: string;
    };
  } = {};

  io.on('connection', (socket) => {
    console.log('👤 New client connected:', socket.id);
    const userId = socket.handshake.auth.decodeAuthorization.userId;
    users[userId] = {
      socketId: socket.id
    };
    socket.use(async (pocket, next) => {
      try {
        await accessTokenValidate(socket.handshake.auth.access_token);
        next();
      } catch (error) {
        next({
          message: (error as ErrorWithStatus).message,
          name: 'AuthorizationError'
        });
      }
    });

    socket.on('error', async (err) => {
      if (err.name === 'AuthorizationError') {
        socket.disconnect();
      }
    });

    socket.on('joinChat', (room) => {
      console.log("join p",room)
      socket.join(room);
    });
    socket.on('leaveChat', (room) => {
      console.log("leaveChat p",room)
      socket.leave(room);
    });

    socket.on('newChat', (room, chat) => {
      console.log("check chat",chat)
      io.to(room).emit('chatUpdated', chat);
    });
    socket.on('disconnect', () => {
      delete users[userId];
    });

  });
};

export default initializeSocket;
