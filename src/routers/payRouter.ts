import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
import { Router } from 'express';
import { createPaymentLink, handleWebhook } from '~/controllers/payController';
const router = Router();


router.post('/create-payment',accessTokenValidator, catchError(createPaymentLink));
router.post('/webhook', catchError(handleWebhook));
export default router;
