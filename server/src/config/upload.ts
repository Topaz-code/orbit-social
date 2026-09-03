import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');
const SUBDIRECTORIES = ['avatars', 'covers', 'posts', 'stories', 'messages', 'groups', 'audio'];

// Whitelist of allowed extensions
// FIX 2 (root cause #2 — server side): `.m4a` / `.aac` / `.amr` were missing.
// expo-av (iOS + Android) records voice notes as AAC audio inside an MPEG-4
// container, and browsers' MediaRecorder emits `audio/mp4` on Safari/iOS.
// Without these, every voice note was rejected by `fileFilter` below.
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
  '.m4a',
  '.aac',
  '.amr',
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
    const category = (req.query.category || req.body.category || 'posts') as string;
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9_-]/g, '');
    const finalCategory = SUBDIRECTORIES.includes(sanitizedCategory) ? sanitizedCategory : 'posts';
    (file as any).targetCategory = finalCategory;
    const targetDir = path.join(UPLOAD_ROOT, finalCategory);
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
    'audio/x-wav',
    'audio/wave',
    'audio/webm',
    'audio/ogg',
    // Voice notes. AAC in an MPEG-4 container is reported as `audio/mp4`
    // (expo-av on Android, Safari/iOS) or `audio/x-m4a` (expo-av on iOS).
    // `.mp4` was already in ALLOWED_EXTENSIONS, so the *extension* passed while
    // the *mimetype* did not — hence "Unsupported file type or extension:
    // audio/mp4 (.mp4)".
    'audio/mp4',
    'audio/x-m4a',
    'audio/m4a',
    'audio/aac',
    'audio/x-aac',
    'audio/amr',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimeTypes.includes(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    // A rejected file is a client error (400), not a server fault (500). The
    // global errorHandler reads `err.statusCode`, so tag it here — otherwise
    // every voice-note rejection surfaced to the app as an HTTP 500.
    const rejection = new Error(
      `Unsupported file type or extension: ${file.mimetype} (${ext})`
    ) as Error & { statusCode?: number };
    rejection.statusCode = 400;
    cb(rejection);
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
