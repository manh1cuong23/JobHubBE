import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
import { Router } from 'express';
import { createBlog, deleteBlog, getDetailBlog, getListAccountController, getListBlog, getListEvaluationAdminController, makeActiveAccount, makeActiveEnvalution, makeInActiveAccount, updateBlog } from '~/controllers/adminControllers';
import { searchJobController } from '~/controllers/candidatesControllers';

const router = Router();

router.get('/list-accounts', accessTokenValidator, catchError(getListAccountController));

router.put(
  '/accounts/:id/block',
  accessTokenValidator,
  catchError(makeInActiveAccount)
);

router.put(
  '/accounts/:id/unblock',
  accessTokenValidator,
  catchError(makeActiveAccount)
);

router.put(
  '/envalution/:id/active',
  accessTokenValidator,
  catchError(makeActiveEnvalution)
);
router.get('/list-jobs', accessTokenValidator, catchError(searchJobController));
router.get('/list-envalutions', accessTokenValidator, catchError(getListEvaluationAdminController));

router.get(
  '/accounts/:id/detail',
  accessTokenValidator,
  catchError(() => { })
);

router.get(
  '/list/verify-requests',
  accessTokenValidator,
  catchError(() => { })
);

router.post(
  '/verify-requests/:id/approve',
  accessTokenValidator,
  catchError(() => { })
);

router.post(
  '/verify-requests/:id/reject',
  accessTokenValidator,
  catchError(() => { })
);

router.post('/createBlog', accessTokenValidator, catchError(createBlog));
router.put('/updateBlog', accessTokenValidator, catchError(updateBlog));
router.delete('/deleteBlog/:id', accessTokenValidator, catchError(deleteBlog));
router.get('/getListBlog', accessTokenValidator, catchError(getListBlog));
router.get('/getDetailBlog/:id', accessTokenValidator, catchError(getDetailBlog));

export default router;
