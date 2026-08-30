import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');
const SUBDIRECTORIES = ['avatars', 'covers', 'posts', 'stories', 'messages', 'groups', 'audio'];

// Whitelist of allowed extensions
const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.mp4',
  '.webm',
  '.mov',
  '.mp3',
  '.wav',
  '.ogg',
  '.pdf',
  '.txt',
  '.doc',
  '.docx',
]);

// Blocked dangerous extensions
const DANGEROUS_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.php',
  '.phtml',
  '.js',
  '.html',
  '.htm',
  '.svg',
  '.cgi',
  '.py',
  '.ps1',
]);

// Ensure all upload directories exist
for (const sub of SUBDIRECTORIES) {
  const dirPath = path.join(UPLOAD_ROOT, sub);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const category = (req.body.category || req.query.category || 'posts') as string;
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9_-]/g, '');
    const targetDir = SUBDIRECTORIES.includes(sanitizedCategory)
      ? path.join(UPLOAD_ROOT, sanitizedCategory)
      : path.join(UPLOAD_ROOT, 'posts');
    cb(null, targetDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Validate extension
    if (DANGEROUS_EXTENSIONS.has(ext) || !ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error(`Forbidden file extension: ${ext}`), '');
    }
    // Fully randomized filename prevents directory traversal and overwrites
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return cb(new Error(`Forbidden file extension: ${ext}`));
  }

  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimeTypes.includes(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type or extension: ${file.mimetype} (${ext})`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 52428800, // 50 MB max
    files: 10,
  },
});
