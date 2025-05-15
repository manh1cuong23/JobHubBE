import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
import { Router } from 'express';
import { getCitiesController, getFieldsController, getSkillsController } from '~/controllers/otherController';
const router = Router();

router.get('/cities', catchError(getCitiesController));

router.get('/fields', catchError(getFieldsController));

router.get('/skills/:fieldId?', catchError(getSkillsController));

export default router;
