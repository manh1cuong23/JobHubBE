import { Router } from 'express';
import {
  getChatsController,
  getConversationsController,
  getConversationsDetailController,
  makeConversationController,
  sendMessageController
} from '~/controllers/conversationsControllers';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/make-conversation', accessTokenValidator, verifiedUserValidator, catchError(makeConversationController));
router.get('/get-conversations', accessTokenValidator, verifiedUserValidator, catchError(getConversationsController));
router.get('/get-conversations/:id', accessTokenValidator, verifiedUserValidator, catchError(getConversationsDetailController));
router.get('/get-chats/:id', accessTokenValidator, verifiedUserValidator, catchError(getChatsController));

router.post('/send-message', accessTokenValidator, verifiedUserValidator, catchError(sendMessageController));

export default router;
