import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
import { Router } from 'express';
import {
  applyJobController,
  cancelApplyJobController,
  getListApplyJobController,
  searchJobController,
  evaluateEmployerController,
  getListInvitedJobController,
  getDetailProfileEmployerController,
  getListJobController
} from '~/controllers/candidatesControllers';
import { getListEmployer } from '~/controllers/employerControllers';
const router = Router();

router.post('/evaluate-employer/:id', accessTokenValidator, catchError(evaluateEmployerController));

router.post('/apply-job/:id', accessTokenValidator, catchError(applyJobController));
router.delete('/cancel-apply-job/:id', accessTokenValidator, catchError(cancelApplyJobController));

router.get('/list-apply-job', accessTokenValidator, catchError(getListApplyJobController));
router.get('/list-invited-job', accessTokenValidator, catchError(getListInvitedJobController));

router.get('/search-job', accessTokenValidator, catchError(searchJobController));
router.get('/employer-detail/:id', accessTokenValidator, catchError(getDetailProfileEmployerController));
router.get('/employer-jobs/:id', accessTokenValidator, catchError(getListJobController));
router.get('/list-employer', accessTokenValidator, catchError(getListEmployer));

export default router;
