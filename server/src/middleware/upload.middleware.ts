import { Request, Response, NextFunction } from 'express';
import { upload } from '../config/upload.js';

export const handleSingleUpload = (fieldName = 'file') => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(fieldName)(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
        });
      }
      next();
    });
  };
};

export const handleMultipleUpload = (fieldName = 'files', maxCount = 5) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.array(fieldName, maxCount)(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Files upload failed',
        });
      }
      next();
    });
  };
};
