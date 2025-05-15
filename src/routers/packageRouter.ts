import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
import { Router } from 'express';
import { createPackageController, deletePackageController, getDetailController, getPackageController, updatePackageController } from '~/controllers/packageController';
const router = Router();


router.post('/create',accessTokenValidator, catchError(createPackageController));
router.put('/update/:id', accessTokenValidator,catchError(updatePackageController));
router.get('/get',accessTokenValidator, catchError(getPackageController));
router.get('/get/:id',accessTokenValidator, catchError(getDetailController));
router.delete('/delete/:id',accessTokenValidator, catchError(deletePackageController));
export default router;
