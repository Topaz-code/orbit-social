import { Request, Response, NextFunction } from 'express';
import path from 'path';

export const uploadController = {
  uploadSingle(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const category = ((req.file as any).targetCategory || req.query.category || req.body.category || 'posts') as string;
      const fileUrl = `/uploads/${category}/${req.file.filename}`;

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          url: fileUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  uploadMultiple(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files uploaded' });
      }

      const uploadedFiles = files.map((file) => {
        const category = ((file as any).targetCategory || req.query.category || req.body.category || 'posts') as string;
        return {
          url: `/uploads/${category}/${file.filename}`,
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        };
      });

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
