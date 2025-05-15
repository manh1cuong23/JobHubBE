import { Request } from 'express';
import path from 'path';
import sharp from 'sharp';
import { getFiles, handleUploadImage, handleUploadPDF, handleUploadVideo } from '~/utils/file';
import fs from 'fs-extra';
import { env, isProduction } from '~/constants/config';
import { Media, MediaType } from '~/constants/enum';
import { UploadFileToS3 } from '~/utils/s3';
import { CompleteMultipartUploadOutput } from '@aws-sdk/client-s3';
import mime from 'mime-types';

class MediasService {
  constructor() {}

  async handleUploadImage(req: Request) {
    sharp.cache(false);
    const filesUploaded = await handleUploadImage(req);
    const result: Media[] = await Promise.all(
      filesUploaded.map(async (fileUploaded) => {
        const newPath = path.resolve('uploads/images') + `\\${fileUploaded.newFilename.split('.')[0]}.jpg`;
        const info = await sharp(fileUploaded.filepath).jpeg({ quality: 90 });
        await info.toFile(newPath);
        const s3Result = await UploadFileToS3(
          'images/' + fileUploaded.newFilename,
          newPath,
          mime.lookup(newPath) as string
        );
        await Promise.all([fs.remove(newPath), fs.remove(fileUploaded.filepath)]);
        return {
          url: (s3Result as CompleteMultipartUploadOutput).Location as string,
          type: MediaType.Image
        };
      })
    );
    return result;
  }

  async handleUploadPDF(req: Request) {
    const filesUploaded = await handleUploadPDF(req);
    const result: Media[] = await Promise.all(
      filesUploaded.map(async (fileUploaded) => {
        const newPath = path.resolve('uploads/pdfs') + `/${fileUploaded.newFilename.split('.')[0]}.pdf`;
        const s3Result = await UploadFileToS3(
          'pdfs/' + fileUploaded.newFilename,
          newPath,
          mime.lookup(newPath) as string
        );
        await Promise.all([fs.remove(newPath), fs.remove(fileUploaded.filepath)]);
        return {
          url: (s3Result as CompleteMultipartUploadOutput).Location as string,
          type: MediaType.PDF
        };
      })
    );
    return result;
  }

  async handleUploadVideo(req: Request) {
    const filesUploaded = await handleUploadVideo(req);
    const result: Media[] = await Promise.all(
      filesUploaded.map(async (fileUploaded) => {
        const s3Result = await UploadFileToS3(
          'videos/' + fileUploaded.newFilename,
          fileUploaded.filepath,
          mime.lookup(fileUploaded.filepath) as string
        );
        await fs.remove(fileUploaded.filepath);
        return {
          url: (s3Result as CompleteMultipartUploadOutput).Location as string,
          type: MediaType.Video
        };
      })
    );
    return result;
  }
}

const mediasService = new MediasService();
export default mediasService;
