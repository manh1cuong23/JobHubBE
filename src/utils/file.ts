import path from 'path';
import { Request, Response } from 'express';
import { ErrorWithStatus } from '~/models/Errors';
import { httpStatus } from '~/constants/httpStatus';
import { File } from 'formidable';
import fs from 'fs-extra';

export const handleUploadImage = async (req: Request) => {
  const formidable = (await import('formidable')).default;
  const form = formidable({
    uploadDir: path.resolve('uploads/temp'),
    maxFiles: 10,
    keepExtensions: true,
    maxFileSize: 20 * 1024 * 1024, // 20MB
    maxTotalFileSize: 200 * 1024 * 1024, // 200MB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'));
      if (!valid) {
        form.emit(
          'error' as any,
          new ErrorWithStatus({
            status: httpStatus.BAD_REQUEST,
            message: 'Invalid file type'
          }) as any
        );
      }
      return valid;
    }
  });
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      }
      if (!files.image) {
        reject(
          new ErrorWithStatus({
            status: httpStatus.BAD_REQUEST,
            message: 'Required file is missing'
          }) as any
        );
      }
      resolve(files.image as File[]);
    });
  });
};

export const handleUploadVideo = async (req: Request) => {
  const formidable = (await import('formidable')).default;
  const form = formidable({
    uploadDir: path.resolve('uploads/videos'),
    maxFiles: 5,
    keepExtensions: true,
    maxFileSize: 100 * 1024 * 1024, // 50MB
    maxTotalFileSize: 250 * 1024 * 1024, // 250MB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('quicktime'));
      if (!valid) {
        form.emit(
          'error' as any,
          new ErrorWithStatus({
            status: httpStatus.BAD_REQUEST,
            message: 'Invalid file type'
          }) as any
        );
      }
      return valid;
    }
  });
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      }
      if (!files.video) {
        reject(
          new ErrorWithStatus({
            status: httpStatus.BAD_REQUEST,
            message: 'Required file is missing'
          }) as any
        );
      }
      resolve(files.video as File[]);
    });
  });
};

export const getFiles = (dir: string, files: string[] = []) => {
  // Get an array of all files and directories in the passed directory using fs.readdirSync
  const fileList = fs.readdirSync(dir);
  // Create the full path of the file/directory by concatenating the passed directory and file/directory name
  for (const file of fileList) {
    const name = `${dir}/${file}`;
    // Check if the current file/directory is a directory using fs.statSync
    if (fs.statSync(name).isDirectory()) {
      // If it is a directory, recursively call the getFiles function with the directory path and the files array
      getFiles(name, files);
    } else {
      // If it is a file, push the full path to the files array
      files.push(name);
    }
  }
  return files;
};

export const handleUploadPDF = async (req: Request) => {
  const formidable = (await import('formidable')).default;
  const form = formidable({
    uploadDir: path.resolve('uploads/pdfs'),
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 250 * 1024 * 1024, // 250MB
    maxTotalFileSize: 250 * 1024 * 1024, // 250MB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'pdf' && mimetype === 'application/pdf';
      if (!valid) {
        form.emit(
          'error' as any,
          new ErrorWithStatus({
            status: httpStatus.BAD_REQUEST,
            message: 'Invalid file type. Only PDF files are allowed.'
          }) as any
        );
      }
      return valid;
    }
  });
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      }
      if (!files.pdf) {
        reject(
          new ErrorWithStatus({
            status: httpStatus.BAD_REQUEST,
            message: 'Required PDF file is missing'
          }) as any
        );
      }
      resolve(files.pdf as File[]);
    });
  });
};
