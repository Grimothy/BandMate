import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import fs from 'fs';
import { ensureDir, getCutAudioPath, getCutStemsPath } from './folders';

// Ensure legacy upload directories exist (for images)
ensureDir(config.uploads.images);

// Image upload configuration
const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploads.images);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const imageFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
  }
};

export const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Audio upload configuration
const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploads.audio);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const audioFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/ogg',
    'audio/flac',
    'audio/aac',
    'audio/m4a',
    'audio/x-m4a',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP3, WAV, OGG, FLAC, AAC, and M4A are allowed.'));
  }
};

export const uploadAudio = multer({
  storage: audioStorage,
  fileFilter: audioFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// Stem upload configuration (zip files)
const stemStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploads.stems);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const stemFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-zip',
    'application/octet-stream', // Some browsers send zip as octet-stream
  ];
  // Also check extension as fallback
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(file.mimetype) || ext === '.zip') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only ZIP files are allowed for stems.'));
  }
};

export const uploadStem = multer({
  storage: stemStorage,
  fileFilter: stemFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB for stems
  },
});

// Helper to delete a file
export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// ============================================
// Hierarchical Upload Functions (using slugs)
// ============================================

// Request interface for hierarchical uploads
export interface HierarchicalUploadRequest extends Express.Request {
  uploadContext?: {
    projectSlug: string;
    vibeSlug: string;
    cutSlug: string;
  };
  body: {
    [key: string]: any;
  };
}

/**
 * Creates a multer storage that saves audio files to cut's audio folder
 * Requires uploadContext to be set on request (by prepareFileUpload middleware)
 */
const createCutAudioStorage = () => multer.diskStorage({
  destination: (req: HierarchicalUploadRequest, _file, cb) => {
    const ctx = req.uploadContext;
    if (!ctx || !ctx.projectSlug || !ctx.vibeSlug || !ctx.cutSlug) {
      cb(new Error('Upload context not set. Ensure prepareFileUpload middleware runs first.'), '');
      return;
    }
    const destPath = getCutAudioPath(ctx.projectSlug, ctx.vibeSlug, ctx.cutSlug);
    ensureDir(destPath);
    cb(null, destPath);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

/**
 * Creates a multer storage that saves stem files to cut's stems folder
 * Requires uploadContext to be set on request (by prepareFileUpload middleware)
 */
const createCutStemStorage = () => multer.diskStorage({
  destination: (req: HierarchicalUploadRequest, _file, cb) => {
    const ctx = req.uploadContext;
    if (!ctx || !ctx.projectSlug || !ctx.vibeSlug || !ctx.cutSlug) {
      cb(new Error('Upload context not set. Ensure prepareFileUpload middleware runs first.'), '');
      return;
    }
    const destPath = getCutStemsPath(ctx.projectSlug, ctx.vibeSlug, ctx.cutSlug);
    ensureDir(destPath);
    cb(null, destPath);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

/**
 * Multer middleware for uploading audio to a cut's audio folder
 * Request must have uploadContext set by prepareFileUpload middleware
 */
export const uploadCutAudio = multer({
  storage: createCutAudioStorage(),
  fileFilter: audioFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

/**
 * Multer middleware for uploading stems to a cut's stems folder
 * Request must have uploadContext set by prepareFileUpload middleware
 */
export const uploadCutStem = multer({
  storage: createCutStemStorage(),
  fileFilter: stemFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB for stems
  },
});

/**
 * Helper to get the relative path for a file in cut's audio folder
 */
export function getCutAudioFilePath(projectSlug: string, vibeSlug: string, cutSlug: string, filename: string): string {
  return path.join(getCutAudioPath(projectSlug, vibeSlug, cutSlug), filename);
}

/**
 * Helper to get the relative path for a file in cut's stems folder
 */
export function getCutStemFilePath(projectSlug: string, vibeSlug: string, cutSlug: string, filename: string): string {
  return path.join(getCutStemsPath(projectSlug, vibeSlug, cutSlug), filename);
}
