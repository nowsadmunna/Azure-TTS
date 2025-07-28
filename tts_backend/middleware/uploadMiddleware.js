import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config/config.js';

// Configure upload directory
const uploadDir = path.resolve('uploads');
await fs.mkdir(uploadDir, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});

export const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isValidFile = config.upload.allowedExtensions.includes(ext);
    
    if (!isValidFile) {
      console.log(`❌ Invalid file type: ${ext}`);
      return cb(new Error(`Invalid file type. Allowed: ${config.upload.allowedExtensions.join(', ')}`));
    }
    
    console.log(`✅ Valid file type: ${ext}`);
    cb(null, true);
  }
});

/**
 * Clean up temporary files
 * @param {string[]} filePaths - Array of file paths to delete
 */
export async function cleanupFiles(filePaths) {
  console.log('🧹 Cleaning up temporary files...');
  
  const cleanupPromises = filePaths.map(filePath => 
    fs.unlink(filePath).catch((err) => 
      console.log(`Failed to delete ${path.basename(filePath)}: ${err.message}`)
    )
  );
  
  await Promise.all(cleanupPromises);
}
