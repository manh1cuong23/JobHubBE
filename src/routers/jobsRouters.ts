import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
import { Router } from 'express';
import { isAdminJobValidator, isEmployerValidator } from '~/middlewares/commonMiddlewares';
import {
  createJobController,
  deleteJobController,
  getJobController,
  getListCandidateApplyJobController,
  getListJobController,
  makeFailController,
  makeInterviewController,
  makePassController,
  recruitmentJobController,
  rejectCandidateController,
  approveCandidateController,
  updateJobController,
  candidateAcceptInvite,
  inviteCandidateController,
  acceptScheduleController,
  candidateChangeInterviewSchedule,
  getListCountCandidateController,
  changeStatusJob
} from '~/controllers/jobsControllers';
const router = Router();

router.post('/', accessTokenValidator, isEmployerValidator, catchError(createJobController));
router.get('/count/:id', accessTokenValidator, isEmployerValidator, catchError(getListCountCandidateController));
router.get('/list', accessTokenValidator, catchError(getListJobController));

router.put('/recruitment/:id', accessTokenValidator, isAdminJobValidator, catchError(recruitmentJobController));

router.get(
  '/candidates/:id',
  accessTokenValidator,
  isAdminJobValidator,
  catchError(getListCandidateApplyJobController)
);

router.post('/approve/:id', accessTokenValidator, catchError(approveCandidateController));

router.post('/reject/:id', accessTokenValidator, catchError(rejectCandidateController));

router.post('/make-interview/:id', accessTokenValidator, catchError(makeInterviewController));

router.post('/make-pass/:id', accessTokenValidator, catchError(makePassController));

router.post('/make-fail/:id', accessTokenValidator, catchError(makeFailController));

router.post('/invite/:id', accessTokenValidator, catchError(inviteCandidateController));
router.post('/candidate-accept-invite/:id', accessTokenValidator, catchError(candidateAcceptInvite));

router.post('/accept-schedule/:id', accessTokenValidator, catchError(acceptScheduleController));

router.post('/candidate-change-schedule/:id', accessTokenValidator, catchError(candidateChangeInterviewSchedule));

router.put('/:id', accessTokenValidator, isAdminJobValidator, catchError(updateJobController));
router.put('/change-status/:id', accessTokenValidator, catchError(changeStatusJob));
router.get('/:id', accessTokenValidator, catchError(getJobController));
router.delete('/:id', accessTokenValidator, isAdminJobValidator, catchError(deleteJobController));

export default router;
