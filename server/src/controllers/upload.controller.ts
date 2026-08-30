import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { uploadMediaBuffer } from '../config/storage.js';

export const uploadController = {
  async uploadSingle(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const category = ((req.file as any).targetCategory || req.query.category || req.body.category || 'posts') as string;
      const fileBuffer = fs.readFileSync(req.file.path);
      const result = await uploadMediaBuffer(fileBuffer, req.file.filename, req.file.mimetype, category);

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          url: result.url,
          filename: result.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: result.size,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async uploadMultiple(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files uploaded' });
      }

      const uploadPromises = files.map(async (file) => {
        const category = ((file as any).targetCategory || req.query.category || req.body.category || 'posts') as string;
        const fileBuffer = fs.readFileSync(file.path);
        const result = await uploadMediaBuffer(fileBuffer, file.filename, file.mimetype, category);
        return {
          url: result.url,
          filename: result.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: result.size,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      res.status(201).json({
        success: true,
        message: 'Files uploaded successfully',
        data: uploadedFiles,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

