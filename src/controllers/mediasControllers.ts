import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import mediasService from '~/services/mediaServices';
import { sendFileFromS3 } from '~/utils/s3';

export const uploadImage = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await mediasService.handleUploadImage(req);
  res.status(200).json({
    result,
    message: 'Upload image suscess'
  });
};

export const uploadPDF = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await mediasService.handleUploadPDF(req);
  res.status(200).json({
    result,
    message: 'Upload PDF suscess'
  });
};

export const uploadVideo = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await mediasService.handleUploadVideo(req);
  res.status(200).json({
    result,
    message: 'Upload video suscess'
  });
};
