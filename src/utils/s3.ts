import { Upload } from '@aws-sdk/lib-storage';
import { S3 } from '@aws-sdk/client-s3';
import fs from 'fs';
import { Response } from 'express';
import { httpStatus } from '~/constants/httpStatus';
import { env } from '~/constants/config';
const s3 = new S3({
  region: env.AWSRegion,
  credentials: {
    secretAccessKey: env.AWSSecretAccessKey as string,
    accessKeyId: env.AWSAccessKeyID as string
  }
});

export const UploadFileToS3 = async (fileName: string, filePath: string, fileType: string) => {
  const parallelUploads3 = new Upload({
    client: s3,
    params: { Bucket: env.S3Name, Key: fileName, Body: fs.readFileSync(filePath), ContentType: fileType },

    tags: [
      /*...*/
    ], // optional tags
    queueSize: 4, // optional concurrency configuration
    partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
    leavePartsOnError: false // optional manually handle dropped parts
  });

  return parallelUploads3.done();
};

export const sendFileFromS3 = async (res: Response, filePath: string) => {
  try {
    const data = await s3.getObject({
      Bucket: env.S3Name,
      Key: filePath
    });
    (data.Body as any).pipe(res);
  } catch (e) {
    res.status(httpStatus.NOT_FOUND).json(e);
  }
};
