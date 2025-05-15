import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
import { Router } from 'express';
import { getinforAppyController } from '~/controllers/applyJobController';
;
const router = Router();


router.get('/:id', accessTokenValidator, catchError(getinforAppyController));

export default router;
