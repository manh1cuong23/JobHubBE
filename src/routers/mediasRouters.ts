import { Router } from 'express';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
import { uploadImage, uploadPDF, uploadVideo } from '~/controllers/mediasControllers';

const router = Router();
router.post('/upload-image', accessTokenValidator, verifiedUserValidator, catchError(uploadImage));
router.post('/upload-pdf', accessTokenValidator, verifiedUserValidator, catchError(uploadPDF));
router.post('/upload-video', accessTokenValidator, verifiedUserValidator, catchError(uploadVideo));

export default router;
