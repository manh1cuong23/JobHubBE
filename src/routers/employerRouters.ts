import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
import { Router } from 'express';
import {
  getListCandicateController,
  getListEvaluationController,
  verifyEmployerController
} from '~/controllers/employerControllers';

const router = Router();

router.post('/request-verification', accessTokenValidator, catchError(verifyEmployerController));
router.get('/get-candicate', accessTokenValidator, catchError(getListCandicateController));
router.get('/evaluation/:id', accessTokenValidator, catchError(getListEvaluationController));

export default router;
